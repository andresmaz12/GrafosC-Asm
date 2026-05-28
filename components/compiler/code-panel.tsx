'use client'

// ============================================
// COMPILADOR - Code Panel Component
// ============================================
// Panel lateral derecho con pestanas de codigo C, Assembler y Echo debajo

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { 
  Code2, Cpu, Copy, Check, Download, Terminal, Trash2, 
  ChevronDown, ChevronUp, GitBranch, Play, Loader2,
  CheckCircle2, XCircle, AlertTriangle, Wifi, WifiOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
export interface EchoMessage {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
  timestamp: Date
}

export type ElfStatus = 'idle' | 'building' | 'ready' | 'error'

export interface PrereqStatus {
  wsl: boolean
  nasm: boolean
  ld: boolean
  install_hint?: string
}

interface CodePanelProps {
  cCode: string
  assemblyCode: string
  mermaidCode?: string
  echoMessages: EchoMessage[]
  onClearEcho: () => void
  className?: string
  // ELF / Ensamblado
  elfStatus?: ElfStatus
  nasmLog?: string
  ldLog?: string
  elfPath?: string
  prereqStatus?: PrereqStatus | null
  onExecute?: () => void
}

export function CodePanel({ 
  cCode, 
  assemblyCode, 
  mermaidCode,
  echoMessages,
  onClearEcho,
  className,
  elfStatus = 'idle',
  nasmLog,
  ldLog,
  elfPath,
  prereqStatus,
  onExecute,
}: CodePanelProps) {
  const [copiedTab, setCopiedTab] = useState<'c' | 'asm' | 'mermaid' | null>(null)
  const [isEchoExpanded, setIsEchoExpanded] = useState(true)
  const [echoHeight, setEchoHeight] = useState(160)
  const [showAsmLog, setShowAsmLog] = useState(false)
  
  // Download Dialog State
  const [isDownloadOpen, setIsDownloadOpen] = useState(false)
  const [downloadContent, setDownloadContent] = useState('')
  const [downloadFileName, setDownloadFileName] = useState('')

  const scrollRef = useRef<HTMLDivElement>(null)
  const echoResizeRef = useRef<{ startY: number; startHeight: number } | null>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current && isEchoExpanded) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [echoMessages, isEchoExpanded])

  // Handler de resize del panel Echo (borde superior arrastrable)
  const handleEchoResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    echoResizeRef.current = { startY: e.clientY, startHeight: echoHeight }

    const onMove = (ev: MouseEvent) => {
      if (!echoResizeRef.current) return
      const dy = echoResizeRef.current.startY - ev.clientY   // arrastrar hacia arriba = mas alto
      const newHeight = Math.min(480, Math.max(60, echoResizeRef.current.startHeight + dy))
      setEchoHeight(newHeight)
    }

    const onUp = () => {
      echoResizeRef.current = null
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [echoHeight])

  const handleCopy = async (code: string, tab: 'c' | 'asm' | 'mermaid') => {
    await navigator.clipboard.writeText(code)
    setCopiedTab(tab)
    setTimeout(() => setCopiedTab(null), 2000)
  }

  const promptDownload = (code: string, defaultFilename: string) => {
    setDownloadContent(code)
    setDownloadFileName(defaultFilename)
    setIsDownloadOpen(true)
  }

  const confirmDownload = () => {
    if (!downloadFileName.trim() || !downloadContent) return
    
    const blob = new Blob([downloadContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = downloadFileName.trim()
    a.click()
    URL.revokeObjectURL(url)
    
    setIsDownloadOpen(false)
  }

  const renderCodeWithLineNumbers = (code: string) => {
    const lines = code.split('\n')
    return (
      <div className="code-panel w-fit min-w-full">
        {lines.map((line, index) => (
          <div key={index} className="flex hover:bg-muted/30 transition-colors w-full">
            <span className="line-number text-xs shrink-0">{index + 1}</span>
            <pre className="flex-1 whitespace-pre pr-4">
              <code>{line}</code>
            </pre>
          </div>
        ))}
      </div>
    )
  }

  const getMessageColor = (type: EchoMessage['type']) => {
    switch (type) {
      case 'success': return 'text-success'
      case 'warning': return 'text-warning'
      case 'error': return 'text-destructive'
      default: return 'text-foreground'
    }
  }

  const getMessagePrefix = (type: EchoMessage['type']) => {
    switch (type) {
      case 'success': return '[OK]'
      case 'warning': return '[WARN]'
      case 'error': return '[ERROR]'
      default: return '[INFO]'
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    })
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn('flex flex-col h-full min-h-0 min-w-0 bg-panel border-l border-border animate-slide-in-right', className)}>
        {/* Code Tabs */}
        <Tabs defaultValue="c" className="flex flex-col flex-1 min-h-0">
          {/* Tab Headers */}
          <div className="flex items-center justify-between px-2 py-2 border-b border-border">
            <TabsList className="grid grid-cols-3 h-8">
              <TabsTrigger value="c" className="text-xs gap-1.5 px-3">
                <Code2 className="h-3.5 w-3.5" />
                C
              </TabsTrigger>
              <TabsTrigger value="asm" className="text-xs gap-1.5 px-3">
                <Cpu className="h-3.5 w-3.5" />
                ASM
              </TabsTrigger>
              <TabsTrigger value="mermaid" className="text-xs gap-1.5 px-3">
                <GitBranch className="h-3.5 w-3.5" />
                Mermaid
              </TabsTrigger>
            </TabsList>
          </div>

          {/* C Code Tab */}
          <TabsContent value="c" className="flex-1 m-0 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-code-bg">
              <span className="text-xs font-medium text-muted-foreground">main.c</span>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => handleCopy(cCode, 'c')}
                    >
                      {copiedTab === 'c' ? (
                        <Check className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copiar codigo</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => promptDownload(cCode, 'main.c')}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Descargar archivo</TooltipContent>
                </Tooltip>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar bg-code-bg p-3">
              {cCode ? (
                renderCodeWithLineNumbers(cCode)
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  El codigo C aparecera aqui
                </div>
              )}
            </div>
          </TabsContent>

          {/* Assembly Code Tab */}
          <TabsContent value="asm" className="flex-1 m-0 flex flex-col min-h-0">
            {/* Cabecera con badge ELF y controles */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-code-bg">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">main.asm</span>
                {/* Badge de estado ELF */}
                {elfStatus === 'building' && (
                  <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    Ensamblando...
                  </span>
                )}
                {elfStatus === 'ready' && (
                  <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    ELF listo
                  </span>
                )}
                {elfStatus === 'error' && (
                  <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive">
                    <XCircle className="h-2.5 w-2.5" />
                    Error ASM
                  </span>
                )}
                {/* Indicadores de prerequisitos */}
                {prereqStatus && (
                  <div className="flex items-center gap-1 ml-1">
                    <span
                      title={prereqStatus.wsl ? 'WSL2 disponible' : 'WSL2 no encontrado'}
                      className={cn(
                        'text-[9px] px-1 py-0.5 rounded font-mono',
                        prereqStatus.wsl ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      )}
                    >
                      WSL
                    </span>
                    <span
                      title={prereqStatus.nasm ? 'NASM disponible' : 'NASM no instalado'}
                      className={cn(
                        'text-[9px] px-1 py-0.5 rounded font-mono',
                        prereqStatus.nasm ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      )}
                    >
                      nasm
                    </span>
                    <span
                      title={prereqStatus.ld ? 'ld disponible' : 'ld (binutils) no instalado'}
                      className={cn(
                        'text-[9px] px-1 py-0.5 rounded font-mono',
                        prereqStatus.ld ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      )}
                    >
                      ld
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                {/* Botón copiar ASM */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => handleCopy(assemblyCode, 'asm')}
                    >
                      {copiedTab === 'asm' ? (
                        <Check className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copiar codigo</TooltipContent>
                </Tooltip>
                {/* Botón descargar ASM */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => promptDownload(assemblyCode, 'main.asm')}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Descargar archivo</TooltipContent>
                </Tooltip>
                {/* Botón toggle log NASM */}
                {(nasmLog || ldLog) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setShowAsmLog(v => !v)}
                      >
                        <Terminal className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Ver log de NASM/ld</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* Log de NASM + ld (colapsable) */}
            {showAsmLog && (nasmLog || ldLog) && (
              <div className="border-b border-border bg-[#0d1117] p-2 font-mono text-[11px] max-h-32 overflow-auto">
                {nasmLog && (
                  <div>
                    <span className="text-primary font-semibold">[NASM] </span>
                    <span className="text-[#e6edf3] whitespace-pre-wrap">{nasmLog}</span>
                  </div>
                )}
                {ldLog && (
                  <div className="mt-1">
                    <span className="text-primary font-semibold">[ld] </span>
                    <span className="text-[#e6edf3] whitespace-pre-wrap">{ldLog}</span>
                  </div>
                )}
              </div>
            )}

            {/* Hint de instalación si faltan prerequisitos */}
            {prereqStatus && (!prereqStatus.wsl || !prereqStatus.nasm || !prereqStatus.ld) && prereqStatus.install_hint && (
              <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-400 text-[11px]">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <pre className="whitespace-pre-wrap font-mono">{prereqStatus.install_hint}</pre>
              </div>
            )}

            <div className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar bg-code-bg p-3">
              {assemblyCode ? (
                renderCodeWithLineNumbers(assemblyCode)
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  El codigo Assembly aparecera aqui
                </div>
              )}
            </div>
          </TabsContent>

          {/* Mermaid Tab */}
          <TabsContent value="mermaid" className="flex-1 m-0 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-code-bg">
              <span className="text-xs font-medium text-muted-foreground">diagram.md</span>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCopy(mermaidCode ?? '', 'mermaid')}
                      disabled={!mermaidCode}
                    >
                      {copiedTab === 'mermaid' ? (
                        <Check className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copiar Mermaid</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => promptDownload(mermaidCode ?? '', 'diagram.md')}
                      disabled={!mermaidCode}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Descargar archivo</TooltipContent>
                </Tooltip>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar bg-code-bg p-3">
              {mermaidCode ? (
                renderCodeWithLineNumbers(mermaidCode)
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  El codigo Mermaid aparecera aqui
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Echo Panel - Below code tabs */}
        <div 
          className={cn(
            'flex flex-col bg-code-bg border-t border-border transition-all duration-150',
          )}
          style={{ height: isEchoExpanded ? echoHeight : 40 }}
        >
          {/* Echo Resize Handle — borde superior arrastrable */}
          {isEchoExpanded && (
            <div
              className="h-1.5 w-full cursor-ns-resize shrink-0 flex items-center justify-center group"
              onMouseDown={handleEchoResizeMouseDown}
              title="Arrastra para redimensionar"
            >
              <div className="w-8 h-0.5 rounded-full bg-border group-hover:bg-primary transition-colors" />
            </div>
          )}

          {/* Echo Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-panel shrink-0">
            <button 
              className="flex items-center gap-2 hover:text-primary transition-colors"
              onClick={() => setIsEchoExpanded(!isEchoExpanded)}
            >
              <Terminal className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium">Echo</span>
              <span className="text-xs text-muted-foreground">
                ({echoMessages.length})
              </span>
              {isEchoExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronUp className="h-3 w-3" />
              )}
            </button>

            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={onClearEcho}
                    disabled={echoMessages.length === 0}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Limpiar consola</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Echo Messages */}
          {isEchoExpanded && (
            <div 
              ref={scrollRef}
              className="flex-1 overflow-auto custom-scrollbar p-2 font-mono text-xs"
            >
              {echoMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  La salida de compilacion aparecera aqui
                </div>
              ) : (
                <div className="space-y-1">
                  {echoMessages.map(msg => (
                    <div 
                      key={msg.id} 
                      className={cn(
                        'flex gap-2 animate-fade-in-up',
                        getMessageColor(msg.type)
                      )}
                    >
                      <span className="text-muted-foreground shrink-0">
                        [{formatTime(msg.timestamp)}]
                      </span>
                      <span className="font-semibold shrink-0">
                        {getMessagePrefix(msg.type)}
                      </span>
                      <span className="break-all">{msg.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Download Dialog */}
      <Dialog open={isDownloadOpen} onOpenChange={setIsDownloadOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Descargar archivo</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="filename">Nombre del archivo</Label>
              <Input
                id="filename"
                value={downloadFileName}
                onChange={(e) => setDownloadFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmDownload()
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDownloadOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmDownload}>
              Descargar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
