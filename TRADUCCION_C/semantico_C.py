"""Analizador semantico minimo para el AST de C.

Recorre un ``NodoPrograma`` validando declaraciones de variables y
funciones; reporta los errores como excepciones acumuladas en
``self.errores``. La pipeline puede consultar ``analizar_y_recolectar``
para obtener una lista de strings sin abortar la ejecucion.
"""

from AST_C import (
    NodoPrograma, NodoFuncion, NodoAsignacion, NodoReasignacion,
    NodoOperacion, NodoIdent, NodoNumero, NodoString, NodoLlamadaFuncion,
    NodoCondicional, NodoWhile, NodoFor, NodoRetorno, NodoImprimir,
    NodoEntrada, NodoIncremento, _tok_value,
)


class TablaSimbolos:
    def __init__(self):
        self.variables = {}
        self.funciones = {}

    def declararVariable(self, nombre, tipo):
        if nombre in self.variables:
            raise Exception(f"Variable '{nombre}' ya declarada")
        self.variables[nombre] = tipo

    def existeVariable(self, nombre):
        return nombre in self.variables

    def obtenerTipoVariable(self, nombre):
        if nombre not in self.variables:
            raise Exception(f"Variable '{nombre}' no declarada")
        return self.variables[nombre]

    def declararFuncion(self, nombre, tipo, parametros):
        if nombre in self.funciones:
            raise Exception(f"Funcion '{nombre}' ya declarada")
        self.funciones[nombre] = (tipo, parametros)

    def obtenerInfoFuncion(self, nombre):
        if nombre not in self.funciones:
            raise Exception(f"Funcion '{nombre}' no definida")
        return self.funciones[nombre]


class AnalizadorSemantico:
    def __init__(self):
        self.tablaSimbolos = TablaSimbolos()
        self.errores = []

    def _safe(self, fn, nodo):
        try:
            fn(nodo)
        except Exception as exc:
            self.errores.append(str(exc))

    def analizar_y_recolectar(self, programa):
        self.errores = []
        self.analizar(programa)
        return list(self.errores)

    def analizar(self, nodo):
        if nodo is None:
            return None

        if isinstance(nodo, NodoPrograma):
            for funcion in nodo.funciones:
                self._safe(self.analizar, funcion)
            if nodo.main is not None:
                self._safe(self.analizar, nodo.main)
            return None

        if isinstance(nodo, NodoFuncion):
            nombre = _tok_value(nodo.nombre)
            tipo = _tok_value(nodo.tipo)
            try:
                self.tablaSimbolos.declararFuncion(nombre, tipo, nodo.parametros)
            except Exception as exc:
                self.errores.append(str(exc))
            for parametro in nodo.parametros:
                pname = _tok_value(parametro.nombre)
                ptipo = _tok_value(parametro.tipo)
                try:
                    self.tablaSimbolos.declararVariable(pname, ptipo)
                except Exception as exc:
                    self.errores.append(str(exc))
            for instruccion in nodo.cuerpo:
                self._safe(self.analizar, instruccion)
            return None

        if isinstance(nodo, NodoAsignacion):
            nombre = _tok_value(nodo.nombre)
            tipo = _tok_value(nodo.tipo)
            try:
                self.tablaSimbolos.declararVariable(nombre, tipo)
            except Exception as exc:
                self.errores.append(str(exc))
            self._safe(self.analizar, nodo.expresion)
            return tipo

        if isinstance(nodo, NodoReasignacion):
            nombre = _tok_value(nodo.nombre)
            if not self.tablaSimbolos.existeVariable(nombre):
                self.errores.append(f"Variable '{nombre}' no declarada antes de reasignar")
            self._safe(self.analizar, nodo.expresion)
            return None

        if isinstance(nodo, NodoOperacion):
            self._safe(self.analizar, nodo.izquierda)
            self._safe(self.analizar, nodo.derecha)
            return None

        if isinstance(nodo, NodoIdent):
            nombre = _tok_value(nodo.nombre)
            if not self.tablaSimbolos.existeVariable(nombre):
                self.errores.append(f"Variable '{nombre}' no declarada")
                return None
            return self.tablaSimbolos.obtenerTipoVariable(nombre)

        if isinstance(nodo, NodoNumero):
            valor = _tok_value(nodo.valor)
            return "float" if "." in str(valor) else "int"

        if isinstance(nodo, NodoString):
            return "string"

        if isinstance(nodo, NodoLlamadaFuncion):
            nombre = _tok_value(nodo.nombre_funcion)
            try:
                tipo, parametros = self.tablaSimbolos.obtenerInfoFuncion(nombre)
            except Exception as exc:
                self.errores.append(str(exc))
                return None
            if len(parametros) != len(nodo.argumentos):
                self.errores.append(
                    f"La funcion '{nombre}' espera {len(parametros)} argumento(s), recibio {len(nodo.argumentos)}"
                )
            for arg in nodo.argumentos:
                self._safe(self.analizar, arg)
            return tipo

        if isinstance(nodo, NodoCondicional):
            self._safe(self.analizar, nodo.condicion)
            for c in nodo.cuerpo_if:
                self._safe(self.analizar, c)
            for c in nodo.cuerpo_else:
                self._safe(self.analizar, c)
            return None

        if isinstance(nodo, NodoWhile):
            self._safe(self.analizar, nodo.condicion)
            for c in nodo.cuerpo:
                self._safe(self.analizar, c)
            return None

        if isinstance(nodo, NodoFor):
            self._safe(self.analizar, nodo.inicio)
            self._safe(self.analizar, nodo.condicion)
            self._safe(self.analizar, nodo.incremento)
            for c in nodo.cuerpo:
                self._safe(self.analizar, c)
            return None

        if isinstance(nodo, NodoRetorno):
            self._safe(self.analizar, nodo.expresion)
            return None

        if isinstance(nodo, NodoImprimir):
            for arg in nodo.argumentos:
                self._safe(self.analizar, arg)
            return None

        if isinstance(nodo, NodoEntrada):
            self._safe(self.analizar, nodo.formato)
            return None

        if isinstance(nodo, NodoIncremento):
            nombre = _tok_value(nodo.nombre)
            if not self.tablaSimbolos.existeVariable(nombre):
                self.errores.append(f"Variable '{nombre}' no declarada antes de incrementar")
            return None

        return None
