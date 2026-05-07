// ============================================
// COMPILADOR - API Route: /api/compile
// ============================================
// Recibe un FlowchartState desde la UI y lo compila ejecutando
// pipeline/compile.py en un proceso Python local.

import { NextResponse } from 'next/server'
import { spawn } from 'node:child_process'
import path from 'node:path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PYTHON_TIMEOUT_MS = 15_000
const PYTHON_CANDIDATES = process.platform === 'win32'
  ? ['python', 'py', 'python3']
  : ['python3', 'python']

interface CompileRequest {
  projectName?: string
  flowchartState?: unknown
  mermaidCode?: string
}

interface CompileResponse {
  ok: boolean
  cCode?: string
  asmCode?: string
  mermaidCode?: string
  errors?: string[]
  warnings?: string[]
  files?: Record<string, string>
}

function runPython(payload: string): Promise<{ stdout: string; stderr: string; code: number }> {
  const cwd = process.cwd()
  const script = path.join(cwd, 'pipeline', 'compile.py')

  return new Promise((resolve, reject) => {
    let lastError: Error | null = null
    const tryNext = (idx: number) => {
      if (idx >= PYTHON_CANDIDATES.length) {
        reject(lastError ?? new Error('No se encontro un interprete Python en el PATH'))
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
        reject(new Error(`Timeout (${PYTHON_TIMEOUT_MS}ms) ejecutando ${exe}`))
      }, PYTHON_TIMEOUT_MS)

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

export async function POST(request: Request): Promise<NextResponse<CompileResponse>> {
  let body: CompileRequest
  try {
    body = await request.json() as CompileRequest
  } catch {
    return NextResponse.json(
      { ok: false, errors: ['Body invalido: JSON malformado'] },
      { status: 400 },
    )
  }

  if (!body || typeof body !== 'object' || !body.flowchartState) {
    return NextResponse.json(
      { ok: false, errors: ['Falta el campo flowchartState'] },
      { status: 400 },
    )
  }

  const payload = JSON.stringify({
    projectName: body.projectName ?? 'proyecto',
    flowchartState: body.flowchartState,
    mermaidCode: body.mermaidCode ?? '',
  })

  try {
    const { stdout, stderr, code } = await runPython(payload)

    if (!stdout.trim()) {
      return NextResponse.json(
        {
          ok: false,
          errors: [
            `Python devolvio salida vacia (exit ${code})`,
            stderr.trim() || 'Sin stderr',
          ],
        },
        { status: 500 },
      )
    }

    let parsed: CompileResponse
    try {
      parsed = JSON.parse(stdout) as CompileResponse
    } catch {
      return NextResponse.json(
        {
          ok: false,
          errors: ['Respuesta de Python no es JSON valido', stdout.slice(0, 500)],
        },
        { status: 500 },
      )
    }

    if (stderr.trim()) {
      parsed.warnings = [...(parsed.warnings ?? []), `[python stderr] ${stderr.trim()}`]
    }

    return NextResponse.json(parsed, { status: parsed.ok ? 200 : 422 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json(
      {
        ok: false,
        errors: [
          `No se pudo ejecutar Python: ${msg}`,
          'Verifica que python (o py / python3) este disponible en el PATH.',
        ],
      },
      { status: 500 },
    )
  }
}
