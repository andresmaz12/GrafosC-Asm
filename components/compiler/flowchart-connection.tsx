'use client'

// ============================================
// COMPILADOR - Flowchart Connection (SVG)
// ============================================
// Renderiza una conexion entre dos nodos como un path SVG ortogonal con
// flecha al final. Es seleccionable haciendo clic en una hit area amplia.

import {
  buildOrthogonalPath,
  getHandlePosition,
  nearestHandle,
  branchColor,
  branchLabelDefault,
} from '@/lib/compiler/connection-utils'
import type { FlowchartConnection, FlowchartNode } from '@/lib/compiler/types'

interface FlowchartConnectionProps {
  connection: FlowchartConnection
  source: FlowchartNode
  target: FlowchartNode
  isSelected: boolean
  onSelect: (id: string) => void
}

export function FlowchartConnectionView({
  connection,
  source,
  target,
  isSelected,
  onSelect,
}: FlowchartConnectionProps) {
  const sourceSide = connection.sourceHandle ?? 's'
  const sourcePoint = getHandlePosition(source, sourceSide)

  const targetSide =
    connection.targetHandle ?? nearestHandle(target, sourcePoint)
  const targetPoint = getHandlePosition(target, targetSide)

  const path = buildOrthogonalPath(sourcePoint, sourceSide, targetPoint, targetSide)
  const color = branchColor(connection.type)
  const markerId = `arrow-${connection.id}`
  const labelText = connection.label ?? branchLabelDefault(connection.type)

  const labelPoint = {
    x: (sourcePoint.x + targetPoint.x) / 2,
    y: (sourcePoint.y + targetPoint.y) / 2,
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(connection.id)
  }

  return (
    <g>
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 Z" fill={color} />
        </marker>
      </defs>

      <path
        d={path}
        stroke="transparent"
        strokeWidth={14}
        fill="none"
        style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
        onClick={handleClick}
      />

      <path
        d={path}
        stroke={color}
        strokeWidth={isSelected ? 2.5 : 1.75}
        fill="none"
        markerEnd={`url(#${markerId})`}
        style={{ pointerEvents: 'none' }}
        opacity={isSelected ? 1 : 0.85}
      />

      {labelText && (
        <g style={{ pointerEvents: 'none' }}>
          <rect
            x={labelPoint.x - labelText.length * 4 - 4}
            y={labelPoint.y - 9}
            width={labelText.length * 8 + 8}
            height={18}
            rx={4}
            fill="var(--panel)"
            stroke={color}
            strokeWidth={1}
            opacity={0.95}
          />
          <text
            x={labelPoint.x}
            y={labelPoint.y + 4}
            textAnchor="middle"
            fontSize={11}
            fontFamily="var(--font-mono, monospace)"
            fill={color}
          >
            {labelText}
          </text>
        </g>
      )}

      {isSelected && (
        <circle
          cx={labelPoint.x}
          cy={labelPoint.y}
          r={3}
          fill={color}
          style={{ pointerEvents: 'none' }}
        />
      )}
    </g>
  )
}
