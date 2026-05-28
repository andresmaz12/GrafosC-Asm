'use client'

// ============================================
// COMPILADOR - Project Manager Component
// ============================================
// Modal para gestionar proyectos (crear, abrir, eliminar)

import { useState, useEffect, useRef } from 'react'
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
  FileCode
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
import { ScrollArea } from '@/components/ui/scroll-area'
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
import type { Project } from '@/lib/compiler/types'
import {
  getAllProjects,
  createProject,
  deleteProject,
  renameProject,
  exportProject,
  importProject,
  setCurrentProjectId
} from '@/lib/compiler/storage'

interface ProjectManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentProjectId: string | null
  onProjectSelect: (project: Project) => void
  onProjectCreate: (project: Project) => void
}

export function ProjectManager({
  open,
  onOpenChange,
  currentProjectId,
  onProjectSelect,
  onProjectCreate
}: ProjectManagerProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [newProjectName, setNewProjectName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  
  // Download Dialog State
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [exportProjectData, setExportProjectData] = useState<Project | null>(null)
  const [exportFileName, setExportFileName] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cargar proyectos
  useEffect(() => {
    if (open) {
      setProjects(getAllProjects())
    }
  }, [open])

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return
    
    const project = createProject(newProjectName.trim())
    setProjects(getAllProjects())
    setNewProjectName('')
    setIsCreating(false)
    onProjectCreate(project)
    onOpenChange(false)
  }

  const handleSelectProject = (project: Project) => {
    setCurrentProjectId(project.id)
    onProjectSelect(project)
    onOpenChange(false)
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

  const handleExportProjectClick = (project: Project) => {
    setExportProjectData(project)
    setExportFileName(`${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`)
    setIsExportOpen(true)
  }

  const confirmExport = () => {
    if (!exportProjectData || !exportFileName.trim()) return

    const blob = new Blob([JSON.stringify(exportProjectData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = exportFileName.trim()
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setIsExportOpen(false)
  }

  const handleImportProject = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const project = await importProject(file)
      setProjects(getAllProjects())
      onProjectSelect(project)
      onOpenChange(false)
    } catch (error) {
      console.error('Error importing project:', error)
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Gestor de Proyectos
            </DialogTitle>
            <DialogDescription>
              Crea, abre o gestiona tus proyectos de diagramas de flujo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Actions */}
            <div className="flex items-center gap-2">
              {isCreating ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Nombre del proyecto"
                    className="flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateProject()
                      if (e.key === 'Escape') setIsCreating(false)
                    }}
                  />
                  <Button size="icon" onClick={handleCreateProject}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setIsCreating(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Button onClick={() => setIsCreating(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nuevo Proyecto
                  </Button>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    Importar
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportProject}
                  />
                </>
              )}
            </div>

            {/* Project List */}
            <ScrollArea className="h-64 border rounded-lg">
              {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                  <FileCode className="h-12 w-12 mb-2 opacity-50" />
                  <p className="text-sm">No hay proyectos</p>
                  <p className="text-xs">Crea un nuevo proyecto para comenzar</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {projects.map(project => (
                    <div 
                      key={project.id}
                      className={cn(
                        'flex items-center gap-2 p-3 rounded-lg transition-colors',
                        'hover:bg-muted/50 cursor-pointer group',
                        currentProjectId === project.id && 'bg-primary/10 border border-primary/30'
                      )}
                      onClick={() => handleSelectProject(project)}
                    >
                      <FileCode className="h-5 w-5 text-primary shrink-0" />
                      
                      <div className="flex-1 min-w-0">
                        {editingId === project.id ? (
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="h-7 text-sm"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameProject(project.id)
                              if (e.key === 'Escape') setEditingId(null)
                            }}
                            onBlur={() => handleRenameProject(project.id)}
                          />
                        ) : (
                          <>
                            <p className="text-sm font-medium truncate">{project.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(project.updatedAt)}
                            </p>
                          </>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
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
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleExportProjectClick(project)
                          }}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteConfirmId(project.id)
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar proyecto</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. El proyecto y todos sus datos seran eliminados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirmId && handleDeleteProject(deleteConfirmId)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export Dialog */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Exportar proyecto</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="exportFileName">Nombre del archivo</Label>
              <Input
                id="exportFileName"
                value={exportFileName}
                onChange={(e) => setExportFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmExport()
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmExport}>
              Exportar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
