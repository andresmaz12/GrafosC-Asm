// ============================================
// COMPILADOR - Mermaid Code Parser
// ============================================

import { DEFAULT_SHAPE_SIZES } from '../constants'
import type { 
  FlowchartState, 
  FlowchartNode, 
  FlowchartShapeType, 
  FlowchartConnection,
  HandleSide
} from '../types'

/**
 * Analiza un codigo Mermaid (flowchart TD) y reconstruye un FlowchartState basico.
 */
export function parseMermaidToState(mermaidCode: string): FlowchartState {
  const nodes: FlowchartNode[] = []
  const connections: FlowchartConnection[] = []
  
  // Expresiones regulares para extraer informacion
  // Busca lineas como: node_123([Inicio]) o node_456[Proceso]
  const nodeRegex = /^\s*([a-zA-Z0-9_]+)\s*(\(\[|\[\[|\[\/|\{\{|\{|\[)(.+?)(\]\]|\/\]|\}\}|\]\)|\]|\})\s*$/
  
  // Busca lineas como: node_123 --> node_456 o node_123 -->|Si| node_456
  const connRegex = /^\s*([a-zA-Z0-9_]+)\s*-->\s*(?:\|([^|]+)\|\s*)?([a-zA-Z0-9_]+)\s*$/

  const lines = mermaidCode.split('\n')
  
  // Mapeo de IDs temporales de Mermaid a nuestros UUIDs generados
  const idMap = new Map<string, string>()

  const generateId = () => Math.random().toString(36).substring(2, 9)

  // Primero: Encontrar todos los nodos
  lines.forEach(line => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('%%') || trimmed.startsWith('flowchart') || trimmed.startsWith('```') || trimmed.startsWith('style')) {
      return
    }

    const nodeMatch = trimmed.match(nodeRegex)
    if (nodeMatch) {
      const mermaidId = nodeMatch[1]
      const openBracket = nodeMatch[2]
      const content = unescapeContent(nodeMatch[3])
      
      const type = getShapeTypeFromBrackets(openBracket)
      const newId = generateId()
      idMap.set(mermaidId, newId)

      nodes.push({
        id: newId,
        type,
        position: { x: 0, y: 0 }, // Se calculara despues
        size: DEFAULT_SHAPE_SIZES[type],
        content,
        connections: []
      })
      return
    }

    // Segundo: Encontrar conexiones (se pueden procesar despues si queremos)
  })

  // Segundo pase: Encontrar conexiones
  lines.forEach(line => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('%%') || trimmed.startsWith('flowchart') || trimmed.startsWith('```') || trimmed.startsWith('style')) {
      return
    }

    const connMatch = trimmed.match(connRegex)
    if (connMatch) {
      const sourceMermaidId = connMatch[1]
      const label = connMatch[2]
      const targetMermaidId = connMatch[3]

      const sourceId = idMap.get(sourceMermaidId)
      const targetId = idMap.get(targetMermaidId)

      if (sourceId && targetId) {
        // Tratar de determinar el tipo de conexion basado en el label
        let type: FlowchartConnection['type'] = 'default'
        if (label) {
          const l = label.toLowerCase()
          if (l === 'si' || l === 'yes' || l === 'true') type = 'yes'
          else if (l === 'no' || l === 'false') type = 'no'
          else type = 'default' // O case1, case2 si fuera switch
        }

        connections.push({
          id: generateId(),
          sourceId,
          targetId,
          label: label || undefined,
          type,
          sourceHandle: 's', // Por defecto sale de abajo
          targetHandle: 'n'  // Por defecto entra por arriba
        })
      }
    }
  })

  // Tercer pase: Asignar posiciones simples en un layout vertical/cascada
  // Para un layout mas avanzado se necesitaria un algoritmo complejo (ej. Dagre).
  // Aqui haremos un layout sencillo en Y, incrementando X si hay multiples hijos.
  
  layoutNodes(nodes, connections)

  return {
    nodes,
    connections,
    selectedNodeId: null,
    zoom: 1,
    pan: { x: 0, y: 0 }
  }
}

function getShapeTypeFromBrackets(bracket: string): FlowchartShapeType {
  switch (bracket) {
    case '([': return 'start-end'
    case '[': return 'process'
    case '{': return 'decision'
    case '[/': return 'input-output'
    case '[[': return 'subprocess'
    case '{{': return 'return'
    default: return 'process'
  }
}

function unescapeContent(content: string): string {
  return content
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<br>/g, '\n')
}

// Un layout basico en arbol
function layoutNodes(nodes: FlowchartNode[], connections: FlowchartConnection[]) {
  const levels = new Map<string, number>()
  
  // Encontrar nodos raiz (sin conexiones entrantes)
  const incomingCount = new Map<string, number>()
  nodes.forEach(n => incomingCount.set(n.id, 0))
  connections.forEach(c => {
    incomingCount.set(c.targetId, (incomingCount.get(c.targetId) || 0) + 1)
  })

  const roots = nodes.filter(n => incomingCount.get(n.id) === 0)
  
  // Si no hay raices (ciclo), tomar el primer start-end o cualquier nodo
  if (roots.length === 0 && nodes.length > 0) {
    const start = nodes.find(n => n.type === 'start-end') || nodes[0]
    roots.push(start)
  }

  // BFS para asignar niveles
  const queue: { id: string, level: number }[] = roots.map(r => ({ id: r.id, level: 0 }))
  const visited = new Set<string>()

  while (queue.length > 0) {
    const { id, level } = queue.shift()!
    if (visited.has(id)) continue
    
    visited.add(id)
    levels.set(id, Math.max(level, levels.get(id) || 0))

    const children = connections.filter(c => c.sourceId === id).map(c => c.targetId)
    children.forEach(childId => {
      if (!visited.has(childId)) {
        queue.push({ id: childId, level: level + 1 })
      }
    })
  }

  // Agrupar nodos por nivel
  const nodesByLevel = new Map<number, FlowchartNode[]>()
  nodes.forEach(n => {
    // Si un nodo no fue visitado (desconectado), ponerlo en nivel 0
    const level = levels.get(n.id) ?? 0
    if (!nodesByLevel.has(level)) nodesByLevel.set(level, [])
    nodesByLevel.get(level)!.push(n)
  })

  // Asignar posiciones X, Y
  const startY = 50
  const startX = 400
  const gapY = 120
  const gapX = 200

  nodesByLevel.forEach((levelNodes, level) => {
    const totalWidth = (levelNodes.length - 1) * gapX
    let currentX = startX - totalWidth / 2

    levelNodes.forEach(node => {
      node.position = {
        x: currentX,
        y: startY + level * gapY
      }
      currentX += gapX
    })
  })
}
