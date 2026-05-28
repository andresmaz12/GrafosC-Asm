import os
import sys
import json
import subprocess
import time

def run_all_tests():
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(tests_dir)
    compile_script = os.path.join(project_root, "backend", "pipeline", "compile.py")
    
    print("=" * 60)
    print("  COMPILADOR - PROCESADOR DE PRUEBAS AUTOMATIZADO")
    print("=" * 60)
    print(f"Buscando pruebas en: {tests_dir}")
    print(f"Script de compilacion: {compile_script}\n")
    
    test_files = [f for f in os.listdir(tests_dir) if f.endswith(".json")]
    
    if not test_files:
        print("[-] No se encontraron archivos de prueba .json")
        return
    
    report_lines = [
        "# Reporte de Pruebas del Compilador",
        f"Generado el: {time.strftime('%Y-%m-%d %H:%M:%S')}",
        "",
        "Este reporte detalla los resultados de compilar los 4 diagramas de flujo de prueba para evaluar los limites del compilador.",
        "",
        "## Resumen General",
        "",
        "| Prueba | Proyecto | Estado Compilacion | C Generado | ASM Generado | ELF Ensamblado | Advertencias |",
        "|---|---|---|---|---|---|---|",
    ]
    
    results = []
    
    for idx, filename in enumerate(sorted(test_files), 1):
        file_path = os.path.join(tests_dir, filename)
        print(f"[{idx}/{len(test_files)}] Procesando {filename}...")
        
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                project_data = json.load(f)
        except Exception as e:
            print(f"  [X] Error al leer archivo: {e}")
            continue
            
        project_name = project_data.get("name", "proyecto")
        flowchart_state = project_data.get("flowchartState", {})
        
        # Preparar payload para stdin de compile.py
        payload = {
            "projectName": filename.replace(".json", ""),
            "flowchartState": flowchart_state,
            "mermaidCode": "%% Diagrama Mermaid de prueba"
        }
        
        # Ejecutar compilador
        start_time = time.time()
        try:
            proc = subprocess.Popen(
                [sys.executable, compile_script],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                encoding="utf-8"
            )
            stdout, stderr = proc.communicate(input=json.dumps(payload, ensure_ascii=False))
            elapsed = (time.time() - start_time) * 1000
        except Exception as e:
            print(f"  [X] Error ejecutando pipeline: {e}")
            continue
            
        # Parsear respuesta
        success = False
        c_code_len = 0
        asm_code_len = 0
        elf_status = "No disponible (WSL/NASM)"
        warn_count = 0
        err_msg = ""
        
        if proc.returncode != 0:
            err_msg = f"Compilador fallo con codigo de salida {proc.returncode}"
            if stderr:
                err_msg += f"\nStderr: {stderr.strip()}"
        else:
            try:
                res = json.loads(stdout)
                success = res.get("ok", False)
                warnings = res.get("warnings", [])
                errors = res.get("errors", [])
                warn_count = len(warnings)
                
                c_code = res.get("cCode", "")
                asm_code = res.get("asmCode", "")
                c_code_len = len(c_code.strip())
                asm_code_len = len(asm_code.strip())
                
                elf_path = res.get("elfPath", "")
                if elf_path:
                    elf_status = f"Listo: `{elf_path}`"
                else:
                    elf_status = "No generado / Error"
                    
                if not success:
                    err_msg = "; ".join(errors) if errors else "Error desconocido"
            except Exception as e:
                err_msg = f"Error parseando JSON de salida: {e}\nRaw stdout: {stdout[:200]}"
                
        status_mark = "✓ OK" if success else "✗ FALLO"
        c_status = f"✓ ({c_code_len} bytes)" if c_code_len > 0 else "✗ Vacio"
        asm_status = f"✓ ({asm_code_len} bytes)" if asm_code_len > 0 else "✗ Vacio"
        
        print(f"  - Estado: {status_mark}")
        print(f"  - C Generado: {c_status}")
        print(f"  - ASM Generado: {asm_status}")
        print(f"  - ELF Ensamblado: {elf_status}")
        if warn_count > 0:
            print(f"  - Advertencias: {warn_count}")
        if err_msg:
            print(f"  - Errores: {err_msg}")
        print(f"  - Tiempo: {elapsed:.1f}ms\n")
        
        report_lines.append(
            f"| {filename} | {project_name} | {status_mark} | {c_status} | {asm_status} | {elf_status} | {warn_count} |"
        )
        
        # Guardar resultados detallados
        results.append({
            "filename": filename,
            "name": project_name,
            "success": success,
            "c_code": c_code if success else "",
            "asm_code": asm_code if success else "",
            "errors": err_msg,
            "warnings": warnings if 'res' in locals() else [],
            "elf_path": elf_path if 'res' in locals() else ""
        })
        
    report_lines.append("")
    report_lines.append("## Detalles de Pruebas")
    report_lines.append("")
    
    for r in results:
        report_lines.append(f"### {r['name']} (`{r['filename']}`)")
        report_lines.append("")
        report_lines.append(f"**Estado:** {'🟢 Compilación exitosa' if r['success'] else '🔴 Fallo de compilación'}")
        if r['elf_path']:
            report_lines.append(f"**Binario ELF:** `{r['elf_path']}`")
        if r['warnings']:
            report_lines.append("**Advertencias:**")
            for w in r['warnings']:
                report_lines.append(f"- {w}")
        if r['errors']:
            report_lines.append(f"**Errores:**\n```\n{r['errors']}\n```")
            
        if r['success']:
            # C code block
            report_lines.append("")
            report_lines.append("<details>")
            report_lines.append("<summary>Ver código C Generado</summary>")
            report_lines.append("")
            report_lines.append("```c")
            report_lines.append(r['c_code'])
            report_lines.append("```")
            report_lines.append("</details>")
            
            # ASM code block
            report_lines.append("")
            report_lines.append("<details>")
            report_lines.append("<summary>Ver código Assembler NASM Generado</summary>")
            report_lines.append("")
            report_lines.append("```nasm")
            report_lines.append(r['asm_code'])
            report_lines.append("```")
            report_lines.append("</details>")
            
        report_lines.append("")
        report_lines.append("---")
        report_lines.append("")
        
    # Guardar reporte
    report_path = os.path.join(tests_dir, "test_report.md")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))
        
    print("=" * 60)
    print(f"[+] Reporte completo guardado en: {report_path}")
    print("=" * 60)

if __name__ == "__main__":
    run_all_tests()
