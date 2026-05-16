// ============================================
// COMPILADOR - Mermaid Code Generator
// ============================================

import type { FlowchartState, FlowchartNode, MermaidValidationResult } from '../types'

/**
 * Genera codigo Mermaid a partir del estado del diagrama
 */
export function generateMermaidCode(state: FlowchartState): string {
  const { nodes, connections } = state
  
  if (nodes.length === 0) {
    return '```mermaid\nflowchart TD\n    A[Diagrama vacio]\n```'
  }

  let mermaid = '```mermaid\nflowchart TD\n'
  
  // Generar definiciones de nodos
  nodes.forEach(node => {
    const nodeId = `node_${node.id}`
    const content = escapeContent(node.content)
    
    switch (node.type) {
      case 'start-end':
        mermaid += `    ${nodeId}([${content}])\n`
        break
      case 'process':
        mermaid += `    ${nodeId}[${content}]\n`
        break
      case 'decision':
        mermaid += `    ${nodeId}{${content}}\n`
        break
      case 'input-output':
        mermaid += `    ${nodeId}[/${content}/]\n`
        break
      case 'subprocess':
        mermaid += `    ${nodeId}[[${content}]]\n`
        break
      case 'return':
        mermaid += `    ${nodeId}{{${content}}}\n`
        break
      default:
        mermaid += `    ${nodeId}[${content}]\n`
    }
  })

  mermaid += '\n'

  // Generar conexiones
  connections.forEach(conn => {
    const sourceId = `node_${conn.sourceId}`
    const targetId = `node_${conn.targetId}`
    
    if (conn.label) {
      mermaid += `    ${sourceId} -->|${conn.label}| ${targetId}\n`
    } else {
      mermaid += `    ${sourceId} --> ${targetId}\n`
    }
  })

  // Agregar estilos
  mermaid += '\n    %% Estilos\n'
  nodes.forEach(node => {
    const nodeId = `node_${node.id}`
    const style = getNodeStyle(node.type)
    mermaid += `    style ${nodeId} ${style}\n`
  })

  mermaid += '```'
  
  return mermaid
}

/**
 * Escapa caracteres especiales para Mermaid
 */
function escapeContent(content: string): string {
  return content
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
}

/**
 * Obtiene el estilo CSS para un tipo de nodo
 */
function getNodeStyle(type: string): string {
  const styles: Record<string, string> = {
    'start-end': 'fill:#22c55e,stroke:#16a34a,color:#fff',
    'process': 'fill:#0ea5e9,stroke:#0284c7,color:#fff',
    'decision': 'fill:#f59e0b,stroke:#d97706,color:#fff',
    'input-output': 'fill:#8b5cf6,stroke:#7c3aed,color:#fff',
    'subprocess': 'fill:#ec4899,stroke:#db2777,color:#fff',
    'return': 'fill:#14b8a6,stroke:#0d9488,color:#fff',
  }
  return styles[type] || 'fill:#94a3b8,stroke:#64748b,color:#fff'
}

/**
 * Valida la sintaxis del diagrama Mermaid.
 * Reglas:
 * - Debe existir al menos un nodo de inicio (start-end con isStart=true).
 * - Cada inicio debe tener una salida alcanzable: o un nodo `return`, o un
 *   `start-end` con isStart=false. (El backend Python acepta ambos.)
 * - Las decisiones deben tener al menos una conexion de salida.
 * - Figuras fuera del flujo se reportan como warning, no error.
 */
export function validateMermaidDiagram(state: FlowchartState): MermaidValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const { nodes, connections } = state

  const isStartNode = (n: typeof nodes[number]) =>
    n.type === 'start-end' &&
    (
      (n.data && 'isStart' in n.data && n.data.isStart) ||
      (!n.data && (
        n.content.toLowerCase().includes('inicio') ||
        n.content.toLowerCase().includes('main') ||
        n.content.toLowerCase().includes('start')
      ))
    )

  const isEndStartEnd = (n: typeof nodes[number]) =>
    n.type === 'start-end' &&
    (
      (n.data && 'isStart' in n.data && !n.data.isStart) ||
      (!n.data && (
        n.content.toLowerCase().includes('fin') ||
        n.content.toLowerCase().includes('end')
      ))
    )

  const startNodes = nodes.filter(isStartNode)

  if (startNodes.length === 0) {
    errors.push('El diagrama debe tener al menos un nodo de inicio')
  }

  // Para cada inicio, verificar que haya una salida alcanzable: return o end.
  startNodes.forEach((start) => {
    const reachable = new Set<string>()
    traverseFromNode(start.id, connections, reachable)
    const hasExit = nodes.some((n) =>
      reachable.has(n.id) && (n.type === 'return' || isEndStartEnd(n)),
    )
    if (!hasExit) {
      const fname = (start.data && 'functionName' in start.data && start.data.functionName) || start.content
      errors.push(
        `La funcion "${fname}" no tiene salida alcanzable. Conecta un nodo "return" o un "fin".`,
      )
    }
  })

  // Nodos desconectados respecto a cualquier inicio
  const reachableNodes = new Set<string>()
  startNodes.forEach((startNode) => traverseFromNode(startNode.id, connections, reachableNodes))
  const disconnectedNodes = nodes.filter(
    (n) => !reachableNodes.has(n.id) && !startNodes.includes(n),
  )
  if (disconnectedNodes.length > 0) {
    warnings.push(`${disconnectedNodes.length} figura(s) no conectada(s) al flujo principal`)
  }

  // Decisiones sin salidas
  const decisionNodes = nodes.filter((n) => n.type === 'decision')
  decisionNodes.forEach((node) => {
    const outgoingConnections = connections.filter((c) => c.sourceId === node.id)
    if (outgoingConnections.length === 0) {
      errors.push(`El condicional "${node.content}" no tiene conexiones de salida`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Recorre el grafo desde un nodo y marca los alcanzables
 */
function traverseFromNode(
  nodeId: string, 
  connections: FlowchartState['connections'], 
  visited: Set<string>
): void {
  if (visited.has(nodeId)) return
  visited.add(nodeId)

  const outgoing = connections.filter(c => c.sourceId === nodeId)
  outgoing.forEach(conn => {
    traverseFromNode(conn.targetId, connections, visited)
  })
}

/**
 * Obtiene solo los nodos validos dentro de la estructura inicio-fin
 */
export function getValidNodes(state: FlowchartState): FlowchartNode[] {
  const { nodes, connections } = state
  const validNodeIds = new Set<string>()

  // Encontrar nodos de inicio
  const startNodes = nodes.filter(n => 
    n.type === 'start-end' && 
    (n.content.toLowerCase().includes('inicio') || 
     n.content.toLowerCase().includes('main') ||
     n.content.toLowerCase().includes('start') ||
     (n.data && 'isStart' in n.data && n.data.isStart))
  )

  // Recorrer desde cada inicio
  startNodes.forEach(startNode => {
    traverseFromNode(startNode.id, connections, validNodeIds)
  })

  return nodes.filter(n => validNodeIds.has(n.id))
}
