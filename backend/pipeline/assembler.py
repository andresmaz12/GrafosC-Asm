"""Módulo de ensamblado: convierte un .asm (NASM x86-32) en un ELF ejecutable Linux.

Estrategia (Windows 10/11 con WSL2):
    1. Detecta si WSL2 está disponible en el PATH de Windows.
    2. Verifica que nasm y ld estén instalados dentro del entorno WSL.
    3. Copia el .asm a un directorio temporal NATIVO de WSL (/tmp/grafos-asm-<nombre>)
       porque NASM NO puede escribir archivos de salida en /mnt/c/ (restricción de
       permisos NTFS de WSL2 sobre el filesystem de Windows).
    4. Ejecuta: nasm -f elf32 <tmp>.asm -o <tmp>.o
    5. Ejecuta: ld -m elf_i386 <tmp>.o -o <tmp_elf>
    6. Copia el .o y el ELF de /tmp/ de vuelta a la ruta Windows de destino.
    7. Limpia el directorio temporal.
    8. Retorna un dict enriquecido con ok, rutas, logs completos y tiempos.

Si WSL o NASM/ld no están disponibles, retorna ok=False con instrucciones
detalladas de instalación, sin lanzar excepción.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import time


# ---------------------------------------------------------------------------
# Helpers de conversión de rutas
# ---------------------------------------------------------------------------

def _win_path_to_wsl(path: str) -> str:
    """Convierte 'C:\\foo\\bar.asm' → '/mnt/c/foo/bar.asm' para WSL."""
    path = os.path.abspath(path)
    drive, rest = os.path.splitdrive(path)           # 'C:', '\\foo\\bar.asm'
    drive_letter = drive.rstrip(":").lower()          # 'c'
    rest_posix = rest.replace("\\", "/")              # '/foo/bar.asm'
    return f"/mnt/{drive_letter}{rest_posix}"


def _run_wsl(args: list[str], timeout: int = 60) -> tuple[int, str, str]:
    """Ejecuta un comando bajo WSL y retorna (returncode, stdout, stderr)."""
    result = subprocess.run(
        ["wsl"] + args,
        capture_output=True,
        text=True,
        timeout=timeout,
        encoding="utf-8",
        errors="replace",
    )
    return result.returncode, result.stdout.strip(), result.stderr.strip()


# ---------------------------------------------------------------------------
# Verificación de prerequisitos
# ---------------------------------------------------------------------------

def check_prerequisites() -> dict:
    """Verifica disponibilidad de WSL, NASM y ld en el entorno actual.

    Returns:
        dict con claves:
            wsl        (bool)  — WSL ejecutable encontrado en PATH
            nasm       (bool)  — NASM instalado dentro de WSL
            ld         (bool)  — ld (binutils) instalado dentro de WSL
            wsl_distro (str)   — nombre de la distro activa (o "")
            nasm_ver   (str)   — versión de NASM reportada (o "")
            ld_ver     (str)   — versión de ld reportada (o "")
            install_hint (str) — instrucciones de instalación si faltan herramientas
    """
    result: dict = {
        "wsl": False,
        "nasm": False,
        "ld": False,
        "wsl_distro": "",
        "nasm_ver": "",
        "ld_ver": "",
        "install_hint": "",
    }

    # 1. WSL disponible en PATH de Windows
    if shutil.which("wsl") is None:
        result["install_hint"] = (
            "WSL2 no encontrado. Instálalo desde Microsoft Store o ejecuta en PowerShell:\n"
            "  wsl --install\n"
            "Luego reinicia Windows y vuelve a intentarlo."
        )
        return result
    result["wsl"] = True

    # Distro activa
    try:
        rc, out, _ = _run_wsl(["lsb_release", "-sd"], timeout=10)
        if rc == 0:
            result["wsl_distro"] = out.strip('"')
    except Exception:
        pass

    # 2. NASM instalado en WSL
    try:
        rc, out, _ = _run_wsl(["which", "nasm"], timeout=10)
        result["nasm"] = rc == 0
        if rc == 0:
            _, ver, _ = _run_wsl(["nasm", "--version"], timeout=10)
            result["nasm_ver"] = ver.split("\n")[0]
    except Exception:
        result["nasm"] = False

    # 3. ld instalado en WSL
    try:
        rc, out, _ = _run_wsl(["which", "ld"], timeout=10)
        result["ld"] = rc == 0
        if rc == 0:
            _, ver, _ = _run_wsl(["ld", "--version"], timeout=10)
            result["ld_ver"] = ver.split("\n")[0]
    except Exception:
        result["ld"] = False

    # Hint de instalación si faltan herramientas
    missing = []
    if not result["nasm"]:
        missing.append("nasm")
    if not result["ld"]:
        missing.append("binutils")
    if missing:
        pkgs = " ".join(missing)
        result["install_hint"] = (
            f"Las siguientes herramientas faltan en WSL: {', '.join(missing)}.\n"
            f"Instálalas ejecutando en PowerShell:\n"
            f"  wsl sudo apt-get update && wsl sudo apt-get install -y {pkgs}"
        )

    return result


# ---------------------------------------------------------------------------
# API pública principal
# ---------------------------------------------------------------------------

def assemble_and_link(
    asm_path: str,
    *,
    output_dir: str | None = None,
    timeout: int = 60,
) -> dict:
    """Ensambla *asm_path* con NASM y linkea con ld dentro de WSL2.

    NOTA: Compila en el filesystem NATIVO de WSL (/tmp) para evitar la
    restricción de permisos de WSL2 al escribir en /mnt/c/ (NTFS de Windows).
    Los binarios resultantes se copian de vuelta a la ruta Windows especificada.

    Args:
        asm_path:   Ruta Windows absoluta al archivo ``.asm``.
        output_dir: Directorio Windows donde guardar ``.o`` y el ELF.
                    Si es None, usa <mismo_dir>/bin/.
        timeout:    Timeout en segundos para cada subproceso WSL.

    Returns:
        dict con claves:
            ok         (bool)    — True si se generó el binario sin errores
            elf_path   (str)     — Ruta Windows al ELF (vacío si ok=False)
            obj_path   (str)     — Ruta Windows al .o  (vacío si ok=False)
            errors     (list)    — Mensajes de error
            warnings   (list)    — Advertencias
            nasm_log   (str)     — Salida combinada stdout+stderr de NASM
            ld_log     (str)     — Salida combinada stdout+stderr de ld
            elapsed_ms (int)     — Milisegundos totales de ensamblado+linkeo
            prereq     (dict)    — Resultado de check_prerequisites()
    """
    t_start = time.monotonic()
    errors: list[str] = []
    warnings: list[str] = []
    nasm_log = ""
    ld_log = ""

    def _fail(extra_errors=None, nasm="", ld="") -> dict:
        return {
            "ok": False, "elf_path": "", "obj_path": "",
            "errors": errors + (extra_errors or []),
            "warnings": warnings,
            "nasm_log": nasm, "ld_log": ld,
            "elapsed_ms": int((time.monotonic() - t_start) * 1000),
            "prereq": prereq,
        }

    # --- 0. Verificar prerequisitos ---
    prereq = check_prerequisites()
    if not prereq["wsl"]:
        return _fail([prereq["install_hint"]])
    if not prereq["nasm"] or not prereq["ld"]:
        return _fail([prereq["install_hint"]])

    # --- 1. Preparar rutas Windows de destino ---
    base_name = os.path.splitext(os.path.basename(asm_path))[0]
    if output_dir is None:
        output_dir = os.path.join(os.path.dirname(asm_path), "bin")
    os.makedirs(output_dir, exist_ok=True)

    obj_path_win = os.path.join(output_dir, base_name + ".o")
    elf_path_win = os.path.join(output_dir, base_name)   # sin extensión → ELF

    # Rutas WSL para el .asm fuente y destinos de vuelta a Windows
    asm_wsl     = _win_path_to_wsl(asm_path)
    obj_wsl_out = _win_path_to_wsl(obj_path_win)
    elf_wsl_out = _win_path_to_wsl(elf_path_win)

    # --- 2. Directorio temporal en el filesystem NATIVO de WSL ---
    # NASM no puede crear archivos en /mnt/c/ por restricciones de permisos NTFS.
    # Trabajamos en /tmp dentro de WSL y copiamos los resultados al final.
    wsl_tmp  = f"/tmp/grafos-asm-{base_name}"
    wsl_asm  = f"{wsl_tmp}/{base_name}.asm"
    wsl_obj  = f"{wsl_tmp}/{base_name}.o"
    wsl_elf  = f"{wsl_tmp}/{base_name}"

    def _cleanup():
        try:
            _run_wsl(["bash", "-c", f"rm -rf '{wsl_tmp}'"], timeout=10)
        except Exception:
            pass

    # Limpiar posibles restos de una ejecución anterior y preparar el directorio
    # Usamos bash -c para ejecutar mkdir+cp en UN solo proceso WSL y verificar
    # el código de retorno — cp falla silenciosamente si no lo verificamos.
    setup_cmd = (
        f"rm -rf '{wsl_tmp}' && "
        f"mkdir -p '{wsl_tmp}' && "
        f"cp '{asm_wsl}' '{wsl_asm}'"
    )
    rc_setup, out_setup, err_setup = _run_wsl(["bash", "-c", setup_cmd], timeout=15)
    if rc_setup != 0:
        return _fail([
            f"No se pudo preparar el directorio temporal en WSL (código {rc_setup}).\n"
            f"  Origen : {asm_wsl}\n"
            f"  Destino: {wsl_asm}\n"
            f"  Salida : {err_setup or out_setup or 'sin output'}\n"
            f"  Verifica que el archivo .asm exista y que WSL tenga acceso a /mnt/c/"
        ])

    # Verificar que el archivo quedó copiado antes de invocar NASM
    rc_ls, _, _ = _run_wsl(["bash", "-c", f"test -f '{wsl_asm}'"], timeout=5)
    if rc_ls != 0:
        _cleanup()
        return _fail([
            f"El archivo .asm no existe en el tmp de WSL después del cp.\n"
            f"  Ruta esperada: {wsl_asm}"
        ])

    # --- 3-6. Pipeline completo en un SOLO script bash dentro de WSL ---
    # Se usa bash -c para que todo ocurra en un único proceso WSL, evitando
    # problemas de estado entre llamadas separadas y manejando rutas con
    # caracteres especiales con comillas simples.
    #
    # El script imprime etiquetas delimitadoras para separar stdout de nasm/ld.
    build_script = f"""
set -e
# Paso 3: Ensamblar
nasm -f elf32 '{wsl_asm}' -o '{wsl_obj}'
echo '__NASM_OK__'
# Paso 4: Linkear
ld -m elf_i386 '{wsl_obj}' -o '{wsl_elf}'
echo '__LD_OK__'
# Paso 5: Permisos
chmod +x '{wsl_elf}'
# Paso 6: Copiar de vuelta a Windows (crear dir primero desde WSL)
mkdir -p '{_win_path_to_wsl(output_dir)}'
cp '{wsl_obj}' '{obj_wsl_out}' || true
cp '{wsl_elf}' '{elf_wsl_out}' || true
echo '__COPY_OK__'
"""
    try:
        rc, stdout, stderr = _run_wsl(["bash", "-c", build_script], timeout=timeout * 3)
    except subprocess.TimeoutExpired:
        errors.append(f"Pipeline WSL timeout ({timeout * 3}s). WSL no responde.")
        _cleanup()
        return _fail(nasm=nasm_log, ld=ld_log)

    # Separar logs de NASM y ld a partir de los marcadores
    combined = (stdout + "\n" + stderr).strip()
    if "__NASM_OK__" in combined:
        # Todo lo antes de __NASM_OK__ es output de NASM (puede ser vacío si no hubo errores)
        nasm_log = combined.split("__NASM_OK__")[0].strip()
    else:
        # NASM falló — toda la salida es el error
        nasm_log = combined
        errors.append(f"NASM falló (código {rc}):\n{nasm_log or 'sin output'}")
        _cleanup()
        return _fail(nasm=nasm_log)

    if "__LD_OK__" in combined:
        between = combined.split("__NASM_OK__")[1].split("__LD_OK__")[0].strip()
        ld_log = between
    else:
        # ld falló — capturar output entre NASM_OK y el final
        ld_section = combined.split("__NASM_OK__")[1].strip() if "__NASM_OK__" in combined else combined
        ld_log = ld_section
        errors.append(f"ld falló (código {rc}):\n{ld_log or 'sin output'}")
        _cleanup()
        return _fail(nasm=nasm_log, ld=ld_log)

    if rc != 0 and "__COPY_OK__" not in combined:
        # El copy back falló pero el ELF se generó en WSL
        warnings.append("No se pudo copiar el ELF a outputs/; el ELF existe en /tmp de WSL.")

    # --- 7. Limpieza ---
    _cleanup()

    elapsed = int((time.monotonic() - t_start) * 1000)
    return {
        "ok": True,
        "elf_path": elf_path_win,
        "obj_path": obj_path_win,
        "errors": errors,
        "warnings": warnings,
        "nasm_log": nasm_log,
        "ld_log": ld_log,
        "elapsed_ms": elapsed,
        "prereq": prereq,
    }
