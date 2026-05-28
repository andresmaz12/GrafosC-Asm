'use client'

// ============================================
// COMPILADOR - Main Application Workspace (Dynamic Route)
// ============================================

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Home, FileCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  ShapesToolbar, 
  FlowchartCanvas, 
  CodePanel, 
  PropertiesPanel,
  ProjectManager,
  CompilerHeader,
  ExecutionModal,
  type EchoMessage,
  type ElfStatus,
  type PrereqStatus,
  type ExecutionResult,
  type ExecStatus,
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

export default function CompiladorWorkspacePage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  
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

  // Estado de ensamblado (NASM + ld via WSL2)
  const [elfStatus, setElfStatus] = useState<ElfStatus>('idle')
  const [nasmLog, setNasmLog] = useState('')
  const [ldLog, setLdLog] = useState('')
  const [elfPath, setElfPath] = useState('')
  const [prereqStatus, setPrereqStatus] = useState<PrereqStatus | null>(null)

  // Estado de ejecucion del ELF
  const [isExecModalOpen, setIsExecModalOpen] = useState(false)
  const [execStatus, setExecStatus] = useState<ExecStatus>('idle')
  const [execResult, setExecResult] = useState<ExecutionResult | null>(null)

  // Mensajes de la consola
  const [echoMessages, setEchoMessages] = useState<EchoMessage[]>([])

  // Cargar proyecto al inicio + verificar prerequisitos de ensamblado
  useEffect(() => {
    // Verificar prerequisitos (WSL2, NASM, ld) en background
    fetch('/api/assemble/prereq')
      .then(r => r.json())
      .then((data: PrereqStatus & { install_hint?: string }) => {
        setPrereqStatus({
          wsl: data.wsl,
          nasm: data.nasm,
          ld: data.ld,
          install_hint: data.install_hint,
        })
      })
      .catch(() => {
        setPrereqStatus({ wsl: false, nasm: false, ld: false })
      })

    if (projectId) {
      const project = getProjectById(projectId)
      if (project) {
        setCurrentProject(project)
        setFlowchartState(project.flowchartState)
        setCurrentProjectId(project.id) // Registrar en storage el actual activo
      }
    }
    setMounted(true)
  }, [projectId])

  // Obtener nodo seleccionado
  const selectedNode = useMemo(() => {
    if (!flowchartState.selectedNodeId) return null
    return flowchartState.nodes.find(n => n.id === flowchartState.selectedNodeId) || null
  }, [flowchartState.selectedNodeId, flowchartState.nodes])

  // Extraer variables existentes del diagrama
  const existingVariables = useMemo(() => {
    const vars = flowchartState.nodes
      .filter(n => n.type === 'input-output' && n.data)
      .filter(n => {
        const data = n.data as InputOutputData
        return data.mode !== 'scanf'
      })
      .map(n => {
        const data = n.data as InputOutputData
        return data?.variable?.name || ''
      })
      .filter(Boolean)
    return Array.from(new Set(vars))
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

  // Extraer variables que requieren input (scanf) en el diagrama
  const inputVariables = useMemo(() => {
    const vars: { id: string; name: string; type: string }[] = []
    flowchartState.nodes.forEach(n => {
      if (n.type === 'input-output') {
        const data = n.data as InputOutputData | undefined
        const isScanf = data?.mode === 'scanf' || (n.content && n.content.includes('scanf'))
        if (isScanf) {
          let name = data?.variable?.name || 'x'
          let type = data?.variable?.type || 'int'
          
          // Prioridad al contenido escrito visualmente
          const m = n.content.match(/scanf\s*\(\s*\"?([a-zA-Z_]\w*)\"?\s*\)/)
          if (m) {
            name = m[1]
          }
          vars.push({ id: n.id, name, type })
        }
      }
    })
    return vars
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
    setElfStatus('idle')
    setElfPath('')
    setNasmLog('')
    setLdLog('')
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

      // --- Estado de ensamblado ---
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = result as any
      if (r.nasmLog) setNasmLog(r.nasmLog)
      if (r.ldLog)   setLdLog(r.ldLog)

      if (r.elfPath) {
        setElfPath(r.elfPath)
        setElfStatus('ready')
        addEchoMessage('success', `ELF generado: ${r.elfPath} (${r.asmElapsedMs ?? 0}ms)`)
        if (result.files?.obj) addEchoMessage('info', `Objeto: ${result.files.obj}`)
      } else if (result.asmCode) {
        // ASM generado pero no ensamblado (WSL no disponible o falló)
        setElfStatus('error')
      }

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

  // Abrir gestor de proyectos (redirecciona a Dashboard)
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
    setMermaidCode('')
    addEchoMessage('success', `Diagrama Mermaid cargado desde ${filename}. Nodos: ${newState.nodes.length}`)
  }, [addEchoMessage])

  // Abrir modal de ejecucion del ELF
  const handleOpenExecModal = useCallback(() => {
    setExecStatus('idle')
    setExecResult(null)
    setIsExecModalOpen(true)
  }, [])

  // Ejecutar el ELF en WSL2
  const handleExecuteElf = useCallback(async (stdin?: string): Promise<ExecutionResult | null> => {
    if (!elfPath) return null
    setExecStatus('running')
    addEchoMessage('info', `Ejecutando ELF en WSL2: ${elfPath}`)
    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ elfPath, stdin }),
      })
      const data = await response.json() as ExecutionResult
      setExecResult(data)
      setExecStatus(data.ok ? 'success' : 'error')
      if (data.ok) {
        addEchoMessage('success', `Programa terminado (código ${data.exitCode}) en ${data.elapsed_ms}ms`)
      } else {
        addEchoMessage('error', `Programa terminó con código ${data.exitCode}`)
      }
      return data
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido'
      const failResult: ExecutionResult = {
        ok: false, exitCode: -1, stdout: '', stderr: '',
        elapsed_ms: 0, errors: [msg]
      }
      setExecResult(failResult)
      setExecStatus('error')
      addEchoMessage('error', `Error ejecutando ELF: ${msg}`)
      return failResult
    }
  }, [elfPath, addEchoMessage])

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

  if (!currentProject) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#09090b] text-foreground gap-5">
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-destructive/80">
          <FileCode className="h-10 w-10" />
        </div>
        <div className="text-center space-y-1.5">
          <h2 className="text-xl font-bold tracking-tight">Proyecto no encontrado</h2>
          <p className="text-sm text-zinc-400 max-w-sm px-4">
            El proyecto con ID "{projectId}" no existe o fue eliminado de tu almacenamiento local.
          </p>
        </div>
        <Button 
          onClick={() => router.push('/')}
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer font-medium text-xs px-4 h-9"
        >
          <Home className="h-4 w-4" />
          Volver a la Bienvenida
        </Button>
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
        projectName={currentProject.name}
        onExecute={handleOpenExecModal}
        canExecute={elfStatus === 'ready' && !!elfPath}
      />

      {/* Main Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar - Shapes Toolbar */}
        <ShapesToolbar onDragStart={handleDragStart} />

        {/* Resizable area */}
        <ResizablePanelGroup direction="horizontal" className="flex-1 min-w-0">
          <ResizablePanel defaultSize={70} minSize={30} className="min-w-0">
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
              elfStatus={elfStatus}
              nasmLog={nasmLog}
              ldLog={ldLog}
              elfPath={elfPath}
              prereqStatus={prereqStatus}
              onExecute={handleOpenExecModal}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Legacy/Toolbar Project Manager Dialog */}
      <ProjectManager
        open={isProjectManagerOpen}
        onOpenChange={setIsProjectManagerOpen}
        currentProjectId={currentProject.id}
        onProjectSelect={handleProjectSelect}
        onProjectCreate={handleProjectCreate}
      />

      {/* Execution Modal */}
      <ExecutionModal
        open={isExecModalOpen}
        onOpenChange={setIsExecModalOpen}
        projectName={currentProject.name}
        elfPath={elfPath}
        onRun={handleExecuteElf}
        status={execStatus}
        result={execResult}
        inputVariables={inputVariables}
      />
    </div>
  )
}
