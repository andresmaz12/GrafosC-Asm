'use client'

// ============================================
// COMPILADOR - Main Application Page
// ============================================

import { useState, useCallback, useEffect, useMemo } from 'react'
import { 
  ShapesToolbar, 
  FlowchartCanvas, 
  CodePanel, 
  PropertiesPanel,
  ProjectManager,
  CompilerHeader,
  type EchoMessage 
} from '@/components/compiler'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import { 
  generateMermaidCode,
  validateMermaidDiagram,
  compileFlowchart,
  DEFAULT_SHAPE_SIZES, 
  DEFAULT_CONTENT,
  getAllProjects,
  getProjectById,
  createProject,
  saveProject,
  getCurrentProjectId,
  setCurrentProjectId
} from '@/lib/compiler'
import type { 
  FlowchartNode, 
  FlowchartShapeType, 
  FlowchartState,
  FlowchartConnection,
  Project,
  FunctionParameter,
  StartEndData,
  ProcessData,
  DecisionData,
  InputOutputData,
  SubprocessData,
  ReturnData
} from '@/lib/compiler/types'

// Generar ID unico
const generateId = () => Math.random().toString(36).substring(2, 9)

export default function CompiladorPage() {
  const [mounted, setMounted] = useState(false)
  
  // Estado del proyecto actual
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false)

  // Estado del diagrama de flujo
  const [flowchartState, setFlowchartState] = useState<FlowchartState>({
    nodes: [],
    connections: [],
    selectedNodeId: null,
    zoom: 1,
    pan: { x: 0, y: 0 }
  })

  // Estado del codigo generado
  const [cCode, setCCode] = useState('')
  const [assemblyCode, setAssemblyCode] = useState('')
  const [mermaidCode, setMermaidCode] = useState('')

  // Estado de compilacion
  const [isCompiling, setIsCompiling] = useState(false)

  // Mensajes de la consola
  const [echoMessages, setEchoMessages] = useState<EchoMessage[]>([])

  // Cargar proyecto al inicio
  useEffect(() => {
    const currentId = getCurrentProjectId()
    if (currentId) {
      const project = getProjectById(currentId)
      if (project) {
        setCurrentProject(project)
        setFlowchartState(project.flowchartState)
        setMounted(true)
        return
      }
    }
    
    // Si no hay proyecto, mostrar el gestor
    const projects = getAllProjects()
    if (projects.length === 0) {
      // Crear proyecto por defecto
      const newProject = createProject('Mi Primer Proyecto')
      setCurrentProject(newProject)
      setFlowchartState(newProject.flowchartState)
    } else {
      setIsProjectManagerOpen(true)
    }
    setMounted(true)
  }, [])

  // Obtener nodo seleccionado
  const selectedNode = useMemo(() => {
    if (!flowchartState.selectedNodeId) return null
    return flowchartState.nodes.find(n => n.id === flowchartState.selectedNodeId) || null
  }, [flowchartState.selectedNodeId, flowchartState.nodes])

  // Extraer variables existentes del diagrama
  const existingVariables = useMemo(() => {
    return flowchartState.nodes
      .filter(n => n.type === 'input-output' && n.data)
      .map(n => {
        const data = n.data as InputOutputData
        return data?.variable?.name || ''
      })
      .filter(Boolean)
  }, [flowchartState.nodes])

  // Extraer funciones existentes del diagrama
  const existingFunctions = useMemo(() => {
    return flowchartState.nodes
      .filter(n => n.type === 'start-end' && n.data)
      .map(n => {
        const data = n.data as StartEndData
        if (data?.isStart) {
          return {
            name: data.functionName || 'main',
            parameters: data.parameters || []
          }
        }
        return null
      })
      .filter((f): f is { name: string; parameters: FunctionParameter[] } => f !== null)
  }, [flowchartState.nodes])

  // Agregar mensaje a la consola
  const addEchoMessage = useCallback((type: EchoMessage['type'], message: string) => {
    const newMessage: EchoMessage = {
      id: generateId(),
      type,
      message,
      timestamp: new Date()
    }
    setEchoMessages(prev => [...prev, newMessage])
  }, [])

  // Limpiar consola
  const clearEchoMessages = useCallback(() => {
    setEchoMessages([])
  }, [])

  // Manejar inicio de drag desde toolbar
  const handleDragStart = useCallback(() => {
    // Feedback visual opcional
  }, [])

  // Agregar nuevo nodo
  const handleNodeAdd = useCallback((type: FlowchartShapeType, position: { x: number; y: number }) => {
    const defaultSize = DEFAULT_SHAPE_SIZES[type]

    // Inicializar data por defecto segun el tipo de figura
    const defaultData: Record<FlowchartShapeType, FlowchartNode['data']> = {
      'start-end': { functionName: 'main', parameters: [], isStart: true } as StartEndData,
      'process': { processType: 'print' as const, printContent: 'Hola' } as ProcessData,
      'decision': { conditionalType: 'if' as const, condition: 'x > 0', cases: [{ label: 'Si', condition: '' }] } as DecisionData,
      'input-output': { variable: { name: 'x', type: 'int' as const, value: '0' } } as InputOutputData,
      'subprocess': { functionName: 'funcion', arguments: [] } as SubprocessData,
      'return': { returnValue: '0' } as ReturnData,
    }

    const newNode: FlowchartNode = {
      id: generateId(),
      type,
      position: {
        x: position.x - defaultSize.width / 2,
        y: position.y - defaultSize.height / 2
      },
      size: defaultSize,
      content: DEFAULT_CONTENT[type],
      connections: [],
      data: defaultData[type],
    }

    setFlowchartState(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
      selectedNodeId: newNode.id
    }))

    addEchoMessage('info', `Figura agregada: ${type}`)
  }, [addEchoMessage])

  // Estado de conexion seleccionada (independiente del flowchartState para no mezclar persistencia)
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null)

  // Seleccionar nodo
  const handleNodeSelect = useCallback((id: string | null) => {
    setFlowchartState(prev => ({
      ...prev,
      selectedNodeId: id
    }))
    if (id !== null) setSelectedConnectionId(null)
  }, [])

  // Seleccionar conexion (excluyente con seleccion de nodo)
  const handleConnectionSelect = useCallback((id: string | null) => {
    setSelectedConnectionId(id)
    if (id !== null) {
      setFlowchartState(prev => ({ ...prev, selectedNodeId: null }))
    }
  }, [])

  // Anadir conexion (evita duplicados exactos)
  const handleConnectionAdd = useCallback((conn: Omit<FlowchartConnection, 'id'>) => {
    setFlowchartState(prev => {
      const exists = prev.connections.some(c =>
        c.sourceId === conn.sourceId &&
        c.targetId === conn.targetId &&
        c.sourceHandle === conn.sourceHandle &&
        c.type === conn.type,
      )
      if (exists) return prev
      const newConnection: FlowchartConnection = { id: generateId(), ...conn }
      return { ...prev, connections: [...prev.connections, newConnection] }
    })
    addEchoMessage('info', `Conexion creada (${conn.type})`)
  }, [addEchoMessage])

  // Eliminar conexion
  const handleConnectionDelete = useCallback((id: string) => {
    setFlowchartState(prev => ({
      ...prev,
      connections: prev.connections.filter(c => c.id !== id),
    }))
    addEchoMessage('info', 'Conexion eliminada')
  }, [addEchoMessage])

  // Actualizar nodo
  const handleNodeUpdate = useCallback((id: string, updates: Partial<FlowchartNode>) => {
    setFlowchartState(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === id ? { ...node, ...updates } : node
      )
    }))
  }, [])

  // Eliminar nodo
  const handleNodeDelete = useCallback((id: string) => {
    setFlowchartState(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.id !== id),
      connections: prev.connections.filter(
        conn => conn.sourceId !== id && conn.targetId !== id
      ),
      selectedNodeId: prev.selectedNodeId === id ? null : prev.selectedNodeId
    }))
    addEchoMessage('info', 'Figura eliminada')
  }, [addEchoMessage])

  // Compilar diagrama
  const handleCompile = useCallback(async () => {
    setIsCompiling(true)
    addEchoMessage('info', 'Iniciando compilacion...')

    try {
      if (flowchartState.nodes.length === 0) {
        addEchoMessage('warning', 'El diagrama esta vacio. Agrega figuras para compilar.')
        setIsCompiling(false)
        return
      }

      const validation = validateMermaidDiagram(flowchartState)
      validation.warnings.forEach(w => addEchoMessage('warning', w))
      validation.errors.forEach(e => addEchoMessage('error', e))

      if (!validation.isValid) {
        addEchoMessage('error', 'Corrige los errores antes de compilar')
        setIsCompiling(false)
        return
      }

      const generatedMermaid = generateMermaidCode(flowchartState)
      setMermaidCode(generatedMermaid)
      addEchoMessage('success', 'Codigo Mermaid generado')

      addEchoMessage('info', 'Enviando a backend Python (/api/compile)...')
      const result = await compileFlowchart({
        projectName: currentProject?.name || 'proyecto',
        flowchartState,
        mermaidCode: generatedMermaid,
      })

      result.warnings.forEach(w => addEchoMessage('warning', w))
      result.errors.forEach(e => addEchoMessage('error', e))

      if (result.cCode) {
        setCCode(result.cCode)
        addEchoMessage('success', 'Codigo C generado correctamente')
      }
      if (result.asmCode) {
        setAssemblyCode(result.asmCode)
        addEchoMessage('success', 'Codigo Assembly generado correctamente')
      }
      if (result.mermaidCode) {
        setMermaidCode(result.mermaidCode)
      }

      if (result.files?.c) addEchoMessage('info', `Archivo C escrito en ${result.files.c}`)
      if (result.files?.asm) addEchoMessage('info', `Archivo ASM escrito en ${result.files.asm}`)
      if (result.files?.mermaid) addEchoMessage('info', `Mermaid persistido en ${result.files.mermaid}`)

      if (result.ok) {
        addEchoMessage('success', `Compilacion completada. ${flowchartState.nodes.length} nodos procesados.`)
      } else {
        addEchoMessage('error', 'Compilacion finalizada con errores.')
      }
    } catch (error) {
      addEchoMessage('error', `Error de compilacion: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setIsCompiling(false)
    }
  }, [flowchartState, addEchoMessage, currentProject])

  // Guardar proyecto
  const handleSave = useCallback(() => {
    if (!currentProject) {
      addEchoMessage('warning', 'No hay proyecto activo')
      return
    }

    saveProject({
      ...currentProject,
      flowchartState
    })
    addEchoMessage('success', `Proyecto "${currentProject.name}" guardado`)
  }, [currentProject, flowchartState, addEchoMessage])

  // Abrir gestor de proyectos
  const handleLoad = useCallback(() => {
    setIsProjectManagerOpen(true)
  }, [])

  // Seleccionar proyecto
  const handleProjectSelect = useCallback((project: Project) => {
    setCurrentProject(project)
    setFlowchartState(project.flowchartState)
    setCurrentProjectId(project.id)
    setSelectedConnectionId(null)
    setCCode('')
    setAssemblyCode('')
    setMermaidCode('')
    clearEchoMessages()
    addEchoMessage('info', `Proyecto "${project.name}" cargado`)
  }, [addEchoMessage, clearEchoMessages])

  // Crear nuevo proyecto
  const handleProjectCreate = useCallback((project: Project) => {
    setCurrentProject(project)
    setFlowchartState(project.flowchartState)
    setSelectedConnectionId(null)
    setCCode('')
    setAssemblyCode('')
    setMermaidCode('')
    clearEchoMessages()
    addEchoMessage('info', `Proyecto "${project.name}" creado`)
  }, [addEchoMessage, clearEchoMessages])

  // Abrir configuracion (placeholder)
  const handleSettings = useCallback(() => {
    addEchoMessage('info', 'Configuracion en desarrollo')
  }, [addEchoMessage])

  // Manejar subida de archivo Mermaid
  const handleUploadMermaid = useCallback((newState: FlowchartState, filename: string) => {
    setFlowchartState(newState)
    setSelectedConnectionId(null)
    setMermaidCode('') // o setMermaidCode del texto original si quisieramos
    addEchoMessage('success', `Diagrama Mermaid cargado desde ${filename}. Nodos: ${newState.nodes.length}`)
  }, [addEchoMessage])

  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-muted-foreground font-medium">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary border-t-transparent" />
          <span>Cargando compilador...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header */}
      <CompilerHeader
        onCompile={handleCompile}
        onSave={handleSave}
        onLoad={handleLoad}
        onSettings={handleSettings}
        onUploadMermaid={handleUploadMermaid}
        isCompiling={isCompiling}
        projectName={currentProject?.name || 'Sin proyecto'}
      />

      {/* Main Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar - Shapes Toolbar (no resizable, fixed width) */}
        <ShapesToolbar onDragStart={handleDragStart} />

        {/* Resizable area: center (canvas + properties) | code panel */}
        <ResizablePanelGroup direction="horizontal" className="flex-1 min-w-0">
          <ResizablePanel defaultSize={70} minSize={30} className="min-w-0">
            {/* Vertical split inside center column */}
            <ResizablePanelGroup direction="vertical" className="h-full">
              <ResizablePanel defaultSize={65} minSize={25} className="min-h-0">
                <FlowchartCanvas
                  nodes={flowchartState.nodes}
                  connections={flowchartState.connections}
                  selectedNodeId={flowchartState.selectedNodeId}
                  selectedConnectionId={selectedConnectionId}
                  onNodeSelect={handleNodeSelect}
                  onNodeUpdate={handleNodeUpdate}
                  onNodeAdd={handleNodeAdd}
                  onNodeDelete={handleNodeDelete}
                  onConnectionAdd={handleConnectionAdd}
                  onConnectionDelete={handleConnectionDelete}
                  onConnectionSelect={handleConnectionSelect}
                  className="h-full"
                />
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel defaultSize={35} minSize={10} className="min-h-0">
                <PropertiesPanel
                  selectedNode={selectedNode}
                  onNodeUpdate={handleNodeUpdate}
                  existingVariables={existingVariables}
                  existingFunctions={existingFunctions}
                  className="h-full"
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={30} minSize={15} className="min-w-0">
            <CodePanel
              cCode={cCode}
              assemblyCode={assemblyCode}
              mermaidCode={mermaidCode}
              echoMessages={echoMessages}
              onClearEcho={clearEchoMessages}
              className="h-full"
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Project Manager Modal */}
      <ProjectManager
        open={isProjectManagerOpen}
        onOpenChange={setIsProjectManagerOpen}
        currentProjectId={currentProject?.id || null}
        onProjectSelect={handleProjectSelect}
        onProjectCreate={handleProjectCreate}
      />
    </div>
  )
}
