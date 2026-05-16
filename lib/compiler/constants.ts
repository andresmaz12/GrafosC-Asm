// ============================================
// COMPILADOR - Constants and Configuration
// ============================================

import type { FlowchartShapeType } from './types'

/**
 * Configuracion de tamanos por defecto para cada tipo de figura
 */
export const DEFAULT_SHAPE_SIZES: Record<FlowchartShapeType, { width: number; height: number }> = {
  'start-end': { width: 140, height: 60 },
  'process': { width: 160, height: 80 },
  'decision': { width: 140, height: 140 },
  'input-output': { width: 160, height: 70 },
  'subprocess': { width: 180, height: 90 },
  'return': { width: 140, height: 70 },
}

/**
 * Colores semanticos para cada tipo de figura
 */
export const SHAPE_COLORS: Record<FlowchartShapeType, { bg: string; border: string; text: string }> = {
  'start-end': { 
    bg: 'bg-success/20', 
    border: 'border-success', 
    text: 'text-success' 
  },
  'process': { 
    bg: 'bg-primary/20', 
    border: 'border-primary', 
    text: 'text-primary' 
  },
  'decision': { 
    bg: 'bg-warning/20', 
    border: 'border-warning', 
    text: 'text-warning' 
  },
  'input-output': { 
    bg: 'bg-info/20', 
    border: 'border-info', 
    text: 'text-info' 
  },
  'subprocess': { 
    bg: 'bg-accent/20', 
    border: 'border-accent', 
    text: 'text-accent-foreground' 
  },
  'return': { 
    bg: 'bg-chart-3/20', 
    border: 'border-chart-3', 
    text: 'text-chart-3' 
  },
}

/**
 * Nombres en espanol para las figuras
 */
export const SHAPE_NAMES: Record<FlowchartShapeType, string> = {
  'start-end': 'Inicio/Fin',
  'process': 'Proceso',
  'decision': 'Condicional',
  'input-output': 'Variable',
  'subprocess': 'Subproceso',
  'return': 'Retorno',
}

/**
 * Descripciones de las figuras
 */
export const SHAPE_DESCRIPTIONS: Record<FlowchartShapeType, string> = {
  'start-end': 'Inicio o fin de una funcion',
  'process': 'Imprimir, asignar o incrementar',
  'decision': 'Condicional if o bucle while',
  'input-output': 'Declaracion de variables (tipo y valor)',
  'subprocess': 'Llamada a otra funcion',
  'return': 'Retorno de datos de la funcion',
}

/**
 * Contenido por defecto para cada tipo de figura
 */
export const DEFAULT_CONTENT: Record<FlowchartShapeType, string> = {
  'start-end': 'main()',
  'process': 'printf("Hola")',
  'decision': 'x > 0',
  'input-output': 'int x = 0',
  'subprocess': 'funcion()',
  'return': 'return 0',
}

/**
 * Configuracion del canvas
 */
export const CANVAS_CONFIG = {
  minZoom: 0.25,
  maxZoom: 2,
  zoomStep: 0.1,
  gridSize: 20,
  snapToGrid: true,
}

/**
 * Tipos de variables disponibles
 */
export const VARIABLE_TYPES = [
  { value: 'int', label: 'Entero (int)' },
  { value: 'float', label: 'Decimal (float)' },
  { value: 'char', label: 'Caracter (char)' },
  { value: 'string', label: 'Cadena (string)' },
  { value: 'bool', label: 'Booleano (bool)' },
] as const

/**
 * Tipos de proceso
 */
export const PROCESS_TYPES = [
  { value: 'print', label: 'Imprimir (printf)' },
  { value: 'assign', label: 'Asignar valor' },
  { value: 'increment', label: 'Incrementar variable' },
] as const

/**
 * Tipos de condicional
 */
export const CONDITIONAL_TYPES = [
  { value: 'if', label: 'Condicional (if)' },
  { value: 'while', label: 'Bucle (while)' },
] as const

/**
 * Atajos de teclado
 */
export const KEYBOARD_SHORTCUTS = {
  delete: ['Delete', 'Backspace'],
  copy: ['ctrl+c', 'cmd+c'],
  paste: ['ctrl+v', 'cmd+v'],
  undo: ['ctrl+z', 'cmd+z'],
  redo: ['ctrl+shift+z', 'cmd+shift+z'],
  compile: ['ctrl+Enter', 'cmd+Enter'],
  save: ['ctrl+s', 'cmd+s'],
  zoomIn: ['ctrl+=', 'cmd+='],
  zoomOut: ['ctrl+-', 'cmd+-'],
  zoomReset: ['ctrl+0', 'cmd+0'],
}

/**
 * Storage keys para localStorage
 */
export const STORAGE_KEYS = {
  projects: 'compilador_projects',
  currentProject: 'compilador_current_project',
  settings: 'compilador_settings',
}
