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

export interface CreateUserRequest {
  prenom: string
  nom: string
  email: string
  role: string
  motDePasseTemporaire?: string
}

export const adminService = {
  listerUtilisateurs: () =>
    api.get<UtilisateurResponse[]>('/admin/utilisateurs').then((r) => r.data),

  creerCompte: (data: CreateUserRequest) =>
    api.post<UtilisateurResponse>('/admin/utilisateurs', data).then((r) => r.data),

  activer: (id: number) =>
    api.patch(`/admin/utilisateurs/${id}/activer`).then((r) => r.data),

  desactiver: (id: number) =>
    api.patch(`/admin/utilisateurs/${id}/desactiver`).then((r) => r.data),

  reinitialiserMdp: (id: number, nouveauMdp?: string) =>
    api.patch(`/admin/utilisateurs/${id}/reinitialiser-mdp`, null, {
      params: nouveauMdp?.trim() ? { nouveauMdp } : undefined,
    }).then((r) => r.data),

  logs: () =>
    api.get<AuditLog[]>('/admin/logs').then((r) => r.data),
}
