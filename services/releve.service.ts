import { api } from './api'
import type { LigneHeureResponse } from './intervention.service'

export type StatutReleve = 'EN_COURS' | 'SOUMIS' | 'VALIDE' | 'REJETE'

export interface FeuilleHeureResponse {
  id: number
  contratId: number
  nomVacataire: string
  module: string
  classe: string
  periode: string
  totalHeuresValidees: number
  statut: StatutReleve
  dateSoumission?: string
  dateValidation?: string
  lignes: LigneHeureResponse[]
}

export interface FeuilleHeureRequest {
  contratId: number
  periode: string
}

export const releveService = {
  /** Sprint 2 — créer un nouveau relevé mensuel. */
  creer: (data: FeuilleHeureRequest) =>
    api.post<FeuilleHeureResponse>('/releves', data).then((r) => r.data),

  mesReleves: () =>
    api.get<FeuilleHeureResponse[]>('/releves').then((r) => r.data),

  trouverParId: (id: number) =>
    api.get<FeuilleHeureResponse>(`/releves/${id}`).then((r) => r.data),

  listerSoumis: () =>
    api.get<FeuilleHeureResponse[]>('/releves/soumis').then((r) => r.data),

  soumettre: (id: number) =>
    api.patch<FeuilleHeureResponse>(`/releves/${id}/soumettre`).then((r) => r.data),

  valider: (id: number) =>
    api.patch<FeuilleHeureResponse>(`/releves/${id}/valider`).then((r) => r.data),

  rejeter: (id: number, motif?: string) =>
    api.patch<FeuilleHeureResponse>(`/releves/${id}/rejeter`, null, {
      params: motif ? { motif } : undefined,
    }).then((r) => r.data),
}
