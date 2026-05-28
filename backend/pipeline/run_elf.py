"""Script que ejecuta un binario ELF Linux dentro de WSL2 y captura su salida.

Protocolo (stdin / stdout, JSON):
    Request (stdin):
        {
            "elfPath": "C:\\path\\to\\outputs\\GrafosC-Asm\\bin\\proyecto",
            "stdin": ""      # opcional: texto a pasar como stdin al programa
        }

    Response (stdout):
        {
            "ok": bool,
            "exitCode": int,
            "stdout": str,
            "stderr": str,
            "elapsed_ms": int,
            "errors": [str]
        }
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import time

_HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _HERE)

from assembler import _win_path_to_wsl  # noqa: E402

# Tiempo máximo de ejecución del programa del usuario (en segundos)
_EXEC_TIMEOUT = 10


def _emit(payload: dict) -> None:
    sys.stdout.write(json.dumps(payload, ensure_ascii=False))
    sys.stdout.flush()


def main() -> int:
    raw = (
        sys.stdin.buffer.read().decode("utf-8-sig", errors="replace")
        if hasattr(sys.stdin, "buffer")
        else sys.stdin.read()
    )
    raw = raw.strip().lstrip("\ufeff")

    # Parsear request
    try:
        request = json.loads(raw) if raw else {}
    except json.JSONDecodeError as exc:
        _emit({"ok": False, "exitCode": -1, "stdout": "", "stderr": "",
               "elapsed_ms": 0, "errors": [f"JSON inválido: {exc}"]})
        return 1

    elf_path_win: str = request.get("elfPath", "")
    user_stdin: str = request.get("stdin", "")

    if not elf_path_win:
        _emit({"ok": False, "exitCode": -1, "stdout": "", "stderr": "",
               "elapsed_ms": 0, "errors": ["elfPath no especificado"]})
        return 1

    if not os.path.isfile(elf_path_win):
        _emit({"ok": False, "exitCode": -1, "stdout": "", "stderr": "",
               "elapsed_ms": 0,
               "errors": [f"Archivo ELF no encontrado: {elf_path_win}"]})
        return 1

    elf_wsl = _win_path_to_wsl(elf_path_win)

    t_start = time.monotonic()
    try:
        proc = subprocess.run(
            ["wsl", elf_wsl],
            input=user_stdin,
            capture_output=True,
            text=True,
            timeout=_EXEC_TIMEOUT,
            encoding="utf-8",
            errors="replace",
        )
        elapsed = int((time.monotonic() - t_start) * 1000)
        _emit({
            "ok": proc.returncode == 0,
            "exitCode": proc.returncode,
            "stdout": proc.stdout,
            "stderr": proc.stderr,
            "elapsed_ms": elapsed,
            "errors": [],
        })
        return 0

    except subprocess.TimeoutExpired:
        elapsed = int((time.monotonic() - t_start) * 1000)
        _emit({
            "ok": False,
            "exitCode": -1,
            "stdout": "",
            "stderr": "",
            "elapsed_ms": elapsed,
            "errors": [
                f"El programa excedió el tiempo límite de ejecución ({_EXEC_TIMEOUT}s). "
                "Puede tener un bucle infinito o estar esperando entrada."
            ],
        })
        return 1

    except FileNotFoundError:
        _emit({
            "ok": False, "exitCode": -1, "stdout": "", "stderr": "",
            "elapsed_ms": 0,
            "errors": ["WSL no encontrado. Asegúrate de tener WSL2 instalado y en el PATH."],
        })
        return 1

    except Exception as exc:
        _emit({
            "ok": False, "exitCode": -1, "stdout": "", "stderr": "",
            "elapsed_ms": int((time.monotonic() - t_start) * 1000),
            "errors": [f"Error inesperado al ejecutar el ELF: {exc}"],
        })
        return 1


if __name__ == "__main__":
    sys.exit(main())
