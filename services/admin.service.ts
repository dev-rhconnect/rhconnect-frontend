import { api } from './api'

export type Role = 'ADMIN' | 'RESPONSABLE_PROGRAMME' | 'ATTACHE_CLASSE' | 'RELAIS_FINANCE' | 'VACATAIRE'

export const roleLabel: Record<Role, string> = {
  ADMIN: 'Admin IT',
  RESPONSABLE_PROGRAMME: 'Resp. Programme',
  ATTACHE_CLASSE: 'Attaché de Classe',
  RELAIS_FINANCE: 'Relais Finance',
  VACATAIRE: 'Vacataire',
}

export interface UtilisateurResponse {
  id: number
  prenom: string
  nom: string
  email: string
  role: Role
  actif: boolean
  dateCreation: string
}

export interface RegisterRequest {
  prenom: string
  nom: string
  email: string
  role: Role
  motDePasseTemporaire?: string
}

export interface AuditLog {
  id: number
  utilisateur: { id: number; prenom: string; nom: string; email: string }
  action: string
  ressource: string
  ressourceId?: number
  detail: string
  dateAction: string
}

export const adminService = {
  listerUtilisateurs: () =>
    api.get<UtilisateurResponse[]>('/admin/utilisateurs').then((r) => r.data),

  creerCompte: (data: RegisterRequest) =>
    api.post<UtilisateurResponse>('/admin/utilisateurs', data).then((r) => r.data),

  activer: (id: number) =>
    api.patch<void>(`/admin/utilisateurs/${id}/activer`).then((r) => r.data),

  desactiver: (id: number) =>
    api.patch<void>(`/admin/utilisateurs/${id}/desactiver`).then((r) => r.data),

  changerRole: (id: number, role: Role) =>
    api.patch<UtilisateurResponse>(`/admin/utilisateurs/${id}/role`, null, { params: { role } }).then((r) => r.data),

  listerLogs: () =>
    api.get<AuditLog[]>('/admin/logs').then((r) => r.data),
}
