// ============================================
// COMPILADOR - Storage Module Index
// ============================================

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
  importProject
} from './project-storage'

export { TEMPLATES } from './templates'
export type { TemplateType, TemplateDefinition } from './templates'
