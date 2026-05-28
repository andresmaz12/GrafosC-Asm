"""Convierte un FlowchartState (JSON proveniente de la UI Next.js) en un AST
de C usando los nodos de ``TRADUCCION_C/AST_C.py``.

Estrategia:
- Cada figura ``start-end`` con ``isStart=true`` define una funcion.
- Se construye un grafo a partir de ``connections`` y se recorre desde el
  inicio en orden topologico simple (siguiendo aristas ``default`` o
  conexiones de ``decision`` segun corresponda) hasta encontrar un
  ``return`` o un ``start-end`` con ``isStart=false``.
- Las decisiones (``decision``) producen ``NodoCondicional`` (if) o
  ``NodoWhile`` segun ``data.conditionalType``.

El conversor es deliberadamente tolerante: si un nodo carece de
``data`` estructurada cae a un parseo basico de ``content``.
"""

from __future__ import annotations

import re
import sys
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)
sys.path.insert(0, os.path.join(ROOT, "TRADUCCION_C"))

from AST_C import ( 
    NodoPrograma, NodoFuncion, NodoParametro, NodoAsignacion, NodoReasignacion,
    NodoOperacion, NodoIdent, NodoNumero, NodoString, NodoLlamadaFuncion,
    NodoCondicional, NodoWhile, NodoRetorno, NodoImprimir, NodoIncremento, NodoFor,
    NodoEntrada,
)


# ============================================================
# Mini parser de expresiones (para campos de texto libre)
# ============================================================

_OP_PATTERN = re.compile(r"\s*(==|!=|<=|>=|\+|\-|\*|/|<|>)\s*")


def _parse_init_or_increment(text):
    if text is None:
        return None
    text = str(text).strip()
    if not text:
        return None
    # i++ or i--
    m_inc = re.match(r"^(\w+)\s*(\+\+|\-\-);?$", text)
    if m_inc:
        return NodoIncremento(("IDENTIFIER", m_inc.group(1)), ("OPERATOR", m_inc.group(2)))
    # int i = 0
    m_decl = re.match(r"^(int|float|char|bool|string)\s+(\w+)\s*=\s*(.*);?$", text)
    if m_decl:
        tipo = m_decl.group(1)
        nombre = m_decl.group(2)
        valor = m_decl.group(3).strip()
        return NodoAsignacion(("KEYWORD", tipo), ("IDENTIFIER", nombre), _parse_expr(valor))
    # i = 0
    m_assign = re.match(r"^(\w+)\s*=\s*(.*);?$", text)
    if m_assign:
        nombre = m_assign.group(1)
        valor = m_assign.group(2).strip()
        return NodoReasignacion(("IDENTIFIER", nombre), _parse_expr(valor))
    # Fallback
    return _parse_expr(text)

_OP_PATTERN = re.compile(r"\s*(==|!=|<=|>=|\+|\-|\*|/|<|>)\s*")


def _parse_expr(text):
    """Convierte un string como ``"x + 1"`` en un nodo del AST.

    Solo cubre lo necesario para los campos del editor (numeros,
    identificadores, strings con comillas, una operacion binaria).
    """
    if text is None:
        return NodoNumero(("NUMBER", "0"))
    text = str(text).strip()
    # Normalizar operadores unicode comunes a sintaxis estandar
    text = text.replace("≤", "<=").replace("≥", ">=").replace("≠", "!=")
    if not text:
        return NodoNumero(("NUMBER", "0"))

    if (text.startswith('"') and text.endswith('"')) or (text.startswith("'") and text.endswith("'")):
        return NodoString(("STRING", text))

    m = _OP_PATTERN.search(text)
    if m:
        izq = text[: m.start()].strip()
        der = text[m.end() :].strip()
        op = m.group(1)
        return NodoOperacion(_parse_atom(izq), ("OPERATOR", op), _parse_atom(der))

    return _parse_atom(text)


def _parse_atom(text):
    text = text.strip()
    if not text:
        return NodoNumero(("NUMBER", "0"))
    try:
        int(text)
        return NodoNumero(("NUMBER", text))
    except ValueError:
        pass
    try:
        float(text)
        return NodoNumero(("NUMBER", text))
    except ValueError:
        pass
    if (text.startswith('"') and text.endswith('"')) or (text.startswith("'") and text.endswith("'")):
        return NodoString(("STRING", text))
    return NodoIdent(("IDENTIFIER", text))


# ============================================================
# Traversal del flowchart
# ============================================================

class _Builder:
    def __init__(self, state, warnings):
        self.nodes_by_id = {n["id"]: n for n in state.get("nodes", [])}
        self.connections = state.get("connections", [])
        self.warnings = warnings
        self._stop_ids: set[str] = set()

    def out_edges(self, node_id):
        return [c for c in self.connections if c.get("sourceId") == node_id]

    def first_default_target(self, node_id):
        edges = self.out_edges(node_id)
        if not edges:
            return None
        for e in edges:
            t = (e.get("type") or "").lower()
            if t in ("", "default"):
                return e.get("targetId")
        return edges[0].get("targetId")

    def branch_target(self, node_id, branch):
        for e in self.out_edges(node_id):
            t = (e.get("type") or "").lower()
            if t == branch:
                return e.get("targetId")
        for e in self.out_edges(node_id):
            label = (e.get("label") or "").lower()
            if branch == "yes" and label in ("si", "sí", "yes", "true"):
                return e.get("targetId")
            if branch == "no" and label in ("no", "false"):
                return e.get("targetId")
        return None

    def _reaches_node(self, start, target, limit=200):
        """Comprueba si desde ``start`` se puede llegar a ``target``
        siguiendo las aristas del grafo (BFS acotado).  Se usa para
        detectar back-edges que forman ciclos (while loops)."""
        visited = set()
        queue = [start]
        steps = 0
        while queue and steps < limit:
            cur = queue.pop(0)
            if cur == target:
                return True
            if cur in visited:
                continue
            visited.add(cur)
            for e in self.out_edges(cur):
                queue.append(e.get("targetId"))
            steps += 1
        return False

    def build_block(self, start_id, stop_at: set[str] | None = None):
        """Construye una lista de nodos de AST recorriendo el grafo.

        Se detiene al llegar a un id en ``stop_at`` o a un nodo
        ``start-end`` con ``isStart=false`` o un ``return``.
        """
        stop_at = stop_at or set()
        instrucciones = []
        visitados = set()
        current_id = start_id

        while current_id and current_id not in stop_at:
            if current_id in visitados:
                self.warnings.append(f"Ciclo detectado en nodo '{current_id}', se corta el recorrido")
                break
            visitados.add(current_id)
            node = self.nodes_by_id.get(current_id)
            if node is None:
                break

            ntype = node.get("type")
            data = node.get("data") or {}

            if ntype == "start-end":
                is_start = data.get("isStart", True)
                content_lower = (node.get("content") or "").strip().lower()
                if content_lower.startswith("fin") or content_lower.startswith("end"):
                    is_start = False

                if not is_start:
                    break
                next_id = self.first_default_target(current_id)
                current_id = next_id
                continue

            if ntype == "input-output":
                instrucciones.append(_node_input_output(node))
                current_id = self.first_default_target(current_id)
                continue

            if ntype == "process":
                instr = _node_process(node)
                if instr is not None:
                    if isinstance(instr, list):
                        instrucciones.extend(instr)
                    else:
                        instrucciones.append(instr)
                current_id = self.first_default_target(current_id)
                continue

            if ntype == "subprocess":
                instrucciones.append(_node_subprocess(node))
                current_id = self.first_default_target(current_id)
                continue

            if ntype == "return":
                instrucciones.append(_node_return(node))
                break

            if ntype == "decision":
                cond_type = data.get("conditionalType", "if")
                condicion = _parse_expr(data.get("condition") or _strip_keyword(node.get("content", "")))

                # Variables para el while (se llenan por auto-deteccion o
                # por la rama explicita de cond_type=="while").
                body_target = None
                after_target = None

                # --- Auto-deteccion de while ---
                # Si el tipo es "if" (o default), verificamos si alguna
                # rama forma un back-edge al propio nodo decision,
                # lo que indica un patron de ciclo (while loop).
                if cond_type == "if":
                    yes_t = self.branch_target(current_id, "yes")
                    no_t = self.branch_target(current_id, "no")
                    if yes_t is None or no_t is None:
                        edges = self.out_edges(current_id)
                        if yes_t is None and edges:
                            yes_t = edges[0].get("targetId")
                        if no_t is None and len(edges) > 1:
                            no_t = edges[1].get("targetId")

                    yes_loops = yes_t is not None and self._reaches_node(yes_t, current_id)
                    no_loops = no_t is not None and self._reaches_node(no_t, current_id)

                    if yes_loops or no_loops:
                        # La rama que cicla es el cuerpo; la otra es la salida.
                        if yes_loops:
                            body_target, after_target = yes_t, no_t
                        else:
                            body_target, after_target = no_t, yes_t
                        cond_type = "while"

                if cond_type == "for":
                    init_node = _parse_init_or_increment(data.get("init", ""))
                    cond_node = _parse_expr(data.get("condition") or _strip_keyword(node.get("content", "")))
                    inc_node = _parse_init_or_increment(data.get("increment", ""))

                    body_target = self.branch_target(current_id, "yes")
                    after_target = self.branch_target(current_id, "no")
                    if body_target is None:
                        edges = self.out_edges(current_id)
                        if edges:
                            body_target = edges[0].get("targetId")
                        if len(edges) > 1:
                            after_target = edges[1].get("targetId")

                    cuerpo = self.build_block(body_target, stop_at | ({current_id} if body_target else set()))
                    instrucciones.append(NodoFor(init_node, cond_node, inc_node, cuerpo))
                    current_id = after_target
                    continue

                if cond_type == "while":
                    if body_target is None:
                        body_target = self.branch_target(current_id, "yes")
                        after_target = self.branch_target(current_id, "no")
                        if body_target is None:
                            edges = self.out_edges(current_id)
                            if edges:
                                body_target = edges[0].get("targetId")
                            if len(edges) > 1:
                                after_target = edges[1].get("targetId")
                    cuerpo = self.build_block(body_target, stop_at | ({current_id} if body_target else set()))
                    instrucciones.append(NodoWhile(condicion, cuerpo))
                    current_id = after_target
                    continue

                yes_target = self.branch_target(current_id, "yes")
                no_target = self.branch_target(current_id, "no")
                if yes_target is None or no_target is None:
                    edges = self.out_edges(current_id)
                    if yes_target is None and edges:
                        yes_target = edges[0].get("targetId")
                    if no_target is None and len(edges) > 1:
                        no_target = edges[1].get("targetId")

                join = _find_join(self, yes_target, no_target)
                stop_branches = stop_at | ({join} if join else set())
                cuerpo_if = self.build_block(yes_target, stop_branches) if yes_target else []
                cuerpo_else = self.build_block(no_target, stop_branches) if no_target else []
                instrucciones.append(NodoCondicional(condicion, cuerpo_if, cuerpo_else))
                current_id = join
                continue

            self.warnings.append(f"Tipo de figura desconocido: '{ntype}'")
            current_id = self.first_default_target(current_id)

        return instrucciones


# ============================================================
# Mappers por tipo de figura
# ============================================================

def _node_input_output(node):
    data = node.get("data") or {}
    mode = data.get("mode", "declare")
    var = data.get("variable") or {}
    nombre = var.get("name", "")
    tipo = var.get("type", "")
    valor = var.get("value")

    # Dar prioridad al contenido visual (lo que el usuario escribio en la figura)
    content = (node.get("content") or "").strip()
    
    # Si el contenido visual tiene formato de scanf
    m_scanf = re.match(r"scanf\s*\(\s*\"?([a-zA-Z_]\w*)\"?\s*\)", content)
    if m_scanf:
        mode = "scanf"
        nombre = m_scanf.group(1)
    elif content:
        # Intentar matchear "int x = 5"
        m = re.match(r"(int|float|char|bool|string)\s+(\w+)\s*=\s*(.*)", content)
        if m:
            tipo = m.group(1)
            nombre = m.group(2)
            valor = m.group(3).strip() or "0"
            mode = "declare"
        else:
            # Intentar matchear "x = 5"
            m2 = re.match(r"(\w+)\s*=\s*(.*)", content)
            if m2 and m2.group(1) not in ("int", "float", "char", "bool", "string"):
                nombre = m2.group(1)
                valor = m2.group(2).strip() or "0"
                mode = "declare"

    nombre = nombre or "var"
    tipo = tipo or "int"

    if mode == "scanf":
        fmt = '"%d"'
        if tipo == "float":
            fmt = '"%f"'
        elif tipo == "char":
            fmt = '"%c"'
        elif tipo == "string":
            fmt = '"%s"'
        return NodoEntrada(
            ("KEYWORD", tipo),
            NodoString(("STRING", fmt)),
            ("IDENTIFIER", nombre)
        )
    
    valor = valor if valor is not None else "0"
    return NodoAsignacion(("KEYWORD", tipo), ("IDENTIFIER", nombre), _parse_expr(valor))


def _node_process(node):
    data = node.get("data") or {}
    ptype = data.get("processType")
    if ptype == "print":
        contenido = (data.get("printContent") or "").strip()
        
        # Quitar comillas externas si existen
        if (contenido.startswith('"') and contenido.endswith('"')) or (contenido.startswith("'") and contenido.endswith("'")):
            contenido = contenido[1:-1]
            
        pattern = re.compile(r"\{([a-zA-Z_]\w*)\}")
        
        parts = []
        last_idx = 0
        for m in pattern.finditer(contenido):
            text_part = contenido[last_idx:m.start()]
            if text_part:
                parts.append(NodoImprimir(("KEYWORD", "printf"), [NodoString(("STRING", f'"{text_part}"'))]))
            
            var_name = m.group(1)
            parts.append(NodoImprimir(("KEYWORD", "printf"), [NodoIdent(("IDENTIFIER", var_name))]))
            last_idx = m.end()
            
        text_part = contenido[last_idx:]
        if text_part:
            parts.append(NodoImprimir(("KEYWORD", "printf"), [NodoString(("STRING", f'"{text_part}"'))]))
            
        if not parts:
            # Fallback a variable única / expresión sin comillas
            if re.match(r"^[a-zA-Z_]\w*(?:\s*[\+\-\*/<>!=&\|]+\s*[a-zA-Z0-9_\.]+)*$", contenido):
                return [
                    NodoImprimir(("KEYWORD", "printf"), [_parse_expr(contenido)]),
                    NodoImprimir(("KEYWORD", "printf"), [NodoString(("STRING", '"\\n"'))])
                ]
            else:
                # Asegurar salto de línea al final de cadenas estáticas
                if not contenido.endswith("\\n"):
                    contenido += "\\n"
                return NodoImprimir(("KEYWORD", "printf"), [NodoString(("STRING", f'"{contenido}"'))])
                
        # Asegurar salto de línea al final de impresiones con interpolación
        parts.append(NodoImprimir(("KEYWORD", "printf"), [NodoString(("STRING", '"\\n"'))]))
        return parts
    if ptype == "assign":
        nombre = data.get("variableName") or "x"
        return NodoReasignacion(("IDENTIFIER", nombre), _parse_expr(data.get("value")))
    if ptype == "increment":
        nombre = data.get("variableName") or "x"
        amount = data.get("incrementAmount", 1)
        if amount == 1:
            return NodoIncremento(("IDENTIFIER", nombre), ("OPERATOR", "++"))
        expr = NodoOperacion(
            NodoIdent(("IDENTIFIER", nombre)),
            ("OPERATOR", "+"),
            NodoNumero(("NUMBER", str(amount))),
        )
        return NodoReasignacion(("IDENTIFIER", nombre), expr)

    return _fallback_from_content(node.get("content", ""))


def _node_subprocess(node):
    data = node.get("data") or {}
    nombre = data.get("functionName") or "funcion"
    args = [_parse_expr(a) for a in (data.get("arguments") or [])]
    return NodoLlamadaFuncion(("IDENTIFIER", nombre), args)


def _node_return(node):
    data = node.get("data") or {}
    valor = data.get("returnValue", "0")
    return NodoRetorno(_parse_expr(valor))


def _fallback_from_content(content: str):
    return NodoImprimir(("KEYWORD", "/* "), [NodoString(("STRING", f'"{content}"'))])


def _strip_keyword(content: str) -> str:
    s = content.strip()
    for kw in ("if", "while"):
        if s.startswith(kw):
            s = s[len(kw):].strip()
    return s.strip("()")


def _find_join(builder: _Builder, a, b):
    if a is None or b is None:
        return None
    visited = set()
    stack = [a]
    reachable_a = set()
    while stack:
        cur = stack.pop()
        if cur in visited:
            continue
        visited.add(cur)
        reachable_a.add(cur)
        for e in builder.out_edges(cur):
            stack.append(e.get("targetId"))

    visited = set()
    stack = [b]
    while stack:
        cur = stack.pop()
        if cur in visited:
            continue
        visited.add(cur)
        if cur in reachable_a:
            return cur
        for e in builder.out_edges(cur):
            stack.append(e.get("targetId"))
    return None


# ============================================================
# API publica
# ============================================================

def build_program(flowchart_state):
    """Recibe el ``FlowchartState`` parseado (dict) y devuelve un
    ``NodoPrograma`` y la lista de warnings generados."""
    warnings: list[str] = []
    builder = _Builder(flowchart_state, warnings)

    def is_real_start(n):
        if n.get("type") != "start-end": return False
        data = n.get("data") or {}
        is_start = data.get("isStart", True)
        content_lower = (n.get("content") or "").strip().lower()
        if content_lower.startswith("fin") or content_lower.startswith("end"):
            is_start = False
        return is_start

    start_nodes = [
        n for n in flowchart_state.get("nodes", [])
        if is_real_start(n)
    ]

    if not start_nodes:
        warnings.append("No se encontro un nodo 'start-end' con isStart=true")
        return NodoPrograma([], None), warnings

    funciones = []
    main = None
    for sn in start_nodes:
        data = sn.get("data") or {}
        nombre = data.get("functionName") or "main"
        params = [
            NodoParametro(("KEYWORD", p.get("type", "int")), ("IDENTIFIER", p.get("name", "p")))
            for p in (data.get("parameters") or [])
        ]
        first_target = builder.first_default_target(sn["id"])
        cuerpo = builder.build_block(first_target)

        tiene_return = any(isinstance(c, NodoRetorno) for c in cuerpo)
        if not tiene_return:
            cuerpo.append(NodoRetorno(NodoNumero(("NUMBER", "0"))))

        tipo_ret = "int"
        funcion = NodoFuncion(("KEYWORD", tipo_ret), ("IDENTIFIER", nombre), params, cuerpo)
        if nombre == "main":
            if main is None:
                main = funcion
            else:
                warnings.append("Multiples funciones 'main' detectadas. Ignorando duplicados.")
        else:
            funciones.append(funcion)

    if main is None:
        main = funciones.pop(0) if funciones else None

    return NodoPrograma(funciones, main), warnings
