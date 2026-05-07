// ============================================
// COMPILADOR - Connection geometry utilities
// ============================================
// Helpers para posicionar handles N/S/E/W en los nodos y dibujar
// caminos ortogonales SVG entre dos puntos.

import type { FlowchartNode, HandleSide, FlowchartConnection } from './types'

export interface Point {
  x: number
  y: number
}

/**
 * Devuelve la posicion (en coordenadas del canvas) del handle indicado
 * para un nodo dado.
 */
export function getHandlePosition(node: FlowchartNode, side: HandleSide): Point {
  const { position, size } = node
  const cx = position.x + size.width / 2
  const cy = position.y + size.height / 2
  switch (side) {
    case 'n': return { x: cx, y: position.y }
    case 's': return { x: cx, y: position.y + size.height }
    case 'e': return { x: position.x + size.width, y: cy }
    case 'w': return { x: position.x, y: cy }
  }
}

/**
 * Determina cual de los 4 lados del nodo esta mas cerca de un punto.
 * Util como fallback para el extremo destino de una conexion sin
 * targetHandle definido.
 */
export function nearestHandle(node: FlowchartNode, point: Point): HandleSide {
  const sides: HandleSide[] = ['n', 's', 'e', 'w']
  let best: HandleSide = 'n'
  let bestDist = Infinity
  for (const side of sides) {
    const p = getHandlePosition(node, side)
    const d = (p.x - point.x) ** 2 + (p.y - point.y) ** 2
    if (d < bestDist) {
      bestDist = d
      best = side
    }
  }
  return best
}

/**
 * Vector de salida segun el lado.
 */
function sideVector(side: HandleSide): Point {
  switch (side) {
    case 'n': return { x: 0, y: -1 }
    case 's': return { x: 0, y: 1 }
    case 'e': return { x: 1, y: 0 }
    case 'w': return { x: -1, y: 0 }
  }
}

/**
 * Construye un path SVG ortogonal con bend en el medio entre source y target.
 * Aplica un pequeno offset inicial en la direccion del handle para que la
 * flecha salga "limpia" del nodo.
 */
export function buildOrthogonalPath(
  source: Point,
  sourceSide: HandleSide,
  target: Point,
  targetSide: HandleSide,
): string {
  const offset = 24
  const sv = sideVector(sourceSide)
  const tv = sideVector(targetSide)
  const sOff = { x: source.x + sv.x * offset, y: source.y + sv.y * offset }
  const tOff = { x: target.x + tv.x * offset, y: target.y + tv.y * offset }

  const sourceHorizontal = sourceSide === 'e' || sourceSide === 'w'
  const midX = (sOff.x + tOff.x) / 2
  const midY = (sOff.y + tOff.y) / 2

  let mid1: Point
  let mid2: Point
  if (sourceHorizontal) {
    mid1 = { x: midX, y: sOff.y }
    mid2 = { x: midX, y: tOff.y }
  } else {
    mid1 = { x: sOff.x, y: midY }
    mid2 = { x: tOff.x, y: midY }
  }

  return [
    `M ${source.x} ${source.y}`,
    `L ${sOff.x} ${sOff.y}`,
    `L ${mid1.x} ${mid1.y}`,
    `L ${mid2.x} ${mid2.y}`,
    `L ${tOff.x} ${tOff.y}`,
    `L ${target.x} ${target.y}`,
  ].join(' ')
}

/**
 * Construye un path para la linea provisional (drag) hacia un punto libre.
 */
export function buildProvisionalPath(
  source: Point,
  sourceSide: HandleSide,
  target: Point,
): string {
  const offset = 24
  const sv = sideVector(sourceSide)
  const sOff = { x: source.x + sv.x * offset, y: source.y + sv.y * offset }
  return `M ${source.x} ${source.y} L ${sOff.x} ${sOff.y} L ${target.x} ${target.y}`
}

/**
 * Color CSS asociado a cada tipo de rama.
 */
export function branchColor(type: FlowchartConnection['type']): string {
  switch (type) {
    case 'yes':   return 'var(--success)'
    case 'no':    return 'var(--destructive)'
    case 'case1':
    case 'case2':
    case 'case3': return 'var(--warning)'
    default:      return 'var(--muted-foreground)'
  }
}

/**
 * Etiqueta corta legible para mostrar sobre la flecha.
 */
export function branchLabelDefault(type: FlowchartConnection['type']): string {
  switch (type) {
    case 'yes':   return 'Si'
    case 'no':    return 'No'
    case 'case1': return 'Caso 1'
    case 'case2': return 'Caso 2'
    case 'case3': return 'Caso 3'
    default:      return ''
  }
}

/**
 * Devuelve las ramas (`type`) que un nodo origen ya ocupa, para filtrar
 * el dialogo de seleccion al crear nuevas conexiones desde un decision.
 */
export function usedBranches(
  connections: FlowchartConnection[],
  sourceId: string,
): Set<FlowchartConnection['type']> {
  const used = new Set<FlowchartConnection['type']>()
  for (const c of connections) {
    if (c.sourceId === sourceId) used.add(c.type)
  }
  return used
}
