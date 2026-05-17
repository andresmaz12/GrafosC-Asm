"""
semantico_C.py  –  Analizador semántico + calculador de stack frames
=====================================================================
Fusiona los dos prototipos académicos (semanticoExt_2.py y semantico_3.py)
y los adapta al AST real definido en AST_C.py.

Clases públicas
---------------
- Simbolo          : entrada en la tabla de símbolos
- TablaSimbolos    : gestión de ámbitos, variables y funciones
- SistemaTipo      : reglas de compatibilidad y promoción de tipos
- AnalizadorSemantico : recorre el AST, valida tipos y calcula offsets de pila
"""

from AST_C import (
    NodoPrograma, NodoFuncion, NodoParametro, NodoBloque,
    NodoAsignacion, NodoReasignacion,
    NodoOperacion, NodoRetorno, NodoIdent, NodoNumero, NodoString,
    NodoCondicional, NodoImprimir, NodoWhile, NodoFor,
    NodoIncremento, NodoEntrada, NodoLlamadaFuncion,
)


# ============================================================
# Símbolo
# ============================================================

class Simbolo:
    """Representa una variable o parámetro en la tabla de símbolos."""

    def __init__(self, tipo: str, offset: int = 0):
        self.tipo = tipo          # 'int', 'float', 'void', …
        self.offset = offset      # offset en el stack frame (negativo respecto a EBP)

    def __repr__(self):
        return f"Simbolo(tipo={self.tipo!r}, offset={self.offset})"


# ============================================================
# Tabla de símbolos
# ============================================================

class TablaSimbolos:
    """
    Pila de ámbitos anidados.

    Cada ámbito es un dict  nombre -> Simbolo.
    El ámbito 0 es el global; los siguientes corresponden a
    funciones o bloques anidados.
    """

    def __init__(self):
        self.ambitos: list[dict] = [{}]          # ámbito global
        self.funciones: dict = {}                 # nombre -> (tipo_retorno, [parametros])
        self._stack_offset: int = 0              # contador de offset dentro de la función actual

    # ---- gestión de ámbitos ----

    def entrar_ambito(self):
        self.ambitos.append({})
        self._stack_offset = 0   # cada función/bloque reinicia su offset

    def salir_ambito(self):
        if len(self.ambitos) <= 1:
            raise Exception("No se puede salir del ámbito global")
        self.ambitos.pop()

    # ---- variables ----

    def declarar_variable(self, nombre: str, tipo: str) -> int:
        """
        Registra la variable en el ámbito actual y devuelve su offset de pila.
        Cada variable int/float ocupa 4 bytes → offset decrece de 4 en 4.
        """
        ambito_actual = self.ambitos[-1]
        if nombre in ambito_actual:
            raise Exception(
                f"Error semántico: variable '{nombre}' ya declarada en este ámbito"
            )
        self._stack_offset -= 4
        simbolo = Simbolo(tipo, self._stack_offset)
        ambito_actual[nombre] = simbolo
        return self._stack_offset

    def obtener_simbolo(self, nombre: str) -> Simbolo:
        """
        Busca la variable desde el ámbito más interno hacia el global (shadowing).
        """
        for ambito in reversed(self.ambitos):
            if nombre in ambito:
                return ambito[nombre]
        raise Exception(f"Error semántico: variable '{nombre}' no declarada")

    def obtener_tipo_variable(self, nombre: str) -> str:
        return self.obtener_simbolo(nombre).tipo

    # ---- funciones ----

    def declarar_funcion(self, nombre: str, tipo_retorno: str, parametros: list):
        """parametros es una lista de (nombre, tipo)."""
        if nombre in self.funciones:
            raise Exception(f"Error semántico: función '{nombre}' ya declarada")
        self.funciones[nombre] = (tipo_retorno, parametros)

    def obtener_info_funcion(self, nombre: str):
        """Devuelve (tipo_retorno, [(p_nombre, p_tipo), …])."""
        if nombre not in self.funciones:
            raise Exception(f"Error semántico: función '{nombre}' no declarada")
        return self.funciones[nombre]

    # ---- utilidad ----

    def espacio_stack_actual(self) -> int:
        """Bytes totales reservados en el ámbito actual (valor positivo)."""
        return abs(self._stack_offset)


# ============================================================
# Sistema de tipos
# ============================================================

class SistemaTipo:

    # Tipos numéricos válidos, ordenados por "anchura"
    _NUMERICOS = ('int', 'float')

    @staticmethod
    def es_compatible(t1: str, t2: str) -> bool:
        """True si t2 puede asignarse/operarse con t1 sin error."""
        if t1 == t2:
            return True
        # int y float son mutuamente compatibles (promoción implícita)
        if t1 in SistemaTipo._NUMERICOS and t2 in SistemaTipo._NUMERICOS:
            return True
        return False

    @staticmethod
    def tipo_resultante(t1: str, t2: str) -> str:
        """Tipo del resultado de una operación aritmética entre t1 y t2."""
        if 'float' in (t1, t2):
            return 'float'
        return 'int'


# ============================================================
# Calculador de espacio de stack frame
# ============================================================

class CalculadorStackFrame:
    """
    Recorre el cuerpo de una NodoFuncion para determinar cuántos bytes
    de pila se necesitan reservar en el prólogo (sub esp, N).

    Solo cuenta NodoAsignacion (declaraciones locales), 4 bytes c/u.
    """

    def calcular(self, nodo) -> int:
        return self._visitar(nodo)

    def _visitar(self, nodo) -> int:
        if nodo is None:
            return 0

        if isinstance(nodo, list):
            return sum(self._visitar(n) for n in nodo)

        if isinstance(nodo, NodoAsignacion):
            return 4   # cada variable local ocupa 4 bytes

        if isinstance(nodo, NodoBloque):
            return self._visitar(nodo.instrucciones)

        if isinstance(nodo, NodoCondicional):
            return (self._visitar(nodo.cuerpo_if) +
                    self._visitar(nodo.cuerpo_else))

        if isinstance(nodo, (NodoWhile, NodoFor)):
            extra = 0
            if isinstance(nodo, NodoFor) and nodo.inicio:
                extra = self._visitar(nodo.inicio)
            return extra + self._visitar(nodo.cuerpo)

        # Nodos hoja o nodos que no declaran variables
        return 0


# ============================================================
# Generador de prólogo / epílogo NASM
# ============================================================

class GeneradorPrologoNASM:
    """
    Devuelve las líneas de prólogo y epílogo estándar para una función NASM.

    Uso:
        gen = GeneradorPrologoNASM()
        prologo  = gen.prologo("suma", 8)
        epilogo  = gen.epilogo()
    """

    @staticmethod
    def prologo(nombre_func: str, tamanio_stack: int) -> str:
        lines = [
            f"; ------ Función: {nombre_func} ------",
            f"global {nombre_func}",
            f"{nombre_func}:",
            "    push    ebp",
            "    mov     ebp, esp",
        ]
        if tamanio_stack > 0:
            # Alineación a 16 bytes (convención cdecl/System V)
            tamanio_alineado = (tamanio_stack + 15) & ~15
            lines.append(
                f"    sub     esp, {tamanio_alineado}   "
                f"; reserva {tamanio_alineado} bytes para variables locales"
            )
        return "\n".join(lines)

    @staticmethod
    def epilogo() -> str:
        return "\n".join([
            "    mov     esp, ebp",
            "    pop     ebp",
            "    ret",
        ])


# ============================================================
# Analizador semántico principal
# ============================================================

class AnalizadorSemantico:
    """
    Recorre el AST generado por sintactico_C.py, valida tipos y
    registra el offset de pila en cada NodoAsignacion.

    Uso típico:
        from semantico_C import AnalizadorSemantico
        analizador = AnalizadorSemantico()
        analizador.analizar(nodo_programa)   # lanza Exception si hay errores
    """

    def __init__(self):
        self.tabla = TablaSimbolos()
        self._calculador = CalculadorStackFrame()
        self.advertencias: list[str] = []

    # ------------------------------------------------------------------ #
    #  Punto de entrada                                                    #
    # ------------------------------------------------------------------ #

    def analizar_y_recolectar(self, programa):
        self.errores = []
        self.analizar(programa)
        return list(self.errores)

    def analizar(self, nodo) -> str:
        """
        Analiza el nodo y devuelve su tipo inferido (str).
        Para nodos de sentencia (sin valor) devuelve 'void'.
        """
        # --- Programa ---
        if isinstance(nodo, NodoPrograma):
            # Primero registrar todas las funciones (forward declarations)
            for funcion in nodo.funciones:
                self._registrar_firma_funcion(funcion)
            if nodo.main is not None:
                self._registrar_firma_funcion(nodo.main)
            # Luego analizar los cuerpos
            for funcion in nodo.funciones:
                self.analizar(funcion)
            if nodo.main is not None:
                self.analizar(nodo.main)
            return 'void'

        # --- Función ---
        elif isinstance(nodo, NodoFuncion):
            nombre = self._val(nodo.nombre)
            tipo_ret = self._val(nodo.tipo)

            self.tabla.entrar_ambito()

            # Declarar parámetros dentro del nuevo ámbito
            for p in nodo.parametros:
                p_nombre = self._val(p.nombre)
                p_tipo   = self._val(p.tipo)
                self.tabla.declarar_variable(p_nombre, p_tipo)

            # Calcular el espacio de stack necesario y anotarlo en el nodo
            nodo.tamanio_stack = self._calculador.calcular(nodo.cuerpo)

            # Analizar instrucciones del cuerpo
            for instruccion in nodo.cuerpo:
                tipo_inst = self.analizar(instruccion)
                # Verificar tipo de retorno
                if isinstance(instruccion, NodoRetorno):
                    if tipo_inst != tipo_ret and not SistemaTipo.es_compatible(tipo_ret, tipo_inst):
                        raise Exception(
                            f"Error semántico en función '{nombre}': "
                            f"se esperaba retorno '{tipo_ret}' pero se encontró '{tipo_inst}'"
                        )

            self.tabla.salir_ambito()
            return 'void'

        # --- Asignación / declaración ---
        elif isinstance(nodo, NodoAsignacion):
            tipo_decl = self._val(nodo.tipo)
            tipo_expr = self.analizar(nodo.expresion)

            if not SistemaTipo.es_compatible(tipo_decl, tipo_expr):
                raise Exception(
                    f"Error semántico: tipo incompatible en declaración de "
                    f"'{self._val(nodo.nombre)}': "
                    f"se declara '{tipo_decl}' pero la expresión es '{tipo_expr}'"
                )

            offset = self.tabla.declarar_variable(self._val(nodo.nombre), tipo_decl)
            nodo.offset_pila = offset   # anotación para el generador de código
            return tipo_decl

        # --- Reasignación (x = expr, sin tipo) ---
        elif isinstance(nodo, NodoReasignacion):
            nombre = self._val(nodo.nombre)
            tipo_var = self.tabla.obtener_tipo_variable(nombre)
            tipo_expr = self.analizar(nodo.expresion)
            if not SistemaTipo.es_compatible(tipo_var, tipo_expr):
                raise Exception(
                    f"Error semántico: no se puede asignar '{tipo_expr}' "
                    f"a variable '{nombre}' de tipo '{tipo_var}'"
                )
            return tipo_var

        # --- Operación binaria ---
        elif isinstance(nodo, NodoOperacion):
            tipo_izq = self.analizar(nodo.izquierda)
            tipo_der = self.analizar(nodo.derecha)
            if not SistemaTipo.es_compatible(tipo_izq, tipo_der):
                raise Exception(
                    f"Error semántico: tipos incompatibles en operación: "
                    f"'{tipo_izq}' {self._val(nodo.operador)} '{tipo_der}'"
                )
            return SistemaTipo.tipo_resultante(tipo_izq, tipo_der)

        # --- Retorno ---
        elif isinstance(nodo, NodoRetorno):
            if nodo.expresion is None:
                return 'void'
            return self.analizar(nodo.expresion)

        # --- Identificador ---
        elif isinstance(nodo, NodoIdent):
            return self.tabla.obtener_tipo_variable(self._val(nodo.nombre))

        # --- Número literal ---
        elif isinstance(nodo, NodoNumero):
            valor = self._val(nodo.valor)
            return 'float' if '.' in str(valor) else 'int'

        # --- String literal ---
        elif isinstance(nodo, NodoString):
            return 'string'

        # --- Llamada a función ---
        elif isinstance(nodo, NodoLlamadaFuncion):
            nombre = self._val(nodo.nombre_funcion)
            tipo_ret, params_esperados = self.tabla.obtener_info_funcion(nombre)

            # Verificar aridad
            if len(nodo.argumentos) != len(params_esperados):
                raise Exception(
                    f"Error semántico: función '{nombre}' espera "
                    f"{len(params_esperados)} argumento(s), "
                    f"se dieron {len(nodo.argumentos)}"
                )

            # Verificar tipos de argumentos
            for i, (arg, (_, p_tipo)) in enumerate(zip(nodo.argumentos, params_esperados)):
                tipo_arg = self.analizar(arg)
                if not SistemaTipo.es_compatible(p_tipo, tipo_arg):
                    raise Exception(
                        f"Error semántico: argumento {i+1} de '{nombre}': "
                        f"se esperaba '{p_tipo}' pero se recibió '{tipo_arg}'"
                    )

            return tipo_ret

        # --- Impresión (printf / puts) ---
        elif isinstance(nodo, NodoImprimir):
            for arg in nodo.argumentos:
                self.analizar(arg)
            return 'void'

        # --- Entrada (scanf) ---
        elif isinstance(nodo, NodoEntrada):
            nombre = self._val(nodo.variable)
            # La variable debe estar previamente declarada
            self.tabla.obtener_tipo_variable(nombre)
            return 'void'

        # --- Condicional if/else ---
        elif isinstance(nodo, NodoCondicional):
            self.analizar(nodo.condicion)
            self.tabla.entrar_ambito()
            for inst in nodo.cuerpo_if:
                self.analizar(inst)
            self.tabla.salir_ambito()
            if nodo.cuerpo_else:
                self.tabla.entrar_ambito()
                for inst in nodo.cuerpo_else:
                    self.analizar(inst)
                self.tabla.salir_ambito()
            return 'void'

        # --- While ---
        elif isinstance(nodo, NodoWhile):
            self.analizar(nodo.condicion)
            self.tabla.entrar_ambito()
            for inst in nodo.cuerpo:
                self.analizar(inst)
            self.tabla.salir_ambito()
            return 'void'

        # --- For ---
        elif isinstance(nodo, NodoFor):
            self.tabla.entrar_ambito()
            if nodo.inicio:
                self.analizar(nodo.inicio)
            if nodo.condicion:
                self.analizar(nodo.condicion)
            if nodo.incremento:
                self.analizar(nodo.incremento)
            for inst in nodo.cuerpo:
                self.analizar(inst)
            self.tabla.salir_ambito()
            return 'void'

        # --- Incremento / decremento (i++, i--) ---
        elif isinstance(nodo, NodoIncremento):
            nombre = self._val(nodo.nombre)
            return self.tabla.obtener_tipo_variable(nombre)

        # --- Bloque genérico ---
        elif isinstance(nodo, NodoBloque):
            self.tabla.entrar_ambito()
            for inst in nodo.instrucciones:
                self.analizar(inst)
            self.tabla.salir_ambito()
            return 'void'

        else:
            self.advertencias.append(
                f"Nodo no reconocido por el analizador semántico: {type(nodo).__name__}"
            )
            return 'void'

    # ------------------------------------------------------------------ #
    #  Utilidades internas                                                 #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _val(tok) -> str:
        """Extrae el valor de un token (tipo, valor) o de un string simple."""
        if isinstance(tok, tuple) and len(tok) >= 2:
            return tok[1]
        return str(tok)

    def _registrar_firma_funcion(self, nodo: NodoFuncion):
        """
        Registra la firma de una función en la tabla ANTES de analizar su cuerpo.
        Permite llamadas hacia adelante (forward calls) entre funciones.
        """
        nombre   = self._val(nodo.nombre)
        tipo_ret = self._val(nodo.tipo)
        params   = [(self._val(p.nombre), self._val(p.tipo)) for p in nodo.parametros]
        self.tabla.declarar_funcion(nombre, tipo_ret, params)