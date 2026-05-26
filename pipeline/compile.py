"""Entrypoint del compilador llamado por la API Route de Next.js.

Protocolo (stdin / stdout, JSON):

Request (stdin)::
    {
        "projectName": "demo",
        "flowchartState": { "nodes": [...], "connections": [...] },
        "mermaidCode": "..."   # opcional, generado por la UI para persistir
    }

Response (stdout)::
    {
        "ok": true,
        "cCode": "...",
        "asmCode": "...",
        "mermaidCode": "...",
        "errors": [...],
        "warnings": [...],
        "files": { "c": "GrafosC-Asm/<proj>.c", "asm": "...", "mermaid": "..." }
    }

Si la traduccion falla, se retorna ``ok=false`` y la lista de errores.
"""

from __future__ import annotations

import json
import os
import re
import sys
import traceback

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(ROOT, "TRADUCCION_C"))
sys.path.insert(0, os.path.join(ROOT, "pipeline"))

from flowchart_to_c import build_program  # noqa: E402
from TRADUCCION_C.semantico_C import AnalizadorSemantico  # noqa: E402
from assembler import assemble_and_link  # noqa: E402


_SAFE_NAME = re.compile(r"[^a-zA-Z0-9_-]+")


def _safe_filename(name: str) -> str:
    name = (name or "proyecto").strip()
    name = _SAFE_NAME.sub("_", name)
    return name or "proyecto"


def _write(path: str, contents: str) -> str:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(contents)
    return os.path.relpath(path, ROOT).replace(os.sep, "/")


def _emit(payload):
    sys.stdout.write(json.dumps(payload, ensure_ascii=False))
    sys.stdout.flush()


def main() -> int:
    raw = sys.stdin.buffer.read().decode("utf-8-sig", errors="replace") if hasattr(sys.stdin, "buffer") else sys.stdin.read()
    raw = raw.lstrip("\ufeff")
    if not raw.strip():
        _emit({"ok": False, "errors": ["Stdin vacio"], "warnings": []})
        return 1

    try:
        request = json.loads(raw)
    except json.JSONDecodeError as exc:
        _emit({"ok": False, "errors": [f"JSON invalido: {exc}"], "warnings": []})
        return 1

    project_name = _safe_filename(request.get("projectName", "proyecto"))
    flowchart_state = request.get("flowchartState") or {}
    mermaid_in = request.get("mermaidCode") or ""

    errors: list[str] = []
    warnings: list[str] = []
    c_code = ""
    asm_code = ""
    files: dict[str, str] = {}

    try:
        programa, build_warnings = build_program(flowchart_state)
        warnings.extend(build_warnings)

        sem = AnalizadorSemantico()
        sem_errors = sem.analizar_y_recolectar(programa)
        errors.extend(sem_errors)

        try:
            c_code = programa.generarCodigoC()
        except Exception as exc:
            errors.append(f"Error generando C: {exc}")

        try:
            asm_code = programa.generarCodigo()
        except Exception as exc:
            errors.append(f"Error generando ASM: {exc}")

        if c_code:
            files["c"] = _write(os.path.join(ROOT, "GrafosC-Asm", f"{project_name}.c"), c_code)
        if asm_code:
            asm_abs = os.path.join(ROOT, "GrafosC-Asm", f"{project_name}.asm")
            files["asm"] = _write(asm_abs, asm_code)

            # --- Ensamblar y linkear con NASM + ld vía WSL ---
            try:
                asm_ok, elf_abs, asm_errors, asm_warnings = assemble_and_link(asm_abs)
                warnings.extend(asm_warnings)
                if asm_ok:
                    files["elf"] = os.path.relpath(elf_abs, ROOT).replace(os.sep, "/")
                else:
                    errors.extend(asm_errors)
            except Exception as exc:
                warnings.append(f"Ensamblador: error inesperado — {exc}")

        if mermaid_in:
            files["mermaid"] = _write(os.path.join(ROOT, "MERMAID", f"{project_name}.md"), mermaid_in)

    except Exception as exc:
        errors.append(f"Error interno: {exc}")
        sys.stderr.write(traceback.format_exc())

    _emit({
        "ok": not errors,
        "cCode": c_code,
        "asmCode": asm_code,
        "mermaidCode": mermaid_in,
        "errors": errors,
        "warnings": warnings,
        "files": files,
    })
    return 0 if not errors else 2


if __name__ == "__main__":
    sys.exit(main())
