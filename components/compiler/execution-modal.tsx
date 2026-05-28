'use client'

// ============================================
// COMPILADOR - Execution Modal
// ============================================
// Modal tipo terminal que muestra el output de ejecutar
// el binario ELF en WSL2. Simula una consola de Linux.

import { useEffect, useRef, useState } from 'react'
import { Terminal, X, Play, Loader2, CheckCircle2, XCircle, Clock, Keyboard, Sliders, Edit3 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export type ExecStatus = 'idle' | 'running' | 'success' | 'error'

export interface ExecutionResult {
  ok: boolean
  exitCode: number
  stdout: string
  stderr: string
  elapsed_ms: number
  errors: string[]
}

interface ExecutionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectName: string
  elfPath: string           // ruta relativa al ELF
  onRun: (stdin: string) => Promise<ExecutionResult | null>
  status: ExecStatus
  result: ExecutionResult | null
  inputVariables?: { id: string; name: string; type: string }[]
}

export function ExecutionModal({
  open,
  onOpenChange,
  projectName,
  elfPath,
  onRun,
  status,
  result,
  inputVariables = [],
}: ExecutionModalProps) {
  const outputRef = useRef<HTMLPreElement>(null)
  const [hasRun, setHasRun] = useState(false)
  const [stdin, setStdin] = useState('')
  
  // Custom inputs state
  const [inputValues, setInputValues] = useState<Record<string, string>>({})
  const [isRawMode, setIsRawMode] = useState(false)

  // Auto-scroll al final cuando llega nuevo output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [result])

  // Resetear al abrir
  useEffect(() => {
    if (open) {
      setHasRun(false)
      setInputValues({})
      setStdin('')
      setIsRawMode(false)
    }
  }, [open])

  // Actualizar stdin automáticamente a partir de inputValues en modo guiado
  useEffect(() => {
    if (inputVariables && inputVariables.length > 0 && !isRawMode) {
      const values = inputVariables.map(v => inputValues[v.id] || '')
      setStdin(values.join('\n'))
    }
  }, [inputValues, inputVariables, isRawMode])

  const handleVarChange = (id: string, value: string) => {
    setInputValues(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handleRun = async () => {
    setHasRun(true)
    await onRun(stdin)
  }

  const statusIcon = () => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-400" />
      default:
        return <Terminal className="h-4 w-4 text-muted-foreground" />
    }
  }

  const statusLabel = () => {
    switch (status) {
      case 'running': return 'Ejecutando...'
      case 'success': return `Proceso terminado (código ${result?.exitCode ?? 0})`
      case 'error':   return `Error (código ${result?.exitCode ?? -1})`
      default:        return 'Listo para ejecutar'
    }
  }

  // Construir el texto del terminal
  const buildOutput = (): string => {
    if (!hasRun && status === 'idle') {
      let welcome = `# Ejecutando: ${projectName}\n# ELF: ${elfPath}\n`
      if (inputVariables.length > 0) {
        welcome += `# Nota: Este programa requiere datos de entrada (scanf) para ${inputVariables.length} ${inputVariables.length === 1 ? 'variable' : 'variables'}.\n# Completa el formulario inferior antes de presionar "Ejecutar".\n`
      } else {
        welcome += `# Presiona "Ejecutar" para correr el programa en WSL2\n`
      }
      return welcome
    }
    if (status === 'running') {
      return `$ wsl ${elfPath.replace(/\\/g, '/')}\n\n⏳ Ejecutando...`
    }
    if (!result) return ''

    const lines: string[] = []
    lines.push(`$ wsl ${elfPath.replace(/\\/g, '/')}`)
    if (stdin.trim()) {
      lines.push(`# Entrada estándar provista (stdin):\n${stdin.split('\n').map(l => `> ${l}`).join('\n')}`)
    }
    lines.push('')

    if (result.stdout) {
      lines.push(result.stdout)
    }
    if (result.stderr) {
      lines.push('--- stderr ---')
      lines.push(result.stderr)
    }
    if (result.errors.length > 0) {
      lines.push('--- errors ---')
      lines.push(result.errors.join('\n'))
    }
    if (!result.stdout && !result.stderr && result.errors.length === 0) {
      lines.push('(sin salida)')
    }
    lines.push('')
    lines.push(`[Proceso terminado con código ${result.exitCode} en ${result.elapsed_ms}ms]`)
    return lines.join('\n')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl w-full p-0 gap-0 bg-[#0d1117] border border-[#30363d] text-[#e6edf3] font-mono"
        style={{ borderRadius: '10px', overflow: 'hidden' }}
        aria-describedby={undefined}
      >
        {/* Barra de título estilo macOS/terminal */}
        <DialogHeader className="px-4 py-3 border-b border-[#30363d] bg-[#161b22]">
          <div className="flex items-center gap-3">
            {/* Traffic lights decorativos */}
            <div className="flex gap-1.5">
              <button
                className="w-3 h-3 rounded-full bg-[#ff5f57] hover:opacity-80 transition-opacity"
                onClick={() => onOpenChange(false)}
                aria-label="Cerrar"
              />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
            <DialogTitle className="flex items-center gap-2 text-xs text-[#8b949e] font-normal flex-1">
              <Terminal className="h-3.5 w-3.5" />
              <span className="text-[#e6edf3] font-semibold">{projectName}</span>
              <span>— WSL2 Terminal</span>
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Output terminal */}
        <pre
          ref={outputRef}
          className={cn(
            'flex-1 p-4 text-[13px] leading-relaxed overflow-auto',
            'min-h-[260px] max-h-[360px]',
            'whitespace-pre-wrap break-words',
            status === 'error' || (result && result.exitCode !== 0)
              ? 'text-[#f85149]'
              : 'text-[#e6edf3]',
          )}
          style={{ background: '#0d1117' }}
        >
          {buildOutput()}
          {/* Cursor parpadeante cuando está ejecutando */}
          {status === 'running' && (
            <span className="inline-block w-2 h-4 bg-[#58a6ff] animate-pulse ml-1 align-middle" />
          )}
        </pre>

        {/* Input panel para stdin */}
        <div className="px-5 py-4 border-t border-[#30363d] bg-[#161b22]/40 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-[#8b949e] flex items-center gap-2 uppercase tracking-wider">
              <Keyboard className="h-4 w-4 text-emerald-450" />
              {inputVariables.length > 0 && !isRawMode ? 'Datos de Entrada del Diagrama (Scanf)' : 'Entrada Estándar Manual (Stdin)'}
            </label>
            {inputVariables.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsRawMode(!isRawMode)}
                className="text-[10px] text-primary hover:text-white h-6 hover:bg-zinc-800 border border-zinc-800/20 px-2 cursor-pointer font-sans"
              >
                {isRawMode ? (
                  <>
                    <Sliders className="h-3 w-3 mr-1" />
                    Modo Formulario
                  </>
                ) : (
                  <>
                    <Edit3 className="h-3 w-3 mr-1" />
                    Modo Consola Libre
                  </>
                )}
              </Button>
            )}
          </div>

          {inputVariables.length > 0 && !isRawMode ? (
            /* Modo Guiado por Formulario */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-zinc-950/40 p-4 border border-zinc-850 rounded-lg">
              {inputVariables.map((v) => (
                <div key={v.id} className="flex flex-col gap-1.5">
                  <Label htmlFor={`var-${v.id}`} className="text-[11px] font-medium text-zinc-400 font-sans">
                    Variable <span className="font-bold text-primary font-mono">{v.name}</span> <span className="text-[10px] text-zinc-500 font-mono">({v.type})</span>
                  </Label>
                  <Input
                    id={`var-${v.id}`}
                    type="text"
                    placeholder={`Ingrese ${v.type}...`}
                    value={inputValues[v.id] || ''}
                    onChange={(e) => handleVarChange(v.id, e.target.value)}
                    disabled={status === 'running'}
                    className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] font-mono h-8 text-xs focus-visible:ring-1 focus-visible:ring-emerald-500 rounded focus-visible:ring-offset-0"
                  />
                </div>
              ))}
            </div>
          ) : (
            /* Modo Consola Libre */
            <div className="flex flex-col gap-2">
              <Input
                type="text"
                placeholder={inputVariables.length > 0 ? "Ej: 5 10 20 (separa valores con espacio o salto de línea)" : "Escribe aquí los datos a enviar por teclado (stdin)"}
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                disabled={status === 'running'}
                className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] font-mono h-8 text-xs focus-visible:ring-1 focus-visible:ring-emerald-500 rounded focus-visible:ring-offset-0 animate-none"
              />
            </div>
          )}
        </div>

        {/* Barra de estado inferior */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#30363d] bg-[#161b22]">
          <div className="flex items-center gap-2 text-xs text-[#8b949e]">
            {statusIcon()}
            <span>{statusLabel()}</span>
            {result && status !== 'running' && (
              <span className="flex items-center gap-1 ml-2 text-[#8b949e]">
                <Clock className="h-3 w-3" />
                {result.elapsed_ms}ms
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] h-7 px-3"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Cerrar
            </Button>
            <Button
              size="sm"
              className={cn(
                'text-xs h-7 px-3 gap-1.5',
                status === 'running'
                  ? 'bg-[#21262d] text-[#8b949e] cursor-not-allowed'
                  : 'bg-[#238636] hover:bg-[#2ea043] text-white border border-[#2ea043]',
              )}
              onClick={handleRun}
              disabled={status === 'running'}
            >
              {status === 'running' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              {status === 'running' ? 'Ejecutando...' : hasRun ? 'Volver a ejecutar' : 'Ejecutar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
