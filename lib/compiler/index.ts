// ============================================
// COMPILADOR - Main Compiler Module
// ============================================
// Punto de entrada principal para la funcionalidad del compilador

// Types
export * from './types'

// Constants
export * from './constants'

// Translator modules (legacy, mantenidos como stubs; la pipeline real vive en /api/compile)
export * from './translator'

// API client (puente UI -> /api/compile -> Python)
export { compileFlowchart } from './api-client'
export type { CompileRequest, CompileResponse } from './api-client'

// Connection geometry helpers
export {
  getHandlePosition,
  nearestHandle,
  buildOrthogonalPath,
  buildProvisionalPath,
  branchColor,
  branchLabelDefault,
  usedBranches,
} from './connection-utils'
export type { Point } from './connection-utils'

// Mermaid generator
export { generateMermaidCode, validateMermaidDiagram, getValidNodes, parseMermaidToState } from './mermaid'

// Storage
export {
  getAllProjects,
  getProjectById,
  createProject,
  saveProject,
  updateProjectFlowchart,
  deleteProject,
  renameProject,
  getCurrentProjectId,
  setCurrentProjectId,
  saveMermaidCode,
  exportProject,
  importProject,
  TEMPLATES
} from './storage'

export type { TemplateType, TemplateDefinition } from './storage'
