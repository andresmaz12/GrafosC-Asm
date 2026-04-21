# sintactico.py (Concepto)
class NodoAST:
    pass

class DefinicionGrafo(NodoAST):
    def __init__(self, direccion, sentencias):
        self.direccion = direccion
        self.sentencias = sentencias

class Conexion(NodoAST):
    def __init__(self, origen, destino, tipo_enlace):
        self.origen = origen
        self.destino = destino
        self.tipo_enlace = tipo_enlace

class Parser:
    def __init__(self, tokens):
        self.tokens = tokens
        self.pos = 0

    def parsear(self):
        # Lógica recursiva para consumir tokens y construir el AST
        # Si encuentra "graph TD; A-->B;", construye:
        # DefinicionGrafo(direccion='TD', sentencias=[Conexion('A', 'B', '-->')])
        pass