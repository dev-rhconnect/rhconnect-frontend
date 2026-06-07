import { api } from './api'

export type StatutVacataire = 'ACTIF' | 'INACTIF' | 'SUSPENDU'

export interface VacataireResponse {
  id: number
  nom: string
  prenom: string
  email: string
  specialite: string
  telephone?: string
  adresse?: string
  numeroCni?: string
  ninea?: string
  ipres?: string
  nomBanque?: string
  rib?: string
  statut: StatutVacataire
  signatureUploaded: boolean
}

export interface VacataireRequest {
  nom: string
  prenom: string
  email: string
  specialite: string
  telephone?: string
  adresse?: string
  situationMatrimoniale?: string
  numeroCni?: string
  ninea?: string
  ipres?: string
  nomBanque?: string
  codeBanque?: string
  codeGuichet?: string
  numeroCompte?: string
  rib?: string
}

export const vacataireService = {
  listerTous: () =>
    api.get<VacataireResponse[]>('/vacataires').then((r) => r.data),

  trouverParId: (id: number) =>
    api.get<VacataireResponse>(`/vacataires/${id}`).then((r) => r.data),

  creer: (data: VacataireRequest) =>
    api.post<VacataireResponse>('/vacataires', data).then((r) => r.data),

  modifier: (id: number, data: VacataireRequest) =>
    api.put<VacataireResponse>(`/vacataires/${id}`, data).then((r) => r.data),

  archiver: (id: number) =>
    api.patch<void>(`/vacataires/${id}/archiver`).then((r) => r.data),
}
