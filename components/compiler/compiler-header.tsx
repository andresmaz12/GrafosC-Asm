'use client'

// ============================================
// COMPILADOR - Header Component
// ============================================
// Barra superior con titulo y boton de compilacion

import { cn } from '@/lib/utils'
import { Play, Settings, Save, FolderOpen, Info, Upload, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Spinner } from '@/components/ui/spinner'
import { useRef } from 'react'
import { parseMermaidToState, type FlowchartState } from '@/lib/compiler'
import { useRouter } from 'next/navigation'

interface CompilerHeaderProps {
  onCompile: () => void
  onSave: () => void
  onLoad: () => void
  onSettings: () => void
  onUploadMermaid?: (state: FlowchartState, filename: string) => void
  isCompiling: boolean
  projectName: string
  className?: string
  onExecute?: () => void
  canExecute?: boolean
}

export function CompilerHeader({
  onCompile,
  onSave,
  onLoad,
  onSettings,
  onUploadMermaid,
  isCompiling,
  projectName,
  className,
  onExecute,
  canExecute = false
}: CompilerHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const newState = parseMermaidToState(text)
      if (onUploadMermaid) {
        onUploadMermaid(newState, file.name)
      }
    } catch (error) {
      console.error("Error parsing Mermaid file", error)
    } finally {
      // Reset input so the same file can be uploaded again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <header 
        className={cn(
          'flex items-center justify-between h-14 px-4',
          'bg-sidebar border-b border-sidebar-border',
          className
        )}
      >
        {/* Left section - Logo and title */}
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/')}
            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
          >
            <Home className="h-4 w-4" />
          </Button>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            C
          </div>
          <div>
            <h1 className="text-sm font-semibold">Compilador</h1>
            <p className="text-xs text-muted-foreground">{projectName}</p>
          </div>
        </div>

        {/* Center section - Project actions */}
        <div className="flex items-center gap-1">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".md,.txt,.mermaid" 
            className="hidden" 
          />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleUploadClick}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Subir Mermaid</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onLoad}
              >
                <FolderOpen className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Abrir proyecto</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onSave}
              >
                <Save className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Guardar proyecto (Ctrl+S)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onSettings}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Configuracion</TooltipContent>
          </Tooltip>
        </div>

        {/* Right section - Actions */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="font-semibold mb-1">Como usar</p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>1. Arrastra figuras desde la barra al canvas</li>
                <li>2. Selecciona una figura para ver sus 4 handles N/S/E/W</li>
                <li>3. Arrastra desde un handle hasta otro nodo para conectar</li>
                <li>4. Click en una flecha y Delete para eliminarla</li>
                <li>5. Edita propiedades en el panel inferior y pulsa Compilar</li>
              </ul>
            </TooltipContent>
          </Tooltip>

          <Button 
            onClick={onCompile}
            disabled={isCompiling}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
          >
            {isCompiling ? (
              <>
                <Spinner size="sm" />
                Compilando...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Compilar
              </>
            )}
          </Button>

          {onExecute && (
            <Button 
              onClick={onExecute}
              disabled={!canExecute}
              className={cn(
                "gap-2 font-medium cursor-pointer transition-colors shadow-sm h-9",
                canExecute 
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white" 
                  : "bg-emerald-600/30 hover:bg-emerald-600/30 text-white/40 cursor-not-allowed border border-zinc-800/10"
              )}
            >
              <Play className="h-4 w-4 fill-current" />
              Ejecutar
            </Button>
          )}
        </div>
      </header>
    </TooltipProvider>
  )
}
