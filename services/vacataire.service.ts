import { api } from './api'
import type { ContratModuleRequest } from './contrat.service'

export type StatutVacataire = 'ACTIF' | 'INACTIF' | 'SUSPENDU'
export type TypeVacataire = 'STANDARD' | 'PROFESSEUR_UNIVERSITAIRE'

export interface VacataireResponse {
  id: number
  nom: string
  prenom: string
  email: string
  specialite?: string
  specialites?: string[]
  niveaux?: string[]
  telephone?: string
  adresse?: string
  numeroCni?: string
  ninea?: string
  ipres?: string
  nomBanque?: string
  rib?: string
  typeVacataire?: TypeVacataire
  statut: StatutVacataire
  signatureUploaded: boolean
  modules?: string[]
  aContratActif?: boolean
  contratActifId?: number
  profilComplet?: boolean
}

export interface VacataireRequest {
  nom: string
  prenom: string
  email: string
  specialite?: string
  specialites?: string[]
  niveaux?: string[]
  modules?: string[]
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
  typeVacataire?: TypeVacataire
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

  uploadSignature: (id: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<VacataireResponse>(`/vacataires/${id}/signature`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data)
  },

  uploadMaSignature: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<VacataireResponse>('/vacataires/ma-signature', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data)
  },

  monDossier: () =>
    api.get<VacataireResponse>('/vacataires/mon-dossier').then((r) => r.data),

  mettreAJourCoordonnees: (data: Partial<VacataireRequest>) =>
    api.patch<VacataireResponse>('/vacataires/mes-coordonnees', data).then((r) => r.data),
}
