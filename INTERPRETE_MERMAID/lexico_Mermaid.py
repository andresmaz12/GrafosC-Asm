import re
#Lexico de mermaid 
class Lexer:
    def __init__(self):
        self.reglas = [
            ('PALABRA_CLAVE', r'\b(graph|subgraph|end)\b'),
            ('DIRECCION', r'\b(TD|LR|TB|RL)\b'),
            ('FLECHA', r'-->|---'),
            ('PUNTO_Y_COMA', r';'),
            ('ID_NODO', r'[a-zA-Z_][a-zA-Z0-9_]*'),
            ('ESPACIO', r'\s+') # Para ignorarlo
        ]

    def tokenizar(self, codigo_fuente):
        tokens = []
        # Lógica para iterar sobre el código y aplicar expresiones regulares
        # Retorna una lista: [Token('PALABRA_CLAVE', 'graph'), Token('DIRECCION', 'TD'), ...]
        return tokens