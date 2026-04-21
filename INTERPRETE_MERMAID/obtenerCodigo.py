from lexico_Mermaid import *
from sintactico_Mermaid import *
from semantico_Mermaid import *

codigo_mermaid = "graph TD; A-->B;"

lexer = Lexer()
tokens = lexer.tokenizar(codigo_mermaid)

parser = Parser(tokens)
ast = parser.parsear()

semantico = AnalizadorSemantico(ast)
semantico.analizar()

# A partir de aquí, el AST validado pasaría a una etapa de 
# "Generación de Código" para dibujar el SVG en pantalla.