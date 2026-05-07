'use client'

// ============================================
// COMPILADOR - Flowchart Node Component
// ============================================
// Componente individual de nodo en el diagrama. Cuando esta seleccionado
// muestra cuatro handles N/S/E/W para iniciar conexiones por drag.

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SHAPE_COLORS, SHAPE_NAMES } from '@/lib/compiler/constants'
import type { FlowchartNode, HandleSide } from '@/lib/compiler/types'

interface FlowchartNodeComponentProps {
  node: FlowchartNode
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<FlowchartNode>) => void
  onDelete: () => void
  onConnectionStart?: (nodeId: string, side: HandleSide, e: React.MouseEvent) => void
}

const HANDLE_SIDES: HandleSide[] = ['n', 's', 'e', 'w']

const HANDLE_POSITION_CLASSES: Record<HandleSide, string> = {
  n: 'left-1/2 -translate-x-1/2 -top-2',
  s: 'left-1/2 -translate-x-1/2 -bottom-2',
  e: '-right-2 top-1/2 -translate-y-1/2',
  w: '-left-2 top-1/2 -translate-y-1/2',
}

export function FlowchartNodeComponent({
  node,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onConnectionStart,
}: FlowchartNodeComponentProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const nodeRef = useRef<HTMLDivElement>(null)

  const colors = SHAPE_COLORS[node.type]

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('[data-handle="true"]')) {
      return
    }
    if (target.closest('[data-control="true"]')) {
      return
    }

    e.stopPropagation()
    onSelect()

    const rect = nodeRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
      setIsDragging(true)
    }
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const parent = nodeRef.current?.parentElement
      if (!parent) return

      const parentRect = parent.getBoundingClientRect()
      const x = e.clientX - parentRect.left - dragOffset.x
      const y = e.clientY - parentRect.top - dragOffset.y

      onUpdate({
        position: { x: Math.max(0, x), y: Math.max(0, y) },
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset, onUpdate])

  const renderShape = () => {
    const baseClasses = cn(
      'absolute inset-0 transition-all duration-200',
      colors.bg,
      'border-2',
      colors.border,
      isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-canvas',
    )

    switch (node.type) {
      case 'start-end':
        return <div className={cn(baseClasses, 'rounded-full')} />
      case 'process':
        return <div className={cn(baseClasses, 'rounded-lg')} />
      case 'decision':
        return (
          <div
            className={cn(baseClasses, 'rounded-sm')}
            style={{ transform: 'rotate(45deg)', margin: '15%' }}
          />
        )
      case 'input-output':
        return (
          <div
            className={cn(baseClasses, 'rounded-sm')}
            style={{ transform: 'skewX(-15deg)' }}
          />
        )
      case 'subprocess':
        return (
          <div className={cn(baseClasses, 'rounded-lg')}>
            <div className="absolute inset-2 border-2 border-current rounded opacity-50" />
          </div>
        )
      case 'return':
        return (
          <div
            className={cn(baseClasses, 'rounded-none')}
            style={{
              clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)',
            }}
          />
        )
      default:
        return <div className={cn(baseClasses, 'rounded-lg')} />
    }
  }

  return (
    <div
      ref={nodeRef}
      data-node-id={node.id}
      className={cn(
        'absolute group',
        'transition-shadow duration-200',
        isDragging && 'cursor-grabbing opacity-80',
        !isDragging && 'cursor-grab',
        isSelected && 'z-10',
      )}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: node.size.width,
        height: node.size.height,
      }}
      onMouseDown={handleMouseDown}
    >
      {renderShape()}

      <div className="absolute inset-0 flex items-center justify-center p-2 z-10 pointer-events-none">
        <span
          className={cn(
            'font-mono text-xs text-center truncate px-1',
            colors.text,
            node.type === 'decision' && 'text-[10px]',
          )}
          style={{
            transform: node.type === 'decision' ? 'rotate(0deg)' : undefined,
            maxWidth: node.type === 'decision' ? '70%' : '90%',
          }}
        >
          {node.content || SHAPE_NAMES[node.type]}
        </span>
      </div>

      {isSelected && (
        <div
          data-control="true"
          className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 animate-fade-in-up"
        >
          <Button
            variant="secondary"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}

      {isSelected && onConnectionStart && (
        <>
          {HANDLE_SIDES.map((side) => (
            <button
              key={side}
              type="button"
              data-handle="true"
              data-handle-side={side}
              aria-label={`Conectar desde ${side.toUpperCase()}`}
              onMouseDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
                onConnectionStart(node.id, side, e)
              }}
              className={cn(
                'absolute h-4 w-4 rounded-full border-2 border-primary bg-background',
                'hover:scale-125 hover:bg-primary transition-all duration-150',
                'cursor-crosshair shadow-md z-20 animate-fade-in-up',
                HANDLE_POSITION_CLASSES[side],
              )}
            />
          ))}
        </>
      )}
    </div>
  )
}
