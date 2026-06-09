import { api } from './api'

export interface AuditLog {
  id: number
  utilisateurEmail: string
  action: string
  entite: string
  entiteId?: number
  details?: string
  dateAction: string
}

export interface UtilisateurResponse {
  id: number
  nom: string
  prenom: string
  email: string
  role: string
  actif: boolean
  premierConnexion: boolean
}

export const adminService = {
  listerUtilisateurs: () =>
    api.get<UtilisateurResponse[]>('/admin/utilisateurs').then((r) => r.data),

  logs: () =>
    api.get<AuditLog[]>('/admin/logs').then((r) => r.data),
}
