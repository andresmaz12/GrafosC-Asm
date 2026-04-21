# semantico.py (Concepto)
class AnalizadorSemantico:
    def __init__(self, ast):
        self.ast = ast
        self.tabla_simbolos = {} # Guarda la metadata de cada nodo descubierto

    def analizar(self):
        self.visitar(self.ast)

    def visitar_Conexion(self, nodo):
        # Regla Semántica: Registrar nodos implícitos si no existían
        if nodo.origen not in self.tabla_simbolos:
            self.tabla_simbolos[nodo.origen] = {"tipo": "nodo_estandar", "etiqueta": nodo.origen}
        
        if nodo.destino not in self.tabla_simbolos:
            self.tabla_simbolos[nodo.destino] = {"tipo": "nodo_estandar", "etiqueta": nodo.destino}
            
        # Regla Semántica: ¿Es válido este tipo de conexión en este grafo?
        if nodo.origen == nodo.destino:
            print(f"Advertencia/Error: Auto-conexión en el nodo {nodo.origen} no soportada en este motor.")