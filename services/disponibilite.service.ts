import { api } from './api'

export type StatutDisponibilite = 'PROPOSEE' | 'CONFIRMEE'

export interface DisponibiliteResponse {
  id: number
  vacataireId: number
  nomVacataire: string
  date: string
  heureDebut: string
  heureFin: string
  statut: StatutDisponibilite
  dateCreation: string
}

export interface DisponibiliteRequest {
  date: string
  heureDebut: string
  heureFin: string
}

export const disponibiliteService = {
  declarer: (data: DisponibiliteRequest) =>
    api.post<DisponibiliteResponse>('/disponibilites', data).then((r) => r.data),

  mesDisponibilites: () =>
    api.get<DisponibiliteResponse[]>('/disponibilites/mes-disponibilites').then((r) => r.data),

  parVacataire: (vacataireId: number) =>
    api.get<DisponibiliteResponse[]>(`/disponibilites/vacataire/${vacataireId}`).then((r) => r.data),

  listerTous: () =>
    api.get<DisponibiliteResponse[]>('/disponibilites').then((r) => r.data),

  confirmer: (id: number) =>
    api.patch<DisponibiliteResponse>(`/disponibilites/${id}/confirmer`).then((r) => r.data),
}
