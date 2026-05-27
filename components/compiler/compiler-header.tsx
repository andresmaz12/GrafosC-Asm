'use client'

// ============================================
// COMPILADOR - Header Component
// ============================================
// Barra superior con titulo y boton de compilacion

import { cn } from '@/lib/utils'
import { Play, Settings, Save, FolderOpen, Info, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Spinner } from '@/components/ui/spinner'
import { useRef } from 'react'
import { parseMermaidToState, type FlowchartState } from '@/lib/compiler'

interface CompilerHeaderProps {
  onCompile: () => void
  onSave: () => void
  onLoad: () => void
  onSettings: () => void
  onUploadMermaid?: (state: FlowchartState, filename: string) => void
  isCompiling: boolean
  projectName: string
  className?: string
}

export function CompilerHeader({
  onCompile,
  onSave,
  onLoad,
  onSettings,
  onUploadMermaid,
  isCompiling,
  projectName,
  className
}: CompilerHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

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

        {/* Right section - Compile button */}
        <div className="flex items-center gap-3">
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
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
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
        </div>
      </header>
    </TooltipProvider>
  )
}
