// ============================================
// COMPILADOR - Project Storage Manager
// ============================================

import type { Project, FlowchartState } from '../types'
import { STORAGE_KEYS } from '../constants'
import { TEMPLATES } from './templates'
import type { TemplateType } from './templates'

const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36)

/**
 * Obtiene todos los proyectos guardados
 */
export function getAllProjects(): Project[] {
  if (typeof window === 'undefined') return []
  
  try {
    const data = localStorage.getItem(STORAGE_KEYS.projects)
    let projects: Project[] = data ? JSON.parse(data) : []
    
    // Seed de nuevos proyectos de prueba en el historial
    if (!localStorage.getItem('seeded_default_test_projects_v2')) {
      const now = new Date().toISOString()
      const seedTemplates: TemplateType[] = ['collatz', 'fibonacci', 'factorial_interactive', 'auxiliary']
      const seedNames: Record<TemplateType, string> = {
        collatz: 'Conjetura de Collatz',
        fibonacci: 'Generador de Fibonacci',
        factorial_interactive: 'Factorial Interactivo con Entrada',
        auxiliary: 'Funciones Auxiliares',
        empty: '', hello: '', loop: '', factorial: ''
      }
      
      const seedProjects: Project[] = seedTemplates.map((type) => {
        const template = TEMPLATES[type]
        return {
          id: `seed-${type}-${Math.random().toString(36).substring(2, 7)}`,
          name: seedNames[type],
          createdAt: now,
          updatedAt: now,
          flowchartState: JSON.parse(JSON.stringify(template.state)) as FlowchartState
        }
      })
      
      // Combinar los nuevos proyectos semilla al inicio del historial
      projects = [...seedProjects, ...projects]
      localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(projects))
      localStorage.setItem('seeded_default_test_projects_v2', 'true')
    }
    
    return projects
  } catch {
    return []
  }
}

/**
 * Obtiene un proyecto por su ID
 */
export function getProjectById(id: string): Project | null {
  const projects = getAllProjects()
  return projects.find(p => p.id === id) || null
}

/**
 * Crea un nuevo proyecto (opcionalmente basado en una plantilla)
 */
export function createProject(name: string, templateType: TemplateType = 'empty'): Project {
  const now = new Date().toISOString()
  
  // Buscar plantilla correspondiente, por defecto vacía
  const template = TEMPLATES[templateType] || TEMPLATES['empty']
  
  // Clonar el estado de la plantilla de forma segura para evitar mutar la referencia original
  const flowchartState = JSON.parse(JSON.stringify(template.state)) as FlowchartState

  const newProject: Project = {
    id: generateId(),
    name,
    createdAt: now,
    updatedAt: now,
    flowchartState
  }

  const projects = getAllProjects()
  projects.push(newProject)
  saveAllProjects(projects)
  setCurrentProjectId(newProject.id)

  return newProject
}

/**
 * Guarda/actualiza un proyecto
 */
export function saveProject(project: Project): void {
  const projects = getAllProjects()
  const index = projects.findIndex(p => p.id === project.id)
  
  const updatedProject = {
    ...project,
    updatedAt: new Date().toISOString()
  }

  if (index >= 0) {
    projects[index] = updatedProject
  } else {
    projects.push(updatedProject)
  }

  saveAllProjects(projects)
}

/**
 * Actualiza el estado del diagrama de un proyecto
 */
export function updateProjectFlowchart(projectId: string, state: FlowchartState): void {
  const project = getProjectById(projectId)
  if (!project) return

  saveProject({
    ...project,
    flowchartState: state
  })
}

/**
 * Elimina un proyecto
 */
export function deleteProject(id: string): void {
  const projects = getAllProjects().filter(p => p.id !== id)
  saveAllProjects(projects)

  // Si era el proyecto actual, limpiar
  if (getCurrentProjectId() === id) {
    localStorage.removeItem(STORAGE_KEYS.currentProject)
  }
}

/**
 * Renombra un proyecto
 */
export function renameProject(id: string, newName: string): void {
  const project = getProjectById(id)
  if (!project) return

  saveProject({
    ...project,
    name: newName
  })
}

/**
 * Guarda todos los proyectos
 */
function saveAllProjects(projects: Project[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(projects))
}

/**
 * Obtiene el ID del proyecto actual
 */
export function getCurrentProjectId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEYS.currentProject)
}

/**
 * Establece el proyecto actual
 */
export function setCurrentProjectId(id: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.currentProject, id)
}

/**
 * Guarda el codigo Mermaid generado en carpeta MERMAID
 * Nota: En navegador esto descarga el archivo
 */
export function saveMermaidCode(code: string, projectName: string): void {
  const blob = new Blob([code], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `MERMAID/${projectName.replace(/[^a-zA-Z0-9]/g, '_')}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Exporta un proyecto como JSON
 */
export function exportProject(project: Project): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Importa un proyecto desde JSON
 */
export function importProject(file: File): Promise<Project> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const project = JSON.parse(e.target?.result as string) as Project
        // Generar nuevo ID para evitar conflictos
        project.id = generateId()
        project.createdAt = new Date().toISOString()
        project.updatedAt = new Date().toISOString()
        
        const projects = getAllProjects()
        projects.push(project)
        saveAllProjects(projects)
        
        resolve(project)
      } catch (error) {
        reject(new Error('Archivo de proyecto invalido'))
      }
    }
    reader.onerror = () => reject(new Error('Error al leer el archivo'))
    reader.readAsText(file)
  })
}
