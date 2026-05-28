'use client'

// ============================================
// COMPILADOR - Flowchart Canvas Component
// ============================================
// Area central para disenar los diagramas de flujo. Soporta drag-drop de
// figuras desde la toolbar, movimiento de nodos y creacion de conexiones
// arrastrando desde los handles N/S/E/W.

import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ZoomIn, ZoomOut, RotateCcw, MousePointer2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CANVAS_CONFIG } from '@/lib/compiler/constants'
import {
  getHandlePosition,
  nearestHandle,
  buildProvisionalPath,
} from '@/lib/compiler/connection-utils'
import type {
  FlowchartNode,
  FlowchartShapeType,
  FlowchartConnection,
  HandleSide,
  DecisionData,
} from '@/lib/compiler/types'
import { FlowchartNodeComponent } from './flowchart-node'
import { FlowchartConnectionView } from './flowchart-connection'
import { ConnectionBranchDialog } from './connection-branch-dialog'

interface FlowchartCanvasProps {
  nodes: FlowchartNode[]
  connections: FlowchartConnection[]
  selectedNodeId: string | null
  selectedConnectionId: string | null
  onNodeSelect: (id: string | null) => void
  onNodeUpdate: (id: string, updates: Partial<FlowchartNode>) => void
  onNodeAdd: (type: FlowchartShapeType, position: { x: number; y: number }) => void
  onNodeDelete: (id: string) => void
  onConnectionAdd: (connection: Omit<FlowchartConnection, 'id'>) => void
  onConnectionDelete: (id: string) => void
  onConnectionSelect: (id: string | null) => void
  className?: string
}

interface ConnectingState {
  sourceId: string
  sourceSide: HandleSide
  current: { x: number; y: number }
}

interface PendingDecisionConn {
  sourceId: string
  sourceSide: HandleSide
  targetId: string
  targetHandle: HandleSide
}

export function FlowchartCanvas({
  nodes,
  connections,
  selectedNodeId,
  selectedConnectionId,
  onNodeSelect,
  onNodeUpdate,
  onNodeAdd,
  onNodeDelete,
  onConnectionAdd,
  onConnectionDelete,
  onConnectionSelect,
  className,
}: FlowchartCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const transformRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDropTarget, setIsDropTarget] = useState(false)
  const [connecting, setConnecting] = useState<ConnectingState | null>(null)
  const [pendingDecision, setPendingDecision] = useState<PendingDecisionConn | null>(null)
  // ID del nodo receptor + handle más cercano durante drag de conexión
  const [hoverTargetId, setHoverTargetId] = useState<string | null>(null)
  const [hoverTargetHandle, setHoverTargetHandle] = useState<HandleSide | null>(null)
  // Refs para el pan del canvas
  const isPanningRef = useRef(false)
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 })

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + CANVAS_CONFIG.zoomStep, CANVAS_CONFIG.maxZoom))
  }
  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - CANVAS_CONFIG.zoomStep, CANVAS_CONFIG.minZoom))
  }
  const handleZoomReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const screenToLocal = useCallback(
    (clientX: number, clientY: number) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return { x: 0, y: 0 }
      return {
        x: (clientX - rect.left - pan.x) / zoom,
        y: (clientY - rect.top - pan.y) / zoom,
      }
    },
    [pan, zoom],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDropTarget(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDropTarget(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDropTarget(false)
      const shapeType = e.dataTransfer.getData('shape-type') as FlowchartShapeType
      if (!shapeType) return
      const { x, y } = screenToLocal(e.clientX, e.clientY)
      onNodeAdd(shapeType, { x, y })
    },
    [screenToLocal, onNodeAdd],
  )


  // ============================================================
  // Pan del canvas — predeterminado al arrastrar espacio vacío
  // También funciona con middle-click (botón 1) en cualquier lugar
  // ============================================================

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const isOnEmptyCanvas =
        e.target === canvasRef.current || e.target === transformRef.current
      const isLeftClick = e.button === 0
      const isMiddleClick = e.button === 1

      // Deseleccionar al tocar canvas vacío
      if (isOnEmptyCanvas) {
        onNodeSelect(null)
        onConnectionSelect(null)
      }

      // Pan: left-click en espacio vacío O middle-click en cualquier lugar
      if ((isLeftClick && isOnEmptyCanvas) || isMiddleClick) {
        e.preventDefault()
        isPanningRef.current = true
        panStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          panX: pan.x,
          panY: pan.y,
        }

        const handlePanMove = (ev: MouseEvent) => {
          if (!isPanningRef.current) return
          const dx = ev.clientX - panStartRef.current.x
          const dy = ev.clientY - panStartRef.current.y
          setPan({
            x: panStartRef.current.panX + dx,
            y: panStartRef.current.panY + dy,
          })
        }

        const handlePanUp = () => {
          isPanningRef.current = false
          document.removeEventListener('mousemove', handlePanMove)
          document.removeEventListener('mouseup', handlePanUp)
        }

        document.addEventListener('mousemove', handlePanMove)
        document.addEventListener('mouseup', handlePanUp)
      }
    },
    [onNodeSelect, onConnectionSelect, pan.x, pan.y],
  )

  // ============================================================
  // Conexiones: drag desde handle hasta otro nodo
  // ============================================================

  const handleConnectionStart = useCallback(
    (sourceId: string, side: HandleSide, e: React.MouseEvent) => {
      const point = screenToLocal(e.clientX, e.clientY)
      setConnecting({ sourceId, sourceSide: side, current: point })
    },
    [screenToLocal],
  )

  useEffect(() => {
    if (!connecting) return

    const handleMove = (e: MouseEvent) => {
      const point = screenToLocal(e.clientX, e.clientY)
      setConnecting((prev) => (prev ? { ...prev, current: point } : prev))

      // Detectar el nodo y el handle más cercano durante el drag de conexión
      const targetEl = document.elementFromPoint(e.clientX, e.clientY)
      const nodeEl = targetEl?.closest('[data-node-id]') as HTMLElement | null
      const targetId = nodeEl?.dataset.nodeId

      if (targetId && targetId !== connecting.sourceId) {
        setHoverTargetId(targetId)
        const targetNode = nodes.find((n) => n.id === targetId)
        if (targetNode) {
          setHoverTargetHandle(nearestHandle(targetNode, point))
        }
      } else {
        setHoverTargetId(null)
        setHoverTargetHandle(null)
      }
    }

    const handleUp = (e: MouseEvent) => {
      setHoverTargetId(null)
      setHoverTargetHandle(null)
      const targetEl = document.elementFromPoint(e.clientX, e.clientY)
      const nodeEl = targetEl?.closest('[data-node-id]') as HTMLElement | null
      const targetId = nodeEl?.dataset.nodeId

      if (targetId && targetId !== connecting.sourceId) {
        const target = nodes.find((n) => n.id === targetId)
        if (target) {
          const dropPoint = screenToLocal(e.clientX, e.clientY)
          const targetHandle = nearestHandle(target, dropPoint)
          const source = nodes.find((n) => n.id === connecting.sourceId)

          if (source?.type === 'decision') {
            setPendingDecision({
              sourceId: connecting.sourceId,
              sourceSide: connecting.sourceSide,
              targetId,
              targetHandle,
            })
          } else {
            onConnectionAdd({
              sourceId: connecting.sourceId,
              targetId,
              type: 'default',
              sourceHandle: connecting.sourceSide,
              targetHandle,
            })
          }
        }
      }

      setConnecting(null)
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
  }, [connecting, nodes, screenToLocal, onConnectionAdd])

  // ============================================================
  // Confirmar/cancelar dialogo de rama (decision)
  // ============================================================

  const handleBranchConfirm = (branch: Exclude<FlowchartConnection['type'], 'default'>, label: string) => {
    if (!pendingDecision) return
    onConnectionAdd({
      sourceId: pendingDecision.sourceId,
      targetId: pendingDecision.targetId,
      type: branch,
      sourceHandle: pendingDecision.sourceSide,
      targetHandle: pendingDecision.targetHandle,
      ...(label ? { label } : {}),
    })
    setPendingDecision(null)
  }

  const handleBranchCancel = () => setPendingDecision(null)

  // ============================================================
  // Tecla Delete elimina conexion seleccionada
  // ============================================================

  useEffect(() => {
    if (!selectedConnectionId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase()
        if (tag === 'input' || tag === 'textarea') return
        onConnectionDelete(selectedConnectionId)
        onConnectionSelect(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedConnectionId, onConnectionDelete, onConnectionSelect])

  // ============================================================
  // Conexion provisional dibujada mientras se arrastra
  // ============================================================

  const provisionalPath = (() => {
    if (!connecting) return null
    const source = nodes.find((n) => n.id === connecting.sourceId)
    if (!source) return null
    const sourcePoint = getHandlePosition(source, connecting.sourceSide)
    return buildProvisionalPath(sourcePoint, connecting.sourceSide, connecting.current)
  })()

  // Dimensiones del SVG: cubrir el area del canvas con margen generoso
  const svgSize = 4000

  // Datos para dialog
  const pendingSourceNode = pendingDecision
    ? nodes.find((n) => n.id === pendingDecision.sourceId)
    : null
  const pendingDecisionType: 'if' | 'while' = (() => {
    const data = pendingSourceNode?.data as DecisionData | undefined
    return data?.conditionalType ?? 'if'
  })()
  const pendingUsedBranches = (() => {
    const used = new Set<FlowchartConnection['type']>()
    if (!pendingDecision) return used
    for (const c of connections) {
      if (c.sourceId === pendingDecision.sourceId) used.add(c.type)
    }
    return used
  })()

  return (
    <div className={cn('flex flex-col flex-1 min-h-0 min-w-0 bg-canvas', className)}>
      {/* Canvas Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-panel border-b border-border">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-muted-foreground mr-2">Canvas</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        <TooltipProvider delayDuration={300}>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Alejar</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Acercar</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomReset}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Restablecer vista</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* Canvas Area */}
      <div
        ref={canvasRef}
        className={cn(
          'flex-1 relative overflow-hidden canvas-grid',
          isDropTarget && 'drop-target-active ring-2 ring-primary ring-inset',
        )}
        onClick={undefined}
        onMouseDown={handleCanvasMouseDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          cursor: isPanningRef.current
            ? 'grabbing'
            : connecting
            ? 'crosshair'
            : 'grab',
          backgroundPosition: `${pan.x}px ${pan.y}px`,
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          transition: isPanningRef.current ? 'none' : 'background-position 100ms, background-size 100ms, box-shadow 200ms',
        }}
      >
        <div
          ref={transformRef}
          className="absolute inset-0 origin-top-left"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: isPanningRef.current ? 'none' : 'transform 100ms',
          }}
        >
          {/* Capa SVG para conexiones (queda detras de los nodos) */}
          <svg
            width={svgSize}
            height={svgSize}
            className="absolute top-0 left-0"
            style={{ pointerEvents: 'none', overflow: 'visible' }}
          >
            <g style={{ pointerEvents: 'auto' }}>
              {connections.map((c) => {
                const source = nodes.find((n) => n.id === c.sourceId)
                const target = nodes.find((n) => n.id === c.targetId)
                if (!source || !target) return null
                return (
                  <FlowchartConnectionView
                    key={c.id}
                    connection={c}
                    source={source}
                    target={target}
                    isSelected={c.id === selectedConnectionId}
                    onSelect={onConnectionSelect}
                  />
                )
              })}
            </g>

            {provisionalPath && (
              <path
                d={provisionalPath}
                stroke="var(--primary)"
                strokeWidth={2}
                strokeDasharray="6 4"
                fill="none"
                style={{ pointerEvents: 'none' }}
              />
            )}
          </svg>

          {nodes.map((node) => (
            <FlowchartNodeComponent
              key={node.id}
              node={node}
              isSelected={node.id === selectedNodeId}
              connectionTargetHandle={
                connecting && node.id === hoverTargetId ? hoverTargetHandle : null
              }
              onSelect={() => onNodeSelect(node.id)}
              onUpdate={(updates) => onNodeUpdate(node.id, updates)}
              onDelete={() => onNodeDelete(node.id)}
              onConnectionStart={handleConnectionStart}
              zoom={zoom}
            />
          ))}
        </div>

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center animate-fade-in-up">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <MousePointer2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-muted-foreground">Arrastra figuras aqui</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Comienza arrastrando una figura de la barra lateral
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Dialog para asignar rama al conectar desde un decision */}
      <ConnectionBranchDialog
        open={Boolean(pendingDecision)}
        conditionalType={pendingDecisionType}
        usedBranches={pendingUsedBranches}
        onConfirm={handleBranchConfirm}
        onCancel={handleBranchCancel}
      />
    </div>
  )
}
