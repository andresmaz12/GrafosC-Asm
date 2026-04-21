class NodoAST:
    #Clase de los nodos del Arbol de sintaxis trivial
    def generarCodigo(self):
    #Traducción de c++ a Assembler
        raise NotImplementedError("Método generarCodigo() no implementado en este Nodo")

class NodoPrograma(NodoAST):
    def __init__(self, funciones, main):
       self.variables = []
       self.funciones = funciones
       self.main = main

    def generarCodigo(self):
       codigo = ["Section .text", "global _start"]
       data = ["Section .bss"]
       for funcion in self.funciones: 
          codigo.append(funcion.generarCodigo())
          self.variables.append((funcion.cuerpo[0].tipo[1], funcion.cuerpo[0].nombre[1]))
          if len(funcion.parametros) > 0:
            for parametro in funcion.parametros:
                self.variables.append(parametro.tipo[1], parametro.nombre[1])
        
            #Genrar el punto de entrada del programa
            codigo.append("_statrt: ")
            codigo.append(self.main.generarCodigo())
            #Finalizar el programa 
            codigo.append("     mov eax, 1 ;syscall exit ")
            codigo.append("     xor ebx, ebx")
            codigo.append("     int 0x80")

            #Seccion de reserva de memoria para las variables
            for variable in self.variables:
                if variable[0] == "int":
                    data.append(f"  {variable[1]}:    resd 1")

            codigo = "\n".join(codigo)
            return "\n".join(data) + codigo     

class NodoFuncion(NodoAST):
    #Nodo que representa la funcion
    def __init__(self, tipo, nombre, parametros, cuerpo):
      self.tipo = tipo
      self.nombre = nombre
      self.parametros = parametros
      self.cuerpo = cuerpo
    
    def generarCodigo(self):
        codigo = f"{self.nombre}: \n"
        if len(self.parametros) > 0: 
           # aqui se guarda en pila el registro ax a usar
           for parametro in self.parametros:
              codigo += "\n    pop     eax"
              codigo += f"\n    mov [{self.parametros[1]}], eax"
        
        codigo += "\n".join(c.generarCodigo() for c in self.cuerpo)
        codigo += "\n    ret"
        codigo += "\n"
        return codigo
              

class NodoParametro(NodoAST):
    def __init__(self, tipo, nombre):
        self.tipo = tipo
        self.nombre = nombre

class NodoAsignacion(NodoAST):
    #Nodo que representa la asignacion
    def __init__(self, tipo, nombre, expresion):
        self.tipo = tipo
        self.nombre = nombre
        self.expresion = expresion
    
    def generarCodigo(self):
        codigo = self.expresion.generarCodigo()
        codigo += f"\n    mov[{self.nombre[1]}, eax]"
        return codigo

class NodoOperacion(NodoAST):
    def __init__(self, izquierda, operador, derecha):
        self.izquierda = izquierda
        self.derecha = derecha
        self.operador = operador

    def generarCodigo(self):
        coidigo = []
        coidigo.append(self.izquierda.generarCodigo())
        coidigo.append("   push     eax")
        coidigo.append(self.derecha.generarCodigo())
        coidigo.append("   mov   ebx, eax")
        coidigo.append("   pop   eax")
        if self.operador[1] == "+":
            coidigo.append("   add    eax, ebx")
        elif self.operador[1] == "-":
            coidigo.append("   sub   eax, ebx")
        elif self.operador[1] == "*":
            coidigo.append("   mul   eax, ebx")
        elif self.operador[1] == "/":
           coidigo.append("    div   eax, ebx")

        return "\n".join(coidigo)
    
    def optimizar(self):
        if isinstance(self.izquierda, NodoOperacion):
            self.izquierda.optimizar()
        else:
            izquierda = self.izquierda

        if isinstance(self.derecha, NodoOperacion):
            self.derecha.optimizar()
        else:
            derecha = self.derecha

        #Si ambos nodos son números evaluamos la operación
        if isinstance(izquierda, NodoNumero) and isinstance(derecha, NodoNumero):
            izq = int(izquierda.valor[1])
            der = der(derecha.valor[1])
            if self.operador[1] == "+":
               valor = izq + der
            elif self.operador == "-":
                valor = izq - der
            elif self.operador == "*":
                valor = izq * der 
            elif self.operador == "/":
                if der != 0:
                    valor = izq / der
                else:
                    raise Exception ("Error: Es matematicamente imposible dividir un numero entre 0") 
            return NodoNumero(('NUMBER', str(valor))) 

        #Simplificacion algebraica
        if isinstance(derecha, NodoNumero) and int(derecha.valor[1]) == "1" and self.operador[1] == "*":
            return izquierda
        if isinstance(izquierda, NodoNumero) and int(izquierda.valor[1]) == "1" and self.operador[1] == "*":
            return derecha
        if isinstance(derecha, NodoNumero) and int(derecha.valor[1]) == "0" and self.operador[1] == "+":
            return izquierda
        if isinstance(izquierda, NodoNumero) and int(izquierda.valor[1]) == "0" and self.operador[1] == "+":
            return derecha
        if isinstance(derecha, NodoNumero) and int(derecha.valor[1]) == "0" and self.operador[1] == "/":
            raise Exception("Error: Es matematicamente imposible dividir un numero entre 0")
        if izquierda.valor[1] == derecha.valor[1] and self.operador[1] == "/":
            return 1
        
        # SI no se puede optimizar mas se devuelve la expresion 
        return NodoOperacion(izquierda, self.operador[1], derecha)
    
class NodoRetorno(NodoAST):
    #Nodo para representar el retorno
    def __init__(self, expresion ):
        self.expresion = expresion
    
    def generarCodigo(self):
        return self.expresion.generarCodigo()

class NodoIdent(NodoAST):
    def __init__(self, nombre):
        self.nombre = nombre
    
    def generarCodigo(self):
       return f"\n     mov   eax, {self.nombre[1]}"

class NodoNumero(NodoAST):
    def __init__(self, valor):
        self.valor = valor

    def generarCodigo(self):
       return f"\n     mov   eax, {self.valor[1]}"
    
class NodoString(NodoAST):
    def __init__(self, argumentos):
        self.argumentos = argumentos
    
    def generarCodigo(self):
       raise NotImplementedError("Strings en ensamblador aun no implementado")
    
class NodoCondicional(NodoAST):
    def __init__(self, condicion, cuerpo_if, cuerpo_else):
        self.condicion = condicion
        self.cuerpo_if = cuerpo_if
        self.cuerpo_else = cuerpo_else  # puede ser [] si no hay else

class NodoImprimir(NodoAST):
    def __init__(self, tipo, argumentos):
        self.tipo = tipo          # el token 'printf' o 'puts'
        self.argumentos = argumentos  # lista de nodos
    
class NodoWhile(NodoAST):
    def __init__(self, condicion, cuerpo):
        self.condicion = condicion
        self.cuerpo = cuerpo

class NodoFor(NodoAST):
    def __init__(self, inicio, condicion, incremento, cuerpo):
        self.inicio = inicio
        self.condicion = condicion
        self.incremento = incremento
        self.cuerpo = cuerpo

    
class NodoIncremento(NodoAST):
    def __init__(self, nombre, operador):
        self.nombre = nombre
        self.operador = operador


class NodoEntrada(NodoAST):
    def __init__(self, tipo, formato, variable):
        self.tipo = tipo
        self.formato = formato
        self.variable = variable
 
class NodoLlamadaFuncion():
  def __init__(self, nombref, argumentos):
    self.nombre_funcion = nombref
    self.argumentos = argumentos

  def generarCodigo(self):
      codigo = []
      for arg in reversed(self.argumentos): #Apilamos argumentos en orden inverso
          codigo.append(arg.generarCodigo())
          codigo.append("   push  eax   ;pasar argumento a la pila ")

          codigo.append(f"   call {self.nombre_funcion} ;Llamar a la funcion {self.nombre_funcion}")
          codigo.append(f"   add eps, {len(self.argumentos) * 4} ; Limpiar pila de argumnetos")
          return "\n".join(codigo)