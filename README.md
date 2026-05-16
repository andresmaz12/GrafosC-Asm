# GrafosC-Asm

Proyecto final del curso de compiladores. Editor visual de diagramas de flujo
que se traduce a **C** y **Assembler x86 (NASM)** mediante una pipeline
Python invocada desde una UI Next.js.

## Arquitectura

```
UI (Next.js + React)        Backend (Python 3.10+)
+------------------+        +----------------------+
| FlowchartCanvas  |        | pipeline/compile.py  |
| PropertiesPanel  | -----> | flowchart_to_c.py    |
| CodePanel        |  JSON  | TRADUCCION_C/AST_C   |
| ShapesToolbar    |  HTTP  |   semantico_C        |
+------------------+        +----------------------+
        ^                            |
        |    JSON {cCode, asmCode,   |
        +----  errors, files, ...} <-+
```

- La UI envia el `FlowchartState` serializado a `POST /api/compile`.
- La API Route lanza `python -u pipeline/compile.py` por `child_process`.
- Python construye el AST, valida con `AnalizadorSemantico`, genera C y ASM,
  y persiste los archivos en `GrafosC-Asm/` y el Mermaid en `MERMAID/`.
- La UI muestra los tres lenguajes (C / ASM / Mermaid) y los mensajes en
  el panel Echo.

## Prerrequisitos

- **Node.js 20+** y **pnpm** (`npm install -g pnpm`).
- **Python 3.10+** disponible en `PATH` como `python`, `py` o `python3`.

Verifica:

```bash
node --version
pnpm --version
python --version
```

## Instalacion

```bash
pnpm install
```

(No se requieren paquetes Python externos: la pipeline usa solo stdlib.)

## Desarrollo

```bash
pnpm dev
```

Abrir http://localhost:3000.

Al pulsar **Compilar** la UI:

1. Genera el codigo Mermaid en TS (preview rapido).
2. Hace `POST /api/compile` con el `FlowchartState`.
3. La API spawnea Python, recibe `{cCode, asmCode, errors, warnings, files}`.
4. Los tabs C / ASM / Mermaid se actualizan; los mensajes van al panel Echo.

## Estructura

| Carpeta | Proposito |
|---|---|
| `app/` | Next.js App Router. `app/page.tsx` es la pagina principal y `app/api/compile/route.ts` la API. |
| `components/compiler/` | Canvas, panel de propiedades, panel de codigo, gestor de proyectos. |
| `components/ui/` | Componentes base (shadcn/ui). |
| `lib/compiler/` | Tipos compartidos, generador Mermaid TS, cliente API y stubs de los antiguos traductores. |
| `pipeline/` | Entrypoint Python (`compile.py`) y conversor `flowchart_to_c.py`. |
| `TRADUCCION_C/` | AST de C (`AST_C.py`) con generadores `generarCodigoC()` y `generarCodigo()` (ASM), y analizador semantico. |
| `INTERPRETE_MERMAID/` | Esqueleto academico del lexer/parser Mermaid. **No** se usa en la pipeline actual: el puente UI<->Python es JSON. |
| `GrafosC-Asm/` | Salida persistida `<proyecto>.c` y `<proyecto>.asm`. |
| `MERMAID/` | Salida persistida `<proyecto>.md`. |

## Limitaciones conocidas

- El conversor `flowchart_to_c.py` cubre los tipos de figura del editor
  (`start-end`, `process`, `decision`, `input-output`, `subprocess`,
  `return`); expresiones complejas de los campos de texto se parsean con
  un mini-parser limitado a una operacion binaria.
- La generacion de Assembler para `printf`/`scanf` y strings es mock.
- El despliegue en Vercel **no** funciona porque `child_process.spawn`
  requiere un runtime con Python instalado: el proyecto esta pensado
  para ejecutarse en local.
