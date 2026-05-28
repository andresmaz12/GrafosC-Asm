'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  FolderOpen,
  Plus,
  Trash2,
  Download,
  Upload,
  Edit2,
  Check,
  X,
  FileCode,
  ArrowRight,
  Code2,
  Terminal,
  Cpu,
  RefreshCw,
  FolderClosed,
  ChevronRight,
  BookOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Project, TemplateType } from '@/lib/compiler'
import {
  getAllProjects,
  createProject,
  deleteProject,
  renameProject,
  importProject,
  exportProject,
  TEMPLATES
} from '@/lib/compiler'

export function WelcomeScreen() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [mounted, setMounted] = useState(false)

  // States for new project from template
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | null>(null)
  const [newProjectName, setNewProjectName] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  // Delete confirm state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cargar proyectos al montar
  useEffect(() => {
    setProjects(getAllProjects())
    setMounted(true)
  }, [])

  const handleTemplateSelect = (type: TemplateType) => {
    setSelectedTemplate(type)
    const defaultNames: Record<TemplateType, string> = {
      empty: 'Mi Proyecto Vacío',
      hello: 'Hola Mundo',
      loop: 'Contador del 1 al 5',
      factorial: 'Factorial Simple',
      collatz: 'Conjetura de Collatz',
      fibonacci: 'Generador de Fibonacci',
      factorial_interactive: 'Factorial Interactivo con Entrada',
      auxiliary: 'Funciones Auxiliares'
    }
    setNewProjectName(defaultNames[type])
    setIsCreateOpen(true)
  }

  const handleCreateProject = () => {
    if (!newProjectName.trim() || !selectedTemplate) return

    const project = createProject(newProjectName.trim(), selectedTemplate)
    setIsCreateOpen(false)
    setSelectedTemplate(null)
    setNewProjectName('')

    // Redirigir directamente al editor del proyecto
    router.push(`/editor/${project.id}`)
  }

  const handleSelectProject = (id: string) => {
    router.push(`/editor/${id}`)
  }

  const handleDeleteProject = (id: string) => {
    deleteProject(id)
    setProjects(getAllProjects())
    setDeleteConfirmId(null)
  }

  const handleRenameProject = (id: string) => {
    if (!editingName.trim()) {
      setEditingId(null)
      return
    }
    renameProject(id, editingName.trim())
    setProjects(getAllProjects())
    setEditingId(null)
  }

  const handleImportProject = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const project = await importProject(file)
      setProjects(getAllProjects())
      // Redirigir directamente al editor
      router.push(`/editor/${project.id}`)
    } catch (error) {
      console.error('Error importing project:', error)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleExportProjectClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation()
    exportProject(project)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#09090b] text-foreground flex flex-col antialiased">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[400px] bg-violet-500/5 blur-[180px] rounded-full pointer-events-none" />

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-12 flex flex-col gap-12 relative z-10">

        {/* Glowing Title/Hero Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-zinc-800/40">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-primary font-medium">
              <Cpu className="h-3 w-3 text-primary animate-pulse" />
              Editor e Intérprete x86 Embebido
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Compilador Grafos
            </h1>
            <p className="text-muted-foreground max-w-xl text-sm md:text-base font-light">
              Dibuja diagramas de flujo estructurados y compílalos directamente en C ejecutable y Ensamblador NASM de 32 bits bajo WSL2.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="gap-2 bg-zinc-900/50 hover:bg-zinc-800 border-zinc-800 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 text-zinc-400" />
              Importar JSON
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportProject}
            />
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT: Recent Projects Panel (7 cols) */}
          <div className="lg:col-span-7 space-y-6 flex flex-col h-[650px]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-wide flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-primary" />
                Proyectos Recientes
              </h2>
              <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-850">
                {projects.length} {projects.length === 1 ? 'proyecto' : 'proyectos'}
              </span>
            </div>

            {/* Scroll Container */}
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full border border-zinc-800/40 bg-zinc-950/20 backdrop-blur-md rounded-xl p-2">
                {projects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[500px] text-zinc-500 border border-dashed border-zinc-850 rounded-lg p-8 text-center">
                    <FolderClosed className="h-16 w-16 mb-4 opacity-25 text-zinc-400" />
                    <p className="text-sm font-medium">No se encontraron proyectos guardados</p>
                    <p className="text-xs text-zinc-650 max-w-xs mt-1">
                      Selecciona una de las plantillas de la derecha o importa un archivo `.json` para comenzar.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 p-1">
                    {projects.map(project => {
                      const numNodes = project.flowchartState?.nodes?.length || 0
                      const numConns = project.flowchartState?.connections?.length || 0

                      return (
                        <div
                          key={project.id}
                          onClick={() => handleSelectProject(project.id)}
                          className={cn(
                            'group relative flex items-center justify-between p-4 rounded-xl border border-zinc-900/60 bg-zinc-950/40 cursor-pointer transition-all duration-300',
                            'hover:border-zinc-800 hover:bg-zinc-900/20 hover:shadow-lg hover:shadow-primary/5 hover:translate-y-[-1px]'
                          )}
                        >
                          <div className="flex items-start gap-4 min-w-0 flex-1">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 group-hover:border-zinc-700 shrink-0">
                              <FileCode className="h-5 w-5 text-primary group-hover:scale-105 transition-transform" />
                            </div>

                            <div className="min-w-0 flex-1">
                              {editingId === project.id ? (
                                <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                  <Input
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    className="h-8 text-sm max-w-[220px]"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleRenameProject(project.id)
                                      if (e.key === 'Escape') setEditingId(null)
                                    }}
                                    onBlur={() => handleRenameProject(project.id)}
                                  />
                                  <Button size="icon" className="h-8 w-8" onClick={() => handleRenameProject(project.id)}>
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors pr-4">
                                    {project.name}
                                  </h3>
                                  <div className="flex items-center gap-3 mt-1.5">
                                    <span className="text-xs text-zinc-550 flex items-center gap-1">
                                      {formatDate(project.updatedAt)}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-zinc-800" />
                                    <span className="text-xs text-zinc-550">
                                      {numNodes} {numNodes === 1 ? 'nodo' : 'nodos'} • {numConns} {numConns === 1 ? 'conexión' : 'conexiones'}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Quick Actions Panel */}
                          <div className="flex items-center gap-1.5 md:opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-zinc-400 hover:text-white"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingId(project.id)
                                setEditingName(project.name)
                              }}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-zinc-400 hover:text-white"
                              onClick={(e) => handleExportProjectClick(e, project)}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-white hover:bg-destructive/10"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteConfirmId(project.id)
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-primary group-hover:translate-x-0.5 transition-all ml-1 shrink-0" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          {/* RIGHT: Quick Start / Templates Grid (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-lg font-semibold tracking-wide flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Nueva Plantilla de Flujo
            </h2>

            <div className="grid grid-cols-1 gap-4">

              {/* Template: Empty */}
              <div
                onClick={() => handleTemplateSelect('empty')}
                className="group p-5 rounded-xl border border-zinc-900 bg-zinc-950/40 hover:border-primary/40 hover:bg-zinc-900/10 cursor-pointer transition-all duration-300 shadow-md flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 group-hover:border-primary/30 flex items-center justify-center text-zinc-400 group-hover:text-primary shrink-0 transition-colors">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold group-hover:text-primary transition-colors flex items-center gap-2">
                    {TEMPLATES.empty.name}
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className="text-xs text-zinc-500 font-light leading-relaxed">
                    {TEMPLATES.empty.description}
                  </p>
                </div>
              </div>

              {/* Template: Hello World */}
              <div
                onClick={() => handleTemplateSelect('hello')}
                className="group p-5 rounded-xl border border-zinc-900 bg-zinc-950/40 hover:border-violet-500/40 hover:bg-zinc-900/10 cursor-pointer transition-all duration-300 shadow-md flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 group-hover:border-violet-500/30 flex items-center justify-center text-zinc-400 group-hover:text-violet-450 shrink-0 transition-colors">
                  <Terminal className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold group-hover:text-violet-450 transition-colors flex items-center gap-2">
                    {TEMPLATES.hello.name}
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className="text-xs text-zinc-500 font-light leading-relaxed">
                    {TEMPLATES.hello.description}
                  </p>
                </div>
              </div>

              {/* Template: Simple Loop */}
              <div
                onClick={() => handleTemplateSelect('loop')}
                className="group p-5 rounded-xl border border-zinc-900 bg-zinc-950/40 hover:border-emerald-500/40 hover:bg-zinc-900/10 cursor-pointer transition-all duration-300 shadow-md flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 group-hover:border-emerald-500/30 flex items-center justify-center text-zinc-400 group-hover:text-emerald-450 shrink-0 transition-colors">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold group-hover:text-emerald-450 transition-colors flex items-center gap-2">
                    {TEMPLATES.loop.name}
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className="text-xs text-zinc-500 font-light leading-relaxed">
                    {TEMPLATES.loop.description}
                  </p>
                </div>
              </div>

              {/* Template: Factorial Accumulator */}
              <div
                onClick={() => handleTemplateSelect('factorial')}
                className="group p-5 rounded-xl border border-zinc-900 bg-zinc-950/40 hover:border-amber-500/40 hover:bg-zinc-900/10 cursor-pointer transition-all duration-300 shadow-md flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 group-hover:border-amber-500/30 flex items-center justify-center text-zinc-400 group-hover:text-amber-450 shrink-0 transition-colors">
                  <Code2 className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold group-hover:text-amber-450 transition-colors flex items-center gap-2">
                    {TEMPLATES.factorial.name}
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className="text-xs text-zinc-500 font-light leading-relaxed">
                    {TEMPLATES.factorial.description}
                  </p>
                </div>
              </div>

            </div>

            {/* General Info / Tips Card */}
            <div className="p-5 rounded-xl border border-zinc-900 bg-zinc-950/20 backdrop-blur-md space-y-3 font-light text-xs text-zinc-550 leading-relaxed">
              <h4 className="font-semibold text-zinc-350 flex items-center gap-1.5 text-[13px]">
                <BookOpen className="h-4.5 w-4.5 text-primary" />
                Arquitectura de Ejecución
              </h4>
              <p>
                La compilación e interpretación de ensamblador genera binarios físicos que se guardan en el directorio del proyecto local.
              </p>
              <p>
                Al ensamblar, la UI aprovecha WSL2 para compilar mediante NASM x86 y linkear los objetos a ejecutables ELF reales ejecutándose nativamente con soporte a entradas (`sys_read`) y salidas estándar (`sys_write`).
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL: Creation / Naming Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border border-zinc-850">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Plus className="h-5 w-5 text-primary" />
              Crear Nuevo Proyecto
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Ingresa el nombre para tu nuevo proyecto de diagrama de flujo.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="projectName" className="text-zinc-300">Nombre del Proyecto</Label>
              <Input
                id="projectName"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Ej. Mi Calculador"
                className="bg-zinc-900 border-zinc-800 text-white focus-visible:ring-primary"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateProject()
                }}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="bg-transparent hover:bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white"
              onClick={() => {
                setIsCreateOpen(false)
                setSelectedTemplate(null)
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateProject} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Crear Proyecto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: Delete Confirm */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent className="bg-zinc-950 border border-zinc-850">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Esta acción no se puede deshacer. Se eliminará permanentemente el proyecto y todo su historial de diagramas del almacenamiento local.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent hover:bg-zinc-900 border-zinc-800 text-zinc-300">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteConfirmId && handleDeleteProject(deleteConfirmId)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
