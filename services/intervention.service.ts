import { api } from './api'

export interface LigneHeureResponse {
  id: number
  feuilleHeureId: number
  date: string
  heureDebut: string
  heureFin: string
  duree: number
  observation?: string
  statut: 'SAISIE' | 'VALIDEE' | 'REJETEE'
}

export interface LigneHeureRequest {
  feuilleHeureId: number
  date: string          // ISO: "2026-01-15"
  heureDebut: string    // "08:00:00"
  heureFin: string      // "10:00:00"
  observation?: string
}

export const interventionService = {
  saisir: (data: LigneHeureRequest) =>
    api.post<LigneHeureResponse>('/interventions', data).then((r) => r.data),

  listerParFeuille: (feuilleHeureId: number) =>
    api.get<LigneHeureResponse[]>(`/interventions/feuille/${feuilleHeureId}`).then((r) => r.data),
}
