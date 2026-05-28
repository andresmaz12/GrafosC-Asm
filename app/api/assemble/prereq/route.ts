// ============================================
// COMPILADOR - API Route: GET /api/assemble/prereq
// ============================================
// Verifica si WSL2, NASM y ld están disponibles en el sistema
// invocando backend/pipeline/prereq_checker.py

import { NextResponse } from 'next/server'
import { spawn } from 'node:child_process'
import path from 'node:path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TIMEOUT_MS = 20_000
const PYTHON_CANDIDATES =
  process.platform === 'win32'
    ? ['python', 'py', 'python3']
    : ['python3', 'python']

interface PrereqResponse {
  wsl: boolean
  nasm: boolean
  ld: boolean
  wsl_distro: string
  nasm_ver: string
  ld_ver: string
  install_hint: string
}

function runPythonScript(script: string): Promise<{ stdout: string; stderr: string; code: number }> {
  const cwd = process.cwd()

  return new Promise((resolve, reject) => {
    let lastError: Error | null = null

    const tryNext = (idx: number) => {
      if (idx >= PYTHON_CANDIDATES.length) {
        reject(lastError ?? new Error('No se encontró un intérprete Python en el PATH'))
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
        reject(new Error(`Timeout (${TIMEOUT_MS}ms) verificando prerequisitos`))
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

      // Cerrar stdin inmediatamente (el script no necesita input)
      proc.stdin.end()
    }

    tryNext(0)
  })
}

export async function GET(): Promise<NextResponse> {
  const cwd = process.cwd()
  const script = path.join(cwd, 'backend', 'pipeline', 'prereq_checker.py')

  try {
    const { stdout, stderr } = await runPythonScript(script)

    if (!stdout.trim()) {
      return NextResponse.json(
        {
          wsl: false, nasm: false, ld: false,
          wsl_distro: '', nasm_ver: '', ld_ver: '',
          install_hint: `Error verificando prerequisitos: ${stderr || 'Sin output'}`,
        } satisfies PrereqResponse,
        { status: 200 },
      )
    }

    const parsed = JSON.parse(stdout) as PrereqResponse
    return NextResponse.json(parsed, { status: 200 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json(
      {
        wsl: false, nasm: false, ld: false,
        wsl_distro: '', nasm_ver: '', ld_ver: '',
        install_hint: `No se pudo ejecutar el verificador: ${msg}`,
      } satisfies PrereqResponse,
      { status: 200 }, // siempre 200 — el frontend interpreta los bools
    )
  }
}
