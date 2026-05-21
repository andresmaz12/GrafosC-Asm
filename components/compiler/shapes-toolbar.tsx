'use client'

// ============================================
// COMPILADOR - Shapes Toolbar Component
// ============================================
// Barra lateral izquierda con las figuras arrastrables

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { 
  Circle, 
  Square, 
  Diamond, 
  Hexagon,
  Layers,
  CornerDownLeft
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { SHAPE_NAMES, SHAPE_DESCRIPTIONS, SHAPE_COLORS } from '@/lib/compiler/constants'
import type { FlowchartShapeType } from '@/lib/compiler/types'

interface ShapesToolbarProps {
  onDragStart: (type: FlowchartShapeType) => void
  className?: string
}

const shapes: { type: FlowchartShapeType; icon: React.ReactNode }[] = [
  { type: 'start-end', icon: <Circle className="w-6 h-6" /> },
  { type: 'process', icon: <Square className="w-6 h-6" /> },
  { type: 'decision', icon: <Diamond className="w-6 h-6" /> },
  { type: 'input-output', icon: <Hexagon className="w-6 h-6" /> },
  { type: 'subprocess', icon: <Layers className="w-6 h-6" /> },
  { type: 'return', icon: <CornerDownLeft className="w-6 h-6" /> },
]

export function ShapesToolbar({ onDragStart, className }: ShapesToolbarProps) {
  const [draggingType, setDraggingType] = useState<FlowchartShapeType | null>(null)

  const handleDragStart = (type: FlowchartShapeType, e: React.DragEvent) => {
    setDraggingType(type)
    e.dataTransfer.setData('shape-type', type)
    e.dataTransfer.effectAllowed = 'copy'
    onDragStart(type)
  }

  const handleDragEnd = () => {
    setDraggingType(null)
  }

  return (
    <TooltipProvider delayDuration={300}>
      <aside 
        className={cn(
          'flex flex-col w-16 bg-sidebar-green border-r border-sidebar-green-border',
          'animate-slide-in-left',
          className
        )}
      >
        {/* Header */}
        <div className="p-3 border-b border-sidebar-green-border">
          <div className="w-10 h-10 rounded-lg bg-shape-start-bg border border-shape-start-border flex items-center justify-center">
            <Layers className="w-5 h-5 text-shape-start-text" />
          </div>
        </div>

        {/* Shapes List */}
        <div className="flex-1 p-2 space-y-1 overflow-y-auto custom-scrollbar">
          {shapes.map(({ type, icon }) => {
            const colors = SHAPE_COLORS[type]
            return (
              <Tooltip key={type}>
                <TooltipTrigger asChild>
                  <button
                    draggable
                    onDragStart={(e) => handleDragStart(type, e)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center',
                      'border-2 transition-all duration-200 cursor-grab active:cursor-grabbing',
                      'hover:scale-105 hover:shadow-lg hover:brightness-110',
                      colors.bg,
                      colors.border,
                      colors.text,
                      draggingType === type && 'opacity-50 scale-95'
                    )}
                  >
                    {icon}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[200px]">
                  <p className="font-semibold">{SHAPE_NAMES[type]}</p>
                  <p className="text-xs text-muted-foreground">
                    {SHAPE_DESCRIPTIONS[type]}
                  </p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>

        {/* Footer hint */}
        <div className="p-2 border-t border-sidebar-green-border">
          <p className="text-[10px] text-center text-muted-foreground">
            Arrastra al canvas
          </p>
        </div>
      </aside>
    </TooltipProvider>
  )
}
