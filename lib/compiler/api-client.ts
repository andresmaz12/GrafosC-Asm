// ============================================
// COMPILADOR - API Client
// ============================================
// Cliente tipado para invocar /api/compile desde la UI.

import type { FlowchartState } from './types'

export interface CompileResponse {
  ok: boolean
  cCode: string
  asmCode: string
  mermaidCode: string
  errors: string[]
  warnings: string[]
  files: Record<string, string>
}

export interface CompileRequest {
  projectName: string
  flowchartState: FlowchartState
  mermaidCode?: string
}

const EMPTY: CompileResponse = {
  ok: false,
  cCode: '',
  asmCode: '',
  mermaidCode: '',
  errors: [],
  warnings: [],
  files: {},
}

/**
 * Envia el FlowchartState al endpoint /api/compile y normaliza la respuesta.
 * Nunca lanza: cualquier error de red se reporta dentro de `errors`.
 */
export async function compileFlowchart(req: CompileRequest): Promise<CompileResponse> {
  try {
    const res = await fetch('/api/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    })

    let data: Partial<CompileResponse> = {}
    try {
      data = (await res.json()) as Partial<CompileResponse>
    } catch {
      return {
        ...EMPTY,
        errors: [`Respuesta no JSON (status ${res.status})`],
      }
    }

    return {
      ...EMPTY,
      ...data,
      ok: Boolean(data.ok && res.ok),
      errors: data.errors ?? (res.ok ? [] : [`HTTP ${res.status}`]),
      warnings: data.warnings ?? [],
      cCode: data.cCode ?? '',
      asmCode: data.asmCode ?? '',
      mermaidCode: data.mermaidCode ?? '',
      files: data.files ?? {},
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error de red desconocido'
    return { ...EMPTY, errors: [`No se pudo contactar /api/compile: ${msg}`] }
  }
}
