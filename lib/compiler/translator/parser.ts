// ============================================
// COMPILADOR - Flowchart Parser
// ============================================
// Analiza y parsea el diagrama de flujo para traduccion

import type { FlowchartState, FlowchartNode, FlowchartConnection, CompilationError } from '../types'

/**
 * Resultado del parsing del diagrama
 */
export interface ParseResult {
  success: boolean
  ast: ASTNode | null
  errors: CompilationError[]
}

/**
 * Nodo del AST (Abstract Syntax Tree)
 */
export interface ASTNode {
  type: 'program' | 'statement' | 'expression' | 'block' | 'conditional' | 'loop'
  nodeRef: string  // ID del nodo del diagrama
  children: ASTNode[]
  value?: string
}

/**
 * Parsea el diagrama de flujo y genera un AST
 * @param flowchart - Estado del diagrama de flujo
 * @returns Resultado del parsing
 */
export function parseFlowchart(flowchart: FlowchartState): ParseResult {
  const errors: CompilationError[] = []
  
  // Encontrar el nodo de inicio
  const startNode = flowchart.nodes.find(n => 
    n.type === 'start-end' && n.content.toLowerCase().includes('main')
  )
  
  if (!startNode) {
    errors.push({
      nodeId: '',
      message: 'No se encontro un nodo de inicio (main)',
    })
    return { success: false, ast: null, errors }
  }
  
  // TODO: Implementar el parsing completo del diagrama
  const ast: ASTNode = {
    type: 'program',
    nodeRef: startNode.id,
    children: [],
    value: 'main'
  }
  
  return {
    success: errors.length === 0,
    ast,
    errors
  }
}

/**
 * Valida la estructura del diagrama
 */
export function validateFlowchartStructure(flowchart: FlowchartState): CompilationError[] {
  const errors: CompilationError[] = []
  
  // Verificar que hay al menos un nodo de inicio
  const startNodes = flowchart.nodes.filter(n => 
    n.type === 'start-end' && n.content.toLowerCase().includes('main')
  )
  
  if (startNodes.length === 0) {
    errors.push({
      nodeId: '',
      message: 'El diagrama debe tener un nodo de inicio (main)'
    })
  }
  
  if (startNodes.length > 1) {
    errors.push({
      nodeId: startNodes[1].id,
      message: 'Solo puede haber un nodo de inicio (main)'
    })
  }
  
  // Verificar que hay al menos un nodo de fin
  const endNodes = flowchart.nodes.filter(n => 
    n.type === 'start-end' && !n.content.toLowerCase().includes('main')
  )
  
  if (endNodes.length === 0) {
    errors.push({
      nodeId: '',
      message: 'El diagrama debe tener al menos un nodo de fin'
    })
  }
  
  // TODO: Agregar mas validaciones de estructura
  
  return errors
}

/**
 * Obtiene el orden de ejecucion de los nodos
 */
export function getExecutionOrder(flowchart: FlowchartState): string[] {
  // TODO: Implementar algoritmo de recorrido del grafo
  return flowchart.nodes.map(n => n.id)
}
