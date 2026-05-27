"""AST de C usado por la pipeline del compilador.

Cada nodo expone dos generadores:
- ``generarCodigoC()``  -> emite codigo C indentado
- ``generarCodigo()``   -> emite codigo Assembler x86 (NASM)

Las clases Nodo* fueron limpiadas de los typos originales del esqueleto
academico (``coidigo``, ``_statrt``, ``der(...)``, ``eps``) y se completaron
los cuerpos para soportar la traduccion de un FlowchartState.
"""


# ============================================================
# Helpers
# ============================================================

def _indent(text: str, level: int = 1) -> str:
    pad = "    " * level
    return "\n".join(pad + line if line else line for line in text.splitlines())


def _tok_value(tok):
    """Acepta tuplas (TIPO, valor) o strings simples."""
    if isinstance(tok, tuple) and len(tok) >= 2:
        return tok[1]
    return str(tok)


def _collect_strings(nodo) -> list:
    if nodo is None:
        return []
    if isinstance(nodo, list):
        res = []
        for item in nodo:
            res.extend(_collect_strings(item))
        return res
    if isinstance(nodo, NodoString):
        return [nodo]
    
    res = []
    if isinstance(nodo, NodoAST):
        for attr in vars(nodo).values():
            if isinstance(attr, NodoAST):
                res.extend(_collect_strings(attr))
            elif isinstance(attr, list):
                for item in attr:
                    if isinstance(item, NodoAST):
                        res.extend(_collect_strings(item))
    return res


# ============================================================
# Base
# ============================================================

class NodoAST:
    """Clase base para todos los nodos del AST."""

    def generarCodigoC(self) -> str:
        raise NotImplementedError(
            f"generarCodigoC() no implementado en {self.__class__.__name__}"
        )

    def generarCodigo(self) -> str:
        raise NotImplementedError(
            f"generarCodigo() (ASM) no implementado en {self.__class__.__name__}"
        )


# ============================================================
# Programa
# ============================================================

class NodoPrograma(NodoAST):
    def __init__(self, funciones, main):
        self.variables = []
        self.funciones = list(funciones) if funciones else []
        self.main = main

    def generarCodigoC(self) -> str:
        partes = [
            "// ============================================",
            "// Codigo generado por Compilador",
            "// ============================================",
            "#include <stdio.h>",
            "#include <stdlib.h>",
            "",
        ]
        for funcion in self.funciones:
            partes.append(funcion.generarCodigoC())
            partes.append("")
        if self.main is not None:
            partes.append(self.main.generarCodigoC())
        return "\n".join(partes).rstrip() + "\n"

    def generarCodigo(self) -> str:
        codigo = ["section .text", "global _start"]
        data = ["section .bss"]

        # Recolectar strings
        strings = []
        for funcion in self.funciones:
            strings.extend(_collect_strings(funcion))
        if self.main is not None:
            strings.extend(_collect_strings(self.main))

        # Asignar etiquetas únicas y generar sección .data
        data_sec = []
        if strings:
            data_sec.append("section .data")
            for idx, s_node in enumerate(strings):
                lbl = f"str_{idx}"
                s_node.label = lbl
                
                valor = _tok_value(s_node.argumentos)
                if valor.startswith('"') and valor.endswith('"'):
                    valor = valor[1:-1]
                elif valor.startswith("'") and valor.endswith("'"):
                    valor = valor[1:-1]
                
                # Usamos comillas invertidas en NASM para procesar escapes estilo C
                data_sec.append(f"    {lbl} db `{valor}`, 0")
                data_sec.append(f"    {lbl}_len equ $ - {lbl} - 1")

        for funcion in self.funciones:
            codigo.append(funcion.generarCodigo())
            for var in funcion.variables_declaradas():
                self.variables.append(var)

        if self.main is not None:
            for var in self.main.variables_declaradas():
                self.variables.append(var)

            codigo.append("_start:")
            codigo.append(_indent(self.main.generarCodigo(), 1))
            codigo.append("    mov eax, 1      ; syscall exit")
            codigo.append("    xor ebx, ebx    ; codigo de salida 0")
            codigo.append("    int 0x80")

        for variable in self.variables:
            tipo, nombre = variable
            if tipo in ("int", "bool"):
                data.append(f"    {nombre}: resd 1")
            elif tipo == "char":
                data.append(f"    {nombre}: resb 1")
            elif tipo == "float":
                data.append(f"    {nombre}: resd 1")
            else:
                data.append(f"    {nombre}: resd 1")

        partes = []
        if data_sec:
            partes.append("\n".join(data_sec))
        partes.append("\n".join(data))
        partes.append("\n".join(codigo))
        return "\n\n".join(partes) + "\n"


# ============================================================
# Funciones / parametros
# ============================================================

class NodoFuncion(NodoAST):
    def __init__(self, tipo, nombre, parametros, cuerpo):
        self.tipo = tipo
        self.nombre = nombre
        self.parametros = parametros or []
        self.cuerpo = cuerpo or []

    def _nombre(self):
        return _tok_value(self.nombre)

    def _tipo(self):
        return _tok_value(self.tipo)

    def variables_declaradas(self):
        out = []
        for inst in self.cuerpo:
            if isinstance(inst, NodoAsignacion):
                out.append((_tok_value(inst.tipo), _tok_value(inst.nombre)))
        for p in self.parametros:
            out.append((_tok_value(p.tipo), _tok_value(p.nombre)))
        return out

    def generarCodigoC(self) -> str:
        params = ", ".join(
            f"{_tok_value(p.tipo)} {_tok_value(p.nombre)}" for p in self.parametros
        )
        cabecera = f"{self._tipo()} {self._nombre()}({params}) {{"
        cuerpo = "\n".join(_indent(c.generarCodigoC(), 1) for c in self.cuerpo)
        return cabecera + "\n" + cuerpo + "\n}"

    def generarCodigo(self) -> str:
        codigo = [f"{self._nombre()}:"]
        for parametro in self.parametros:
            codigo.append("    pop     eax")
            codigo.append(f"    mov     [{_tok_value(parametro.nombre)}], eax")
        for c in self.cuerpo:
            codigo.append(_indent(c.generarCodigo(), 1))
        codigo.append("    ret")
        return "\n".join(codigo)


class NodoParametro(NodoAST):
    def __init__(self, tipo, nombre):
        self.tipo = tipo
        self.nombre = nombre

class NodoBloque(NodoAST):
    def __init__(self, instrucciones):
        self.instrucciones = instrucciones


# ============================================================
# Asignacion / declaracion
# ============================================================

class NodoAsignacion(NodoAST):
    """Declaracion + asignacion de variable: ``int x = expr;``"""

    def __init__(self, tipo, nombre, expresion):
        self.tipo = tipo
        self.nombre = nombre
        self.expresion = expresion

    def generarCodigoC(self) -> str:
        nombre = _tok_value(self.nombre)
        tipo = _tok_value(self.tipo)
        expr = self.expresion.generarCodigoC() if self.expresion is not None else "0"
        return f"{tipo} {nombre} = {expr};"

    def generarCodigo(self) -> str:
        nombre = _tok_value(self.nombre)
        codigo = self.expresion.generarCodigo() if self.expresion is not None else "    mov     eax, 0"
        codigo += f"\n    mov     [{nombre}], eax"
        return codigo


class NodoReasignacion(NodoAST):
    """Reasignacion sin redeclarar: ``x = expr;``"""

    def __init__(self, nombre, expresion):
        self.nombre = nombre
        self.expresion = expresion

    def generarCodigoC(self) -> str:
        nombre = _tok_value(self.nombre)
        expr = self.expresion.generarCodigoC() if self.expresion is not None else "0"
        return f"{nombre} = {expr};"

    def generarCodigo(self) -> str:
        nombre = _tok_value(self.nombre)
        codigo = self.expresion.generarCodigo() if self.expresion is not None else "    mov     eax, 0"
        codigo += f"\n    mov     [{nombre}], eax"
        return codigo


# ============================================================
# Expresiones
# ============================================================

class NodoOperacion(NodoAST):
    def __init__(self, izquierda, operador, derecha):
        self.izquierda = izquierda
        self.derecha = derecha
        self.operador = operador

    def _op(self):
        return _tok_value(self.operador)

    def generarCodigoC(self) -> str:
        return f"({self.izquierda.generarCodigoC()} {self._op()} {self.derecha.generarCodigoC()})"

    def generarCodigo(self) -> str:
        codigo = []
        codigo.append(self.izquierda.generarCodigo())
        codigo.append("    push    eax")
        codigo.append(self.derecha.generarCodigo())
        codigo.append("    mov     ebx, eax")
        codigo.append("    pop     eax")
        op = self._op()
        if op == "+":
            codigo.append("    add     eax, ebx")
        elif op == "-":
            codigo.append("    sub     eax, ebx")
        elif op == "*":
            codigo.append("    imul    eax, ebx")
        elif op == "/":
            codigo.append("    cdq")
            codigo.append("    idiv    ebx")
        elif op in ("==", "!=", "<", ">", "<=", ">="):
            codigo.append("    cmp     eax, ebx")
            mnem = {
                "==": "sete",
                "!=": "setne",
                "<":  "setl",
                ">":  "setg",
                "<=": "setle",
                ">=": "setge",
            }[op]
            codigo.append(f"    {mnem}    al")
            codigo.append("    movzx   eax, al")
        return "\n".join(codigo)

    def optimizar(self):
        izquierda = self.izquierda.optimizar() if isinstance(self.izquierda, NodoOperacion) else self.izquierda
        derecha = self.derecha.optimizar() if isinstance(self.derecha, NodoOperacion) else self.derecha

        if isinstance(izquierda, NodoNumero) and isinstance(derecha, NodoNumero):
            izq = int(_tok_value(izquierda.valor))
            der = int(_tok_value(derecha.valor))
            op = self._op()
            if op == "+":
                return NodoNumero(("NUMBER", str(izq + der)))
            if op == "-":
                return NodoNumero(("NUMBER", str(izq - der)))
            if op == "*":
                return NodoNumero(("NUMBER", str(izq * der)))
            if op == "/":
                if der == 0:
                    raise ZeroDivisionError("Division entre 0 detectada en optimizacion")
                return NodoNumero(("NUMBER", str(izq // der)))
        return NodoOperacion(izquierda, self.operador, derecha)


class NodoRetorno(NodoAST):
    def __init__(self, expresion):
        self.expresion = expresion

    def generarCodigoC(self) -> str:
        if self.expresion is None:
            return "return;"
        return f"return {self.expresion.generarCodigoC()};"

    def generarCodigo(self) -> str:
        if self.expresion is None:
            return "    ; return"
        return self.expresion.generarCodigo()


class NodoIdent(NodoAST):
    def __init__(self, nombre):
        self.nombre = nombre

    def generarCodigoC(self) -> str:
        return _tok_value(self.nombre)

    def generarCodigo(self) -> str:
        return f"    mov     eax, [{_tok_value(self.nombre)}]"


class NodoNumero(NodoAST):
    def __init__(self, valor):
        self.valor = valor

    def generarCodigoC(self) -> str:
        return _tok_value(self.valor)

    def generarCodigo(self) -> str:
        return f"    mov     eax, {_tok_value(self.valor)}"


class NodoString(NodoAST):
    def __init__(self, argumentos):
        self.argumentos = argumentos

    def generarCodigoC(self) -> str:
        valor = _tok_value(self.argumentos)
        if not (valor.startswith('"') and valor.endswith('"')):
            valor = f'"{valor}"'
        return valor

    def generarCodigo(self) -> str:
        lbl = getattr(self, "label", "str_unknown")
        return f"    mov     eax, {lbl}"


# ============================================================
# Control de flujo
# ============================================================

class NodoCondicional(NodoAST):
    """if / else."""

    _label_counter = 0

    def __init__(self, condicion, cuerpo_if, cuerpo_else):
        self.condicion = condicion
        self.cuerpo_if = cuerpo_if or []
        self.cuerpo_else = cuerpo_else or []

    def generarCodigoC(self) -> str:
        cond = self.condicion.generarCodigoC() if self.condicion is not None else "1"
        cuerpo = "\n".join(_indent(c.generarCodigoC(), 1) for c in self.cuerpo_if)
        out = f"if ({cond}) {{\n{cuerpo}\n}}"
        if self.cuerpo_else:
            cuerpo_else = "\n".join(_indent(c.generarCodigoC(), 1) for c in self.cuerpo_else)
            out += f" else {{\n{cuerpo_else}\n}}"
        return out

    def generarCodigo(self) -> str:
        NodoCondicional._label_counter += 1
        n = NodoCondicional._label_counter
        l_else = f"if_else_{n}"
        l_end = f"if_end_{n}"

        codigo = []
        codigo.append(self.condicion.generarCodigo())
        codigo.append("    cmp     eax, 0")
        codigo.append(f"    je      {l_else}")
        for c in self.cuerpo_if:
            codigo.append(c.generarCodigo())
        codigo.append(f"    jmp     {l_end}")
        codigo.append(f"{l_else}:")
        for c in self.cuerpo_else:
            codigo.append(c.generarCodigo())
        codigo.append(f"{l_end}:")
        return "\n".join(codigo)


class NodoImprimir(NodoAST):
    _label_counter = 0

    def __init__(self, tipo, argumentos):
        self.tipo = tipo
        self.argumentos = argumentos or []

    def generarCodigoC(self) -> str:
        nombre = _tok_value(self.tipo)
        args = ", ".join(a.generarCodigoC() for a in self.argumentos)
        return f"{nombre}({args});"

    def generarCodigo(self) -> str:
        if not self.argumentos:
            return "    ; printf sin argumentos"
        
        arg = self.argumentos[0]
        if isinstance(arg, NodoString):
            lbl = getattr(arg, "label", "str_unknown")
            codigo = [
                f"    ; --- imprimir string ({lbl}) ---",
                "    mov     eax, 4          ; sys_write",
                "    mov     ebx, 1          ; stdout",
                f"    mov     ecx, {lbl}      ; address of string",
                f"    mov     edx, {lbl}_len  ; length of string",
                "    int     0x80"
            ]
            return "\n".join(codigo)
        
        NodoImprimir._label_counter += 1
        n = NodoImprimir._label_counter
        l_pos = f"print_int_pos_{n}"
        l_loop = f"print_int_loop_{n}"
        l_show = f"print_int_show_{n}"

        codigo = []
        codigo.append("    ; --- evaluar expresion para imprimir ---")
        codigo.append(arg.generarCodigo())
        
        codigo.extend([
            "    ; --- imprimir entero en eax ---",
            "    push    edi",
            "    push    ebx",
            "    push    ecx",
            "    push    edx",
            "    push    esi",
            "",
            "    mov     esi, eax        ; guardar valor",
            "    mov     edi, esp        ; guardar puntero de pila original",
            "    mov     ebx, 10         ; divisor base 10",
            "",
            "    test    eax, eax",
            f"    jns     {l_pos}",
            "    neg     eax",
            f"{l_pos}:",
            f"{l_loop}:",
            "    xor     edx, edx",
            "    div     ebx",
            "    add     dl, '0'",
            "    dec     esp",
            "    mov     [esp], dl",
            "    test    eax, eax",
            f"    jnz     {l_loop}",
            "",
            "    test    esi, esi",
            f"    jns     {l_show}",
            "    dec     esp",
            "    mov     byte [esp], '-'",
            "",
            f"{l_show}:",
            "    mov     eax, 4          ; sys_write",
            "    mov     ebx, 1          ; stdout",
            "    mov     ecx, esp        ; buffer",
            "    mov     edx, edi",
            "    sub     edx, esp        ; longitud = edi - esp",
            "    int     0x80",
            "",
            "    mov     esp, edi        ; restaurar puntero de pila",
            "    pop     esi",
            "    pop     edx",
            "    pop     ecx",
            "    pop     ebx",
            "    pop     edi"
        ])
        return "\n".join(codigo)


class NodoWhile(NodoAST):
    _label_counter = 0

    def __init__(self, condicion, cuerpo):
        self.condicion = condicion
        self.cuerpo = cuerpo or []

    def generarCodigoC(self) -> str:
        cond = self.condicion.generarCodigoC() if self.condicion is not None else "1"
        cuerpo = "\n".join(_indent(c.generarCodigoC(), 1) for c in self.cuerpo)
        return f"while ({cond}) {{\n{cuerpo}\n}}"

    def generarCodigo(self) -> str:
        NodoWhile._label_counter += 1
        n = NodoWhile._label_counter
        l_start = f"while_start_{n}"
        l_end = f"while_end_{n}"

        codigo = [f"{l_start}:"]
        codigo.append(self.condicion.generarCodigo())
        codigo.append("    cmp     eax, 0")
        codigo.append(f"    je      {l_end}")
        for c in self.cuerpo:
            codigo.append(c.generarCodigo())
        codigo.append(f"    jmp     {l_start}")
        codigo.append(f"{l_end}:")
        return "\n".join(codigo)


class NodoFor(NodoAST):
    def __init__(self, inicio, condicion, incremento, cuerpo):
        self.inicio = inicio
        self.condicion = condicion
        self.incremento = incremento
        self.cuerpo = cuerpo or []

    def generarCodigoC(self) -> str:
        inicio = self.inicio.generarCodigoC().rstrip(";") if self.inicio is not None else ""
        cond = self.condicion.generarCodigoC() if self.condicion is not None else ""
        inc = self.incremento.generarCodigoC().rstrip(";") if self.incremento is not None else ""
        cuerpo = "\n".join(_indent(c.generarCodigoC(), 1) for c in self.cuerpo)
        return f"for ({inicio}; {cond}; {inc}) {{\n{cuerpo}\n}}"

    def generarCodigo(self) -> str:
        equiv = NodoWhile(
            self.condicion,
            list(self.cuerpo) + ([self.incremento] if self.incremento is not None else []),
        )
        partes = []
        if self.inicio is not None:
            partes.append(self.inicio.generarCodigo())
        partes.append(equiv.generarCodigo())
        return "\n".join(partes)


class NodoIncremento(NodoAST):
    def __init__(self, nombre, operador):
        self.nombre = nombre
        self.operador = operador

    def generarCodigoC(self) -> str:
        nombre = _tok_value(self.nombre)
        op = _tok_value(self.operador)
        return f"{nombre}{op};"

    def generarCodigo(self) -> str:
        nombre = _tok_value(self.nombre)
        op = _tok_value(self.operador)
        instr = "inc" if op == "++" else "dec"
        return f"    {instr}     dword [{nombre}]"


class NodoEntrada(NodoAST):
    _label_counter = 0

    def __init__(self, tipo, formato, variable):
        self.tipo = tipo
        self.formato = formato
        self.variable = variable

    def generarCodigoC(self) -> str:
        nombre = _tok_value(self.variable)
        formato = self.formato.generarCodigoC() if hasattr(self.formato, "generarCodigoC") else _tok_value(self.formato)
        return f"scanf({formato}, &{nombre});"

    def generarCodigo(self) -> str:
        nombre = _tok_value(self.variable)
        
        NodoEntrada._label_counter += 1
        n = NodoEntrada._label_counter
        l_loop = f"scan_int_loop_{n}"
        l_done = f"scan_int_done_{n}"
        l_store = f"scan_int_store_{n}"
        
        codigo = [
            f"    ; --- leer entero por teclado para [{nombre}] ---",
            "    push    ebx",
            "    push    ecx",
            "    push    edx",
            "    push    esi",
            "    push    edi",
            "",
            "    ; Reservar buffer temporal de 16 bytes en la pila",
            "    sub     esp, 16",
            "",
            "    mov     eax, 3          ; sys_read",
            "    mov     ebx, 0          ; stdin",
            "    mov     ecx, esp        ; buffer",
            "    mov     edx, 16         ; longitud maxima",
            "    int     0x80",
            "",
            "    ; Procesar buffer para parsear el entero",
            "    xor     eax, eax        ; acumulador = 0",
            "    xor     edi, edi        ; signo = 0 (positivo)",
            "    mov     esi, ecx        ; puntero al buffer",
            "",
            "    test    edx, edx        ; si no se leyo nada",
            f"    jz      {l_done}",
            "",
            "    movzx   ebx, byte [esi]",
            "    cmp     bl, '-'",
            f"    jne     {l_loop}",
            "    mov     edi, 1          ; signo = 1 (negativo)",
            "    inc     esi",
            "",
            f"{l_loop}:",
            "    movzx   ebx, byte [esi]",
            "    cmp     bl, '0'",
            f"    jl      {l_done}",
            "    cmp     bl, '9'",
            f"    jg      {l_done}",
            "",
            "    sub     bl, '0'",
            "    imul    eax, 10",
            "    add     eax, ebx",
            "    inc     esi",
            f"    jmp     {l_loop}",
            "",
            f"{l_done}:",
            "    test    edi, edi",
            f"    jz      {l_store}",
            "    neg     eax",
            "",
            f"{l_store}:",
            f"    mov     [{nombre}], eax  ; guardar valor en la variable",
            "",
            "    add     esp, 16         ; liberar buffer de pila",
            "    pop     edi",
            "    pop     esi",
            "    pop     edx",
            "    pop     ecx",
            "    pop     ebx"
        ]
        return "\n".join(codigo)


class NodoLlamadaFuncion(NodoAST):
    def __init__(self, nombref, argumentos):
        self.nombre_funcion = nombref
        self.argumentos = argumentos or []

    def _nombre(self):
        return _tok_value(self.nombre_funcion)

    def generarCodigoC(self) -> str:
        args = ", ".join(a.generarCodigoC() for a in self.argumentos)
        return f"{self._nombre()}({args});"

    def generarCodigo(self) -> str:
        codigo = []
        for arg in reversed(self.argumentos):
            codigo.append(arg.generarCodigo())
            codigo.append("    push    eax   ; pasar argumento a la pila")
        codigo.append(f"    call    {self._nombre()}")
        if self.argumentos:
            codigo.append(f"    add     esp, {len(self.argumentos) * 4}")
        return "\n".join(codigo)
