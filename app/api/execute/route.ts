// ============================================
// COMPILADOR - API Route: POST /api/execute
// ============================================
// Ejecuta un binario ELF Linux dentro de WSL2 y devuelve su stdout/stderr.
// El ELF debe haber sido generado previamente por /api/compile.

import { NextResponse } from 'next/server'
import { spawn } from 'node:child_process'
import path from 'node:path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TIMEOUT_MS = 20_000  // Incluye tiempo de arranque de WSL + ejecución del programa
const PYTHON_CANDIDATES =
  process.platform === 'win32'
    ? ['python', 'py', 'python3']
    : ['python3', 'python']

interface ExecuteRequest {
  elfPath: string   // Ruta relativa desde la raíz del proyecto, ej: "outputs/GrafosC-Asm/bin/proyecto"
  stdin?: string    // Input opcional para el programa
}

interface ExecuteResponse {
  ok: boolean
  exitCode: number
  stdout: string
  stderr: string
  elapsed_ms: number
  errors: string[]
}

function runPython(payload: string): Promise<{ stdout: string; stderr: string; code: number }> {
  const cwd = process.cwd()
  const script = path.join(cwd, 'backend', 'pipeline', 'run_elf.py')

  return new Promise((resolve, reject) => {
    let lastError: Error | null = null

    const tryNext = (idx: number) => {
      if (idx >= PYTHON_CANDIDATES.length) {
        reject(lastError ?? new Error('No se encontró intérprete Python'))
        return
      }

      const exe = PYTHON_CANDIDATES[idx]
      const proc = spawn(exe, ['-u', script], {
        cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
      })

      let stdout = ''
      let stderr = ''
      let settled = false

      const timer = setTimeout(() => {
        if (settled) return
        settled = true
        try { proc.kill('SIGKILL') } catch {}
        reject(new Error(`Timeout (${TIMEOUT_MS}ms) ejecutando el programa`))
      }, TIMEOUT_MS)

      proc.on('error', (err) => {
        clearTimeout(timer)
        if (settled) return
        lastError = err
        tryNext(idx + 1)
      })

      proc.stdout.on('data', (chunk) => { stdout += chunk.toString('utf8') })
      proc.stderr.on('data', (chunk) => { stderr += chunk.toString('utf8') })

      proc.on('close', (code) => {
        clearTimeout(timer)
        if (settled) return
        settled = true
        resolve({ stdout, stderr, code: code ?? -1 })
      })

      try {
        proc.stdin.write(payload)
        proc.stdin.end()
      } catch (err) {
        clearTimeout(timer)
        if (settled) return
        settled = true
        reject(err as Error)
      }
    }

    tryNext(0)
  })
}

export async function POST(request: Request): Promise<NextResponse<ExecuteResponse>> {
  let body: ExecuteRequest
  try {
    body = await request.json() as ExecuteRequest
  } catch {
    return NextResponse.json(
      { ok: false, exitCode: -1, stdout: '', stderr: '', elapsed_ms: 0,
        errors: ['Body inválido: JSON malformado'] },
      { status: 400 },
    )
  }

  if (!body?.elfPath) {
    return NextResponse.json(
      { ok: false, exitCode: -1, stdout: '', stderr: '', elapsed_ms: 0,
        errors: ['Falta el campo elfPath'] },
      { status: 400 },
    )
  }

  // Construir ruta absoluta a partir de la relativa recibida
  const cwd = process.cwd()
  const elfAbsPath = path.resolve(cwd, body.elfPath)

  // Seguridad: el archivo debe estar dentro del directorio del proyecto
  if (!elfAbsPath.startsWith(cwd)) {
    return NextResponse.json(
      { ok: false, exitCode: -1, stdout: '', stderr: '', elapsed_ms: 0,
        errors: ['Ruta de ELF no permitida'] },
      { status: 403 },
    )
  }

  const payload = JSON.stringify({
    elfPath: elfAbsPath,
    stdin: body.stdin ?? '',
  })

  try {
    const { stdout: rawStdout, stderr: rawStderr } = await runPython(payload)

    if (!rawStdout.trim()) {
      return NextResponse.json(
        { ok: false, exitCode: -1, stdout: '', stderr: rawStderr,
          elapsed_ms: 0, errors: ['El runner devolvió salida vacía'] },
        { status: 500 },
      )
    }

    const parsed = JSON.parse(rawStdout) as ExecuteResponse
    return NextResponse.json(parsed, { status: parsed.ok ? 200 : 200 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json(
      { ok: false, exitCode: -1, stdout: '', stderr: '', elapsed_ms: 0,
        errors: [`Error al ejecutar el programa: ${msg}`] },
      { status: 500 },
    )
  }
}
