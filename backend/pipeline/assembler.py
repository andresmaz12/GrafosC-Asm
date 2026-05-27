"""Módulo de ensamblado: convierte un .asm (NASM x86) en un ELF ejecutable de Linux.

Estrategia:
    1. Detecta si WSL está disponible en el PATH de Windows.
    2. Convierte la ruta Windows del .asm a una ruta WSL compatible.
    3. Ejecuta ``wsl nasm -f elf32 <archivo.asm> -o <archivo.o>``.
    4. Ejecuta ``wsl ld -m elf_i386 <archivo.o> -o <ejecutable>``.
    5. Retorna (ok, elf_path, errors, warnings).

Si WSL o NASM no están disponibles, retorna ok=False con un mensaje de
instrucciones manuales en warnings, sin lanzar excepción.
"""

from __future__ import annotations

import os
import shutil
import subprocess


# ---------------------------------------------------------------------------
# Helpers de detección
# ---------------------------------------------------------------------------

def _wsl_available() -> bool:
    """Retorna True si el ejecutable 'wsl' está en el PATH de Windows."""
    return shutil.which("wsl") is not None


def _win_path_to_wsl(path: str) -> str:
    """Convierte 'C:\\foo\\bar.asm' → '/mnt/c/foo/bar.asm' para WSL."""
    path = os.path.abspath(path)
    drive, rest = os.path.splitdrive(path)           # 'C:', '\\foo\\bar.asm'
    drive_letter = drive.rstrip(":").lower()          # 'c'
    rest_posix = rest.replace("\\", "/")              # '/foo/bar.asm'
    return f"/mnt/{drive_letter}{rest_posix}"


def _run_wsl(args: list[str], timeout: int = 30) -> tuple[int, str, str]:
    """Ejecuta un comando bajo WSL y retorna (returncode, stdout, stderr)."""
    result = subprocess.run(
        ["wsl"] + args,
        capture_output=True,
        text=True,
        timeout=timeout,
    )
    return result.returncode, result.stdout.strip(), result.stderr.strip()


# ---------------------------------------------------------------------------
# API pública
# ---------------------------------------------------------------------------

def assemble_and_link(
    asm_path: str,
    *,
    output_dir: str | None = None,
) -> tuple[bool, str, list[str], list[str]]:
    """Ensambla *asm_path* con NASM y linkea con ld dentro de WSL.

    Args:
        asm_path:   Ruta Windows absoluta al archivo ``.asm``.
        output_dir: Directorio donde guardar ``.o`` y el ELF.
                    Si es None, usa el mismo directorio que el ``.asm``.

    Returns:
        ``(ok, elf_path, errors, warnings)``

        - *ok*       : True si se produjo el binario ELF sin errores.
        - *elf_path* : Ruta Windows al binario ELF (vacío si ok=False).
        - *errors*   : Lista de mensajes de error.
        - *warnings* : Lista de advertencias / instrucciones manuales.
    """
    errors: list[str] = []
    warnings: list[str] = []

    # --- 1. Verificar WSL ---
    if not _wsl_available():
        warnings.append(
            "WSL no encontrado: el archivo .asm no fue ensamblado automáticamente. "
            "Para compilarlo manualmente, instala WSL y ejecuta:\n"
            "  wsl nasm -f elf32 <archivo.asm> -o <archivo.o>\n"
            "  wsl ld -m elf_i386 <archivo.o> -o <ejecutable>"
        )
        return False, "", errors, warnings

    # --- 2. Preparar rutas ---
    base_name = os.path.splitext(os.path.basename(asm_path))[0]
    out_dir = output_dir or os.path.dirname(asm_path)
    os.makedirs(out_dir, exist_ok=True)

    obj_path_win = os.path.join(out_dir, base_name + ".o")
    elf_path_win = os.path.join(out_dir, base_name)          # sin extensión = ELF

    asm_wsl = _win_path_to_wsl(asm_path)
    obj_wsl = _win_path_to_wsl(obj_path_win)
    elf_wsl = _win_path_to_wsl(elf_path_win)

    # --- 3. Verificar que NASM está instalado en WSL ---
    rc, _, _ = _run_wsl(["which", "nasm"])
    if rc != 0:
        errors.append(
            "NASM no está instalado en WSL. Instálalo con:\n"
            "  wsl sudo apt-get install -y nasm"
        )
        return False, "", errors, warnings

    # --- 4. Ensamblar con NASM ---
    rc, stdout, stderr = _run_wsl(
        ["nasm", "-f", "elf32", asm_wsl, "-o", obj_wsl]
    )
    if rc != 0:
        errors.append(f"NASM falló (código {rc}):\n{stderr or stdout}")
        return False, "", errors, warnings
    if stderr:
        warnings.append(f"NASM warnings:\n{stderr}")

    # --- 5. Linkear con ld ---
    rc, stdout, stderr = _run_wsl(
        ["ld", "-m", "elf_i386", obj_wsl, "-o", elf_wsl]
    )
    if rc != 0:
        errors.append(f"ld falló (código {rc}):\n{stderr or stdout}")
        return False, "", errors, warnings
    if stderr:
        warnings.append(f"ld warnings:\n{stderr}")

    # --- 6. Marcar el ELF como ejecutable ---
    _run_wsl(["chmod", "+x", elf_wsl])

    return True, elf_path_win, errors, warnings
