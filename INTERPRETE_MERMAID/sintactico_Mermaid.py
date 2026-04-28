import AST_MERMAID
#Anailizador sintactico de mermaid
class Parser:
    def __init__(self, tokens):
        self.tokens = tokens
        self.pos = 0

    def obtener_token(self):
        return self.tokens[self.pos] if self.pos < len(self.tokens) else None
    
    def coincidir(self, tipo_esperado):
        token_actual = self.obtener_token()
        if token_actual and token_actual[0] == tipo_esperado:
            self.pos += 1
            return token_actual
        else:
            raise SyntaxError(f"Error sintáctico: Se esperaba {tipo_esperado} pero se encontró: {token_actual}")

    def obtener_texto(self, tipo_buscado):
        self.pos += 1 
        self.obtener_token #Se obtiene el siguiente token para realizar verificaciones
        return self.coincidir(tipo_buscado) #Verificamos que el siguiente token sea texto
            

    def parsear(self):
        #Punto de entrada: se espera una función
        return self.funcion()
 
    def identificar_figura(self):
        tipoFigura = self.coincidir('SEPARADOR') #Se identifica el tipo de figura 
        if tipoFigura == "([":
            return "OVALO"
        elif tipoFigura == "{":
            return "ROMBO"
        elif tipoFigura == "[":
            return "RECTANGULO"
        elif tipoFigura == "[[":
            return "SUBPROCESO"
        elif tipoFigura == "[/]":
            return "PARALELOGRAMO"
        elif tipoFigura == "{\{":
            return "HEXAGONOO"
        
    def funcion(self):
        if self.identificar_figura() == "OVALO": #Nos aseguramos que sea un ovalo => delcaracion/cierre de funcion
            texto_ovalo = self.obtener_texto("TEXTO_GRAFO") #Se obtiene el texto dentro de la figura 
            if "inicio" in texto_ovalo:
                return
            elif "fin" in texto_ovalo:
                pass

    def verificacion_ciclo(self):
        if self.identificar_figura() == "ROMBO": #Nos aseguramos que sea un rombo => ciclo while/ if
            texto_rombo = self.obtener_texto("TEXTO_GRAFO") #Se obtiene el texto dentro de la figura 
            if "while" in texto_rombo:
                pass
            elif "if" in texto_rombo:
                pass

    def proceso(self):
        if self.identificar_figura() == "RECTANGULO": #Nos aseguramos que sea un rectaungulo => proceso print o modificacion de variables
            text_rectangulo = self.obtener_texto("TEXTO_GRAFO") #Se obtiene el texto dentro de la figura 
            if "print" in text_rectangulo:
                pass
            elif " = " in text_rectangulo:
                pass
            elif "+= 1" in text_rectangulo:
                pass
    
    def llamada_funcion(self):
        if self.identificar_figura() == "SUBPROCESO": #Nos aseguramos de que sea un subproceso => llamada de funcion
            texto_subproceso = self.obtener_texto("TEXTO_GRAFO") #Se obtiene el texto dentro de la figura 
            return texto_subproceso
        
    def declaracion_variables(self):
        if self.identificar_figura() == "PARALELOGRAMO": #Nos aseguramos de que sea un paralelogramo => decalracion de varibales
            texto_paralelogramo = self.obtener_texto("TEXTO_GRAFO") #Se obtiene el texto dentro de la figura 
            if "int" in texto_paralelogramo:
                pass
            elif "string" in texto_paralelogramo:
                pass
            elif "bool" in texto_paralelogramo:
                pass
            elif "float" in texto_paralelogramo:
                pass

    def retrono_datos(self):
        if self.identificar_figura() == "HEXAGONOO": #Nos aseguramos de que sea un hexagono => retorno de datos
            texto_hexagono = self.obtener_texto("TEXTO_GRAFO") #Se obtiene el texto dentro de la figura 
            return texto_hexagono
    