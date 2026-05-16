// ============================================
// COMPILADOR - Type Definitions
// ============================================

/**
 * Tipos de figuras disponibles en el diagrama de flujo
 * Siguiendo la simbologia estandar de diagramas de flujo
 */
export type FlowchartShapeType = 
  | 'start-end'      // Ovalo - Inicio/Fin de funcion
  | 'process'        // Rectangulo - Proceso (imprimir, asignar, incrementar)
  | 'decision'       // Rombo - Decision/Condicional (if/while)
  | 'input-output'   // Paralelogramo - Declaracion de variables
  | 'subprocess'     // Rectangulo doble - Llamada a funcion
  | 'return'         // Hexagono - Retorno de funcion

/**
 * Tipos de proceso disponibles
 */
export type ProcessType = 'print' | 'assign' | 'increment'

/**
 * Tipos de condicional
 */
export type ConditionalType = 'if' | 'while'

/**
 * Tipo de variable
 */
export type VariableType = 'int' | 'float' | 'char' | 'string' | 'bool'

/**
 * Definicion de una variable
 */
export interface VariableDefinition {
  name: string
  type: VariableType
  value: string
}

/**
 * Definicion de un parametro de funcion
 */
export interface FunctionParameter {
  name: string
  type: VariableType
}

/**
 * Datos especificos para cada tipo de figura
 */
export interface StartEndData {
  functionName: string
  parameters: FunctionParameter[]
  isStart: boolean
}

export interface ProcessData {
  processType: ProcessType
  variableName?: string
  value?: string
  printContent?: string
  incrementAmount?: number
}

export interface DecisionData {
  conditionalType: ConditionalType
  condition: string
  cases: { label: string; condition: string }[] // Max 3 para if
}

export interface InputOutputData {
  variable: VariableDefinition
}

export interface SubprocessData {
  functionName: string
  arguments: string[]
}

export interface ReturnData {
  returnValue: string
}

export type ShapeData = 
  | StartEndData 
  | ProcessData 
  | DecisionData 
  | InputOutputData 
  | SubprocessData 
  | ReturnData

/**
 * Representa una figura en el canvas
 */
export interface FlowchartNode {
  id: string
  type: FlowchartShapeType
  position: {
    x: number
    y: number
  }
  size: {
    width: number
    height: number
  }
  content: string
  label?: string
  connections: string[]
  data?: ShapeData
}

/**
 * Lado de un nodo donde se ancla un handle de conexion
 */
export type HandleSide = 'n' | 's' | 'e' | 'w'

/**
 * Conexion entre dos nodos
 */
export interface FlowchartConnection {
  id: string
  sourceId: string
  targetId: string
  label?: string
  type: 'default' | 'yes' | 'no' | 'case1' | 'case2' | 'case3'
  sourceHandle?: HandleSide
  targetHandle?: HandleSide
}

/**
 * Estado completo del diagrama
 */
export interface FlowchartState {
  nodes: FlowchartNode[]
  connections: FlowchartConnection[]
  selectedNodeId: string | null
  zoom: number
  pan: { x: number; y: number }
}

/**
 * Proyecto guardado
 */
export interface Project {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  flowchartState: FlowchartState
}

/**
 * Resultado de la compilacion
 */
export interface CompilationResult {
  success: boolean
  mermaidCode: string
  cCode: string
  assemblyCode: string
  errors: CompilationError[]
  warnings: CompilationWarning[]
  output: string
}

export interface CompilationError {
  nodeId: string
  message: string
  line?: number
  column?: number
}

export interface CompilationWarning {
  nodeId: string
  message: string
  line?: number
}

/**
 * Resultado de validacion Mermaid
 */
export interface MermaidValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Configuracion del compilador
 */
export interface CompilerConfig {
  targetArchitecture: 'x86' | 'x86_64' | 'arm'
  optimizationLevel: 0 | 1 | 2 | 3
  debugSymbols: boolean
  strictMode: boolean
}

/**
 * Definicion de una figura para la barra lateral
 */
export interface ShapeDefinition {
  type: FlowchartShapeType
  name: string
  description: string
  icon: React.ReactNode
  defaultSize: { width: number; height: number }
  defaultContent: string
}
