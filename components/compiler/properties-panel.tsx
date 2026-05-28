'use client'

// ============================================
// COMPILADOR - Properties Panel Component
// ============================================
// Panel dinamico que muestra controles segun el tipo de figura seleccionada

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { 
  Settings2, 
  Plus, 
  Trash2, 
  Circle,
  Square,
  Diamond,
  Hexagon,
  Layers,
  CornerDownLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  SHAPE_NAMES, 
  VARIABLE_TYPES, 
  PROCESS_TYPES, 
  CONDITIONAL_TYPES 
} from '@/lib/compiler/constants'
import type { 
  FlowchartNode, 
  FlowchartShapeType,
  StartEndData,
  ProcessData,
  DecisionData,
  InputOutputData,
  SubprocessData,
  ReturnData,
  FunctionParameter,
  VariableType,
  ProcessType,
  ConditionalType
} from '@/lib/compiler/types'

interface PropertiesPanelProps {
  selectedNode: FlowchartNode | null
  onNodeUpdate: (id: string, updates: Partial<FlowchartNode>) => void
  existingVariables: string[]
  existingFunctions: { name: string; parameters: FunctionParameter[] }[]
  className?: string
}

export function PropertiesPanel({
  selectedNode,
  onNodeUpdate,
  existingVariables,
  existingFunctions,
  className
}: PropertiesPanelProps) {
  if (!selectedNode) {
    return (
      <div className={cn('flex flex-col min-h-0 bg-panel border-t border-border', className)}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
          <Settings2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Propiedades</span>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-muted-foreground text-center">
            Selecciona una figura para ver sus propiedades
          </p>
        </div>
      </div>
    )
  }

  const getIcon = (type: FlowchartShapeType) => {
    const icons: Record<FlowchartShapeType, React.ReactNode> = {
      'start-end': <Circle className="h-4 w-4" />,
      'process': <Square className="h-4 w-4" />,
      'decision': <Diamond className="h-4 w-4" />,
      'input-output': <Hexagon className="h-4 w-4" />,
      'subprocess': <Layers className="h-4 w-4" />,
      'return': <CornerDownLeft className="h-4 w-4" />,
    }
    return icons[type]
  }

  return (
    <div className={cn('flex flex-col min-h-0 bg-panel border-t border-border', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <Settings2 className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Propiedades</span>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          {getIcon(selectedNode.type)}
          <span>{SHAPE_NAMES[selectedNode.type]}</span>
        </div>
      </div>

      {/* Content based on node type */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          {selectedNode.type === 'start-end' && (
            <StartEndProperties 
              node={selectedNode} 
              onUpdate={(updates) => onNodeUpdate(selectedNode.id, updates)} 
            />
          )}
          {selectedNode.type === 'process' && (
            <ProcessProperties 
              node={selectedNode} 
              onUpdate={(updates) => onNodeUpdate(selectedNode.id, updates)}
              existingVariables={existingVariables}
            />
          )}
          {selectedNode.type === 'decision' && (
            <DecisionProperties 
              node={selectedNode} 
              onUpdate={(updates) => onNodeUpdate(selectedNode.id, updates)} 
              existingVariables={existingVariables}
            />
          )}
          {selectedNode.type === 'input-output' && (
            <InputOutputProperties 
              node={selectedNode} 
              onUpdate={(updates) => onNodeUpdate(selectedNode.id, updates)} 
              existingVariables={existingVariables}
            />
          )}
          {selectedNode.type === 'subprocess' && (
            <SubprocessProperties 
              node={selectedNode} 
              onUpdate={(updates) => onNodeUpdate(selectedNode.id, updates)}
              existingFunctions={existingFunctions}
            />
          )}
          {selectedNode.type === 'return' && (
            <ReturnProperties 
              node={selectedNode} 
              onUpdate={(updates) => onNodeUpdate(selectedNode.id, updates)}
              existingVariables={existingVariables}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// ============================================
// Helper Component: Variable Suggestions
// ============================================
function VariableSuggestions({
  variables,
  onSelect,
  label = "Variables disponibles:"
}: {
  variables: string[]
  onSelect: (variable: string) => void
  label?: string
}) {
  if (variables.length === 0) return null
  return (
    <div className="space-y-1 mt-1">
      <span className="text-[11px] text-muted-foreground block">{label}</span>
      <div className="flex flex-wrap gap-1">
        {variables.map(v => (
          <Button
            key={v}
            variant="outline"
            size="sm"
            className="h-5 px-1.5 text-[10px] font-mono hover:bg-muted"
            type="button"
            onClick={() => onSelect(v)}
          >
            {v}
          </Button>
        ))}
      </div>
    </div>
  )
}

// ============================================
// Start/End Properties (Ovalo)
// ============================================
function StartEndProperties({ 
  node, 
  onUpdate 
}: { 
  node: FlowchartNode
  onUpdate: (updates: Partial<FlowchartNode>) => void 
}) {
  const data = (node.data as StartEndData) || { 
    functionName: 'main', 
    parameters: [], 
    isStart: true 
  }

  const updateData = (updates: Partial<StartEndData>) => {
    const newData = { ...data, ...updates }
    const content = newData.isStart 
      ? `${newData.functionName}(${newData.parameters.map(p => `${p.type} ${p.name}`).join(', ')})`
      : `fin ${newData.functionName}`
    onUpdate({ data: newData, content })
  }

  const addParameter = () => {
    const newParams = [...data.parameters, { name: `param${data.parameters.length + 1}`, type: 'int' as VariableType }]
    updateData({ parameters: newParams })
  }

  const removeParameter = (index: number) => {
    const newParams = data.parameters.filter((_, i) => i !== index)
    updateData({ parameters: newParams })
  }

  const updateParameter = (index: number, updates: Partial<FunctionParameter>) => {
    const newParams = data.parameters.map((p, i) => i === index ? { ...p, ...updates } : p)
    updateData({ parameters: newParams })
  }

  return (
    <div className="space-y-4">
      {/* Tipo: Inicio o Fin */}
      <div className="flex items-center justify-between">
        <Label className="text-sm">Es inicio de funcion</Label>
        <Switch 
          checked={data.isStart}
          onCheckedChange={(isStart) => updateData({ isStart })}
        />
      </div>

      <Separator />

      {/* Nombre de funcion */}
      <div className="space-y-2">
        <Label className="text-sm">Nombre de la funcion</Label>
        <Input
          value={data.functionName}
          onChange={(e) => updateData({ functionName: e.target.value })}
          placeholder="main"
          className="h-8 text-sm"
        />
      </div>

      {/* Parametros (solo si es inicio) */}
      {data.isStart && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Parametros</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2"
                onClick={addParameter}
              >
                <Plus className="h-3 w-3 mr-1" />
                Agregar
              </Button>
            </div>

            {data.parameters.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin parametros</p>
            ) : (
              <div className="space-y-2">
                {data.parameters.map((param, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Select 
                      value={param.type}
                      onValueChange={(type: VariableType) => updateParameter(index, { type })}
                    >
                      <SelectTrigger className="h-7 text-xs w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VARIABLE_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value} className="text-xs">
                            {t.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={param.name}
                      onChange={(e) => updateParameter(index, { name: e.target.value })}
                      className="h-7 text-xs flex-1"
                      placeholder="nombre"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => removeParameter(index)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ============================================
// Process Properties (Rectangulo)
// ============================================
function ProcessProperties({ 
  node, 
  onUpdate,
  existingVariables
}: { 
  node: FlowchartNode
  onUpdate: (updates: Partial<FlowchartNode>) => void
  existingVariables: string[]
}) {
  const data = (node.data as ProcessData) || { 
    processType: 'print', 
    printContent: '' 
  }

  const updateData = (updates: Partial<ProcessData>) => {
    const newData = { ...data, ...updates }
    let content = ''
    
    switch (newData.processType) {
      case 'print':
        content = `printf("${newData.printContent || ''}")`
        break
      case 'assign':
        content = `${newData.variableName || 'x'} = ${newData.value || '0'}`
        break
      case 'increment':
        content = `${newData.variableName || 'x'} += ${newData.incrementAmount || 1}`
        break
    }
    
    onUpdate({ data: newData, content })
  }

  return (
    <div className="space-y-4">
      {/* Tipo de proceso */}
      <div className="space-y-2">
        <Label className="text-sm">Tipo de proceso</Label>
        <Select 
          value={data.processType}
          onValueChange={(type: ProcessType) => updateData({ processType: type })}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROCESS_TYPES.map(t => (
              <SelectItem key={t.value} value={t.value} className="text-sm">
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Campos segun tipo */}
      {data.processType === 'print' && (
        <div className="space-y-2">
          <Label className="text-sm">Contenido a imprimir</Label>
          <Input
            value={data.printContent || ''}
            onChange={(e) => updateData({ printContent: e.target.value })}
            placeholder="Hola mundo o mi_variable"
            className="h-8 text-sm font-mono"
          />
          <p className="text-[10px] text-muted-foreground leading-normal">
            Tip: Escribe texto libre y usa llaves para interpolar variables, ej: <code>{'El valor es {x}'}</code>.
          </p>
          <VariableSuggestions
            variables={existingVariables}
            onSelect={(name) => {
              const current = data.printContent || ''
              updateData({ printContent: `${current}{${name}}` })
            }}
          />
        </div>
      )}

      {(data.processType === 'assign' || data.processType === 'increment') && (
        <>
          <div className="space-y-2">
            <Label className="text-sm">Variable</Label>
            {existingVariables.length > 0 ? (
              <Select 
                value={data.variableName || ''}
                onValueChange={(name) => updateData({ variableName: name })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Seleccionar variable" />
                </SelectTrigger>
                <SelectContent>
                  {existingVariables.map(v => (
                    <SelectItem key={v} value={v} className="text-sm">
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={data.variableName || ''}
                onChange={(e) => updateData({ variableName: e.target.value })}
                placeholder="nombre_variable"
                className="h-8 text-sm"
              />
            )}
          </div>

          {data.processType === 'assign' && (
            <div className="space-y-2">
              <Label className="text-sm">Valor</Label>
              <Input
                value={data.value || ''}
                onChange={(e) => updateData({ value: e.target.value })}
                placeholder="0"
                className="h-8 text-sm font-mono"
              />
              <VariableSuggestions
                variables={existingVariables}
                onSelect={(name) => {
                  const current = data.value || ''
                  const newValue = current ? `${current} ${name}` : name
                  updateData({ value: newValue })
                }}
              />
            </div>
          )}

          {data.processType === 'increment' && (
            <div className="space-y-2">
              <Label className="text-sm">Cantidad a incrementar</Label>
              <Input
                type="number"
                value={data.incrementAmount || 1}
                onChange={(e) => updateData({ incrementAmount: parseInt(e.target.value) || 1 })}
                className="h-8 text-sm"
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ============================================
// Decision Properties (Rombo)
// ============================================
function DecisionProperties({ 
  node, 
  onUpdate,
  existingVariables
}: { 
  node: FlowchartNode
  onUpdate: (updates: Partial<FlowchartNode>) => void 
  existingVariables: string[]
}) {
  const data = (node.data as DecisionData) || { 
    conditionalType: 'if', 
    condition: '',
    cases: [{ label: 'Si', condition: '' }]
  }

  const updateData = (updates: Partial<DecisionData>) => {
    const newData = { ...data, ...updates }
    const content = newData.conditionalType === 'for'
      ? `for (${newData.init || ''}; ${newData.condition || ''}; ${newData.increment || ''})`
      : newData.conditionalType === 'while' 
        ? `while (${newData.condition})`
        : `if (${newData.condition})`
    onUpdate({ data: newData, content })
  }

  const addCase = () => {
    if (data.cases.length >= 3) return // Limitar a 3 casos
    const newCases = [...data.cases, { label: `Caso ${data.cases.length + 1}`, condition: '' }]
    updateData({ cases: newCases })
  }

  const removeCase = (index: number) => {
    if (data.cases.length <= 1) return
    const newCases = data.cases.filter((_, i) => i !== index)
    updateData({ cases: newCases })
  }

  const updateCase = (index: number, updates: { label?: string; condition?: string }) => {
    const newCases = data.cases.map((c, i) => i === index ? { ...c, ...updates } : c)
    updateData({ cases: newCases })
  }

  return (
    <div className="space-y-4">
      {/* Tipo de condicional */}
      <div className="space-y-2">
        <Label className="text-sm">Tipo de condicional</Label>
        <Select 
          value={data.conditionalType}
          onValueChange={(type: ConditionalType) => updateData({ conditionalType: type })}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONDITIONAL_TYPES.map(t => (
              <SelectItem key={t.value} value={t.value} className="text-sm">
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Inputs para el Bucle FOR */}
      {data.conditionalType === 'for' && (
        <>
          <div className="space-y-2">
            <Label className="text-sm">Inicialización</Label>
            <Input
              value={data.init || ''}
              onChange={(e) => updateData({ init: e.target.value })}
              placeholder="int i = 0"
              className="h-8 text-sm font-mono"
            />
            <VariableSuggestions
              variables={existingVariables}
              onSelect={(name) => {
                const current = data.init || ''
                updateData({ init: current ? `${current} ${name}` : name })
              }}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm">Condición</Label>
            <Input
              value={data.condition || ''}
              onChange={(e) => updateData({ condition: e.target.value })}
              placeholder="i < 10"
              className="h-8 text-sm font-mono"
            />
            <VariableSuggestions
              variables={existingVariables}
              onSelect={(name) => {
                const current = data.condition || ''
                updateData({ condition: current ? `${current} ${name}` : name })
              }}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Incremento</Label>
            <Input
              value={data.increment || ''}
              onChange={(e) => updateData({ increment: e.target.value })}
              placeholder="i++"
              className="h-8 text-sm font-mono"
            />
            <VariableSuggestions
              variables={existingVariables}
              onSelect={(name) => {
                const current = data.increment || ''
                updateData({ increment: current ? `${current} ${name}` : name })
              }}
            />
          </div>
        </>
      )}

      {/* Condición principal para IF y WHILE */}
      {(data.conditionalType === 'if' || data.conditionalType === 'while') && (
        <div className="space-y-2">
          <Label className="text-sm">Condicion</Label>
          <Input
            value={data.condition}
            onChange={(e) => updateData({ condition: e.target.value })}
            placeholder="x > 0"
            className="h-8 text-sm font-mono"
          />
          <VariableSuggestions
            variables={existingVariables}
            onSelect={(name) => {
              const current = data.condition || ''
              updateData({ condition: current ? `${current} ${name}` : name })
            }}
          />
        </div>
      )}

      {/* Casos (solo para if, maximo 3) */}
      {data.conditionalType === 'if' && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Casos (max 3)</Label>
              {data.cases.length < 3 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2"
                  onClick={addCase}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Agregar
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {data.cases.map((caseItem, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={caseItem.label}
                    onChange={(e) => updateCase(index, { label: e.target.value })}
                    className="h-7 text-xs w-16"
                    placeholder="Etiqueta"
                  />
                  <Input
                    value={caseItem.condition}
                    onChange={(e) => updateCase(index, { condition: e.target.value })}
                    className="h-7 text-xs flex-1 font-mono"
                    placeholder="condicion"
                  />
                  {data.cases.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => removeCase(index)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================
// Input/Output Properties (Paralelogramo - Variables)
// ============================================
function InputOutputProperties({ 
  node, 
  onUpdate,
  existingVariables
}: { 
  node: FlowchartNode
  onUpdate: (updates: Partial<FlowchartNode>) => void 
  existingVariables: string[]
}) {
  const data = (node.data as InputOutputData) || { 
    mode: 'declare',
    variable: { name: '', type: 'int', value: '' } 
  }

  const mode = data.mode || 'declare'

  const updateData = (variableUpdates: Partial<InputOutputData['variable']>, newMode?: 'declare' | 'scanf') => {
    const activeMode = newMode !== undefined ? newMode : mode
    const newVariable = { ...data.variable, ...variableUpdates }
    
    let content = ''
    if (activeMode === 'scanf') {
      content = `scanf("${newVariable.name}")`
    } else {
      content = `${newVariable.type} ${newVariable.name} = ${newVariable.value}`
    }

    onUpdate({ 
      data: { 
        mode: activeMode,
        variable: newVariable 
      }, 
      content 
    })
  }

  return (
    <div className="space-y-4">
      {/* Selector de modo */}
      <div className="space-y-2">
        <Label className="text-sm">Modo de operación</Label>
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted/50 rounded-lg">
          <Button
            type="button"
            variant={mode === 'declare' ? 'secondary' : 'ghost'}
            className={cn(
              "h-7 text-[11px] font-medium px-2 py-1 rounded-md transition-all shadow-none",
              mode === 'declare' && "bg-background text-foreground shadow-sm hover:bg-background"
            )}
            onClick={() => updateData({}, 'declare')}
          >
            Declarar variable
          </Button>
          <Button
            type="button"
            variant={mode === 'scanf' ? 'secondary' : 'ghost'}
            className={cn(
              "h-7 text-[11px] font-medium px-2 py-1 rounded-md transition-all shadow-none",
              mode === 'scanf' && "bg-background text-foreground shadow-sm hover:bg-background"
            )}
            onClick={() => updateData({}, 'scanf')}
          >
            Leer por teclado
          </Button>
        </div>
      </div>

      <Separator />

      {/* Modo Declarar */}
      {mode === 'declare' && (
        <div className="space-y-4 pt-1">
          {/* Tipo */}
          <div className="space-y-2">
            <Label className="text-sm">Tipo de dato</Label>
            <Select 
              value={data.variable.type}
              onValueChange={(type: VariableType) => updateData({ type })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VARIABLE_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value} className="text-sm">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <Label className="text-sm">Nombre de variable</Label>
            <Input
              value={data.variable.name}
              onChange={(e) => updateData({ name: e.target.value })}
              placeholder="mi_variable"
              className="h-8 text-sm font-mono"
            />
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label className="text-sm">Valor inicial</Label>
            <Input
              value={data.variable.value}
              onChange={(e) => updateData({ value: e.target.value })}
              placeholder="0"
              className="h-8 text-sm font-mono"
            />
          </div>
        </div>
      )}

      {/* Modo Scanf */}
      {mode === 'scanf' && (
        <div className="space-y-4 pt-1">
          <p className="text-xs text-muted-foreground leading-normal">
            Lee datos desde el teclado por medio de <code>scanf()</code> y guárdalos en una variable declarada.
          </p>

          <div className="space-y-2">
            <Label className="text-sm">Variable de destino</Label>
            {existingVariables.length > 0 ? (
              <Select 
                value={data.variable.name || ''}
                onValueChange={(name) => updateData({ name })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Seleccionar variable" />
                </SelectTrigger>
                <SelectContent>
                  {existingVariables.map(v => (
                    <SelectItem key={v} value={v} className="text-sm">
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={data.variable.name}
                onChange={(e) => updateData({ name: e.target.value })}
                placeholder="edad"
                className="h-8 text-sm font-mono"
              />
            )}
          </div>

          <VariableSuggestions
            variables={existingVariables}
            onSelect={(name) => updateData({ name })}
            label="Variables disponibles:"
          />
        </div>
      )}
    </div>
  )
}

// ============================================
// Subprocess Properties (Subproceso - Llamada a funcion)
// ============================================
function SubprocessProperties({ 
  node, 
  onUpdate,
  existingFunctions
}: { 
  node: FlowchartNode
  onUpdate: (updates: Partial<FlowchartNode>) => void
  existingFunctions: { name: string; parameters: FunctionParameter[] }[]
}) {
  const data = (node.data as SubprocessData) || { 
    functionName: '', 
    arguments: [] 
  }

  const selectedFunction = existingFunctions.find(f => f.name === data.functionName)

  const updateData = (updates: Partial<SubprocessData>) => {
    const newData = { ...data, ...updates }
    const content = `${newData.functionName}(${newData.arguments.join(', ')})`
    onUpdate({ data: newData, content })
  }

  const handleFunctionChange = (name: string) => {
    const func = existingFunctions.find(f => f.name === name)
    const args = func ? func.parameters.map(() => '') : []
    updateData({ functionName: name, arguments: args })
  }

  const updateArgument = (index: number, value: string) => {
    const newArgs = [...data.arguments]
    newArgs[index] = value
    updateData({ arguments: newArgs })
  }

  return (
    <div className="space-y-4">
      {/* Seleccionar funcion */}
      <div className="space-y-2">
        <Label className="text-sm">Funcion a llamar</Label>
        {existingFunctions.length > 0 ? (
          <Select 
            value={data.functionName}
            onValueChange={handleFunctionChange}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Seleccionar funcion" />
            </SelectTrigger>
            <SelectContent>
              {existingFunctions.map(f => (
                <SelectItem key={f.name} value={f.name} className="text-sm">
                  {f.name}({f.parameters.map(p => p.type).join(', ')})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={data.functionName}
            onChange={(e) => updateData({ functionName: e.target.value })}
            placeholder="nombre_funcion"
            className="h-8 text-sm font-mono"
          />
        )}
      </div>

      {/* Argumentos */}
      {selectedFunction && selectedFunction.parameters.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <Label className="text-sm">Argumentos</Label>
            <div className="space-y-2">
              {selectedFunction.parameters.map((param, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16 truncate">
                    {param.name}:
                  </span>
                  <Input
                    value={data.arguments[index] || ''}
                    onChange={(e) => updateArgument(index, e.target.value)}
                    placeholder={param.type}
                    className="h-7 text-xs flex-1 font-mono"
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================
// Return Properties (Hexagono - Retorno)
// ============================================
function ReturnProperties({ 
  node, 
  onUpdate,
  existingVariables
}: { 
  node: FlowchartNode
  onUpdate: (updates: Partial<FlowchartNode>) => void
  existingVariables: string[]
}) {
  const data = (node.data as ReturnData) || { returnValue: '0' }

  const updateData = (updates: Partial<ReturnData>) => {
    const newData = { ...data, ...updates }
    onUpdate({ data: newData, content: `return ${newData.returnValue}` })
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Especifica el valor de retorno de la funcion.
      </p>

      {/* Valor de retorno */}
      <div className="space-y-2">
        <Label className="text-sm">Valor de retorno</Label>
        <Input
          value={data.returnValue}
          onChange={(e) => updateData({ returnValue: e.target.value })}
          placeholder="0"
          className="h-8 text-sm font-mono"
        />
      </div>

      {/* Sugerencias de variables */}
      {existingVariables.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Variables disponibles:</Label>
          <div className="flex flex-wrap gap-1">
            {existingVariables.map(v => (
              <Button
                key={v}
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => updateData({ returnValue: v })}
              >
                {v}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
