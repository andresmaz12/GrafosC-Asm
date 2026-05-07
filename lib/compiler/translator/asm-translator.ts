// ============================================
// COMPILADOR - Assembly Translator (DEPRECATED stub)
// ============================================
// La compilacion real ocurre en el backend Python (pipeline/compile.py).
// Este modulo es un stub que conserva la firma para imports historicos.

import type { FlowchartState, CompilerConfig } from '../types'

const NOTICE = `; La compilacion a Assembler ahora se realiza en el backend Python.
; Importa { compileFlowchart } from '@/lib/compiler' y haz POST a /api/compile.
`

/**
 * @deprecated Use `compileFlowchart` (lib/compiler/api-client) en su lugar.
 */
export function translateToAssembly(
  _flowchart: FlowchartState,
  _config?: CompilerConfig,
): string {
  return NOTICE
}

/**
 * @deprecated
 */
export function generateAsmInstruction(_operation: string, _operands: string[]): string {
  return ''
}

/**
 * @deprecated
 */
export function mapTypeToRegister(cType: string): string {
  const typeMap: Record<string, string> = {
    int: 'eax',
    char: 'al',
    float: 'xmm0',
    double: 'xmm0',
  }
  return typeMap[cType] || 'eax'
}
