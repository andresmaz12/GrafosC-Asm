// ============================================
// COMPILADOR - C Translator (DEPRECATED stub)
// ============================================
// La compilacion real ocurre en el backend Python (pipeline/compile.py)
// expuesto via /api/compile. Este modulo se conserva como stub para no
// romper imports historicos. Use `compileFlowchart` de `@/lib/compiler`.

import type { FlowchartState } from '../types'

const NOTICE = `// La compilacion a C ahora se realiza en el backend Python.
// Importa { compileFlowchart } from '@/lib/compiler' y haz POST a /api/compile.
`

/**
 * @deprecated Use `compileFlowchart` (lib/compiler/api-client) en su lugar.
 */
export function translateToC(_flowchart: FlowchartState): string {
  return NOTICE
}

/**
 * @deprecated La validacion sintactica completa la realiza el backend Python.
 */
export function validateCContent(_content: string): { valid: boolean; errors: string[] } {
  return { valid: true, errors: [] }
}

/**
 * @deprecated
 */
export function generateVariableDeclarations(_flowchart: FlowchartState): string {
  return ''
}
