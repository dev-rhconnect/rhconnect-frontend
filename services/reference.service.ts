import { api } from './api'

export type NiveauRef = 'LICENCE' | 'MASTER'

export interface ClasseRef {
  id: number
  nom: string
  niveau: NiveauRef
  filiere: string
  actif: boolean
}

export interface ModuleRef {
  id: number
  nom: string
  actif: boolean
}

export const referenceService = {
  getClasses: (niveau?: NiveauRef) =>
    api.get<ClasseRef[]>('/classes', { params: niveau ? { niveau } : {} }).then((r) => r.data),

  getModules: () =>
    api.get<ModuleRef[]>('/modules-ref').then((r) => r.data),

  creerClasse: (data: { nom: string; niveau: NiveauRef; filiere?: string }) =>
    api.post<ClasseRef>('/classes', data).then((r) => r.data),

  creerModule: (data: { nom: string }) =>
    api.post<ModuleRef>('/modules-ref', data).then((r) => r.data),
}
