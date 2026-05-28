"""Script invocable por la API Route de Next.js para verificar prerequisitos
de ensamblado (WSL2, NASM, ld) sin necesidad de ensamblar ningún archivo.

Protocolo (stdin / stdout, JSON):
    Request (stdin): {} o vacío
    Response (stdout): {
        "wsl": bool,
        "nasm": bool,
        "ld": bool,
        "wsl_distro": str,
        "nasm_ver": str,
        "ld_ver": str,
        "install_hint": str
    }
"""

from __future__ import annotations

import json
import os
import sys

# Asegurar que el directorio del pipeline esté en el path
_HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _HERE)

from assembler import check_prerequisites  # noqa: E402


def main() -> int:
    prereq = check_prerequisites()
    sys.stdout.write(json.dumps(prereq, ensure_ascii=False))
    sys.stdout.flush()
    return 0 if (prereq["wsl"] and prereq["nasm"] and prereq["ld"]) else 1


if __name__ == "__main__":
    sys.exit(main())
