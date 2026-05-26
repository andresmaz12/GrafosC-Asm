import sys
import os

def Crear_Archivos(nombre: str, codigo_C: str, codigo_ASM: str, codigo_Mermaid: str):
    # Definir la ruta de la carpeta en el disco C
    ruta_carpeta = r"C:\ArchivosGrafos"
    
    # Comprobar si la carpeta existe; si no, crearla
    if not os.path.exists(ruta_carpeta):
        os.makedirs(ruta_carpeta)
    
    # Combinar la ruta de la carpeta con el nombre del archivo
    ruta_base = os.path.join(ruta_carpeta, nombre)
    
    # Guardar los archivos en la ruta específica
    with open(ruta_base + ".c", "w", encoding="utf-8") as archivo_c:
        archivo_c.write(codigo_C)
    with open(ruta_base + ".asm", "w", encoding="utf-8") as archivo_asm:
        archivo_asm.write(codigo_ASM)
    with open(ruta_base + ".md", "w", encoding="utf-8") as archivo_mermaid:
        archivo_mermaid.write(codigo_Mermaid)

