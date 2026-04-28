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
            ('SEPARADOR', r'\[/\]|\[\[|\]\]|\(\[|\]\)|\{\{|\}\}|[\[\]{}()]'),
            ('TEXTO_GRAFO', r'"[^"]*"|\'[^\']*\''),
            ('ESPACIO', r'\s+') # Para ignorarlo
        ]

    def tokenizar(self, codigo_fuente):
        tokenPatron = self.reglas
        patronGeneral = '|'.join(
            f'(?P<{token}>{patron})'
            for token, patron in tokenPatron
        )
        patronRegex = re.compile(patronGeneral)

        tokensEncontrados = []
        for match in patronRegex.finditer(codigo_fuente):
            for token, valor in match.groupdict().items():
                if valor is not None and token != "ESPACIO":  # Ignoramos espacios en blanco
                    tokensEncontrados.append((token, valor))

        return tokensEncontrados