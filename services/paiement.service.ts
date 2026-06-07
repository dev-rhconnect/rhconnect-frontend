import { api } from './api'

export type StatutPaiement = 'EN_ATTENTE' | 'VALIDE' | 'PAYE'

export interface PaiementResponse {
  id: number
  feuilleHeureId: number
  nomVacataire: string
  periode: string
  totalHeures: number
  tauxHoraire: number
  montantBrut: number
  retenueFiscale: number
  montantNet: number
  statut: StatutPaiement
  dateGeneration: string
}

export interface PaiementRequest {
  feuilleHeureId: number
  tauxHoraire: number
}

export const paiementService = {
  calculer: (data: PaiementRequest) =>
    api.post<PaiementResponse>('/paie/calculer', data).then((r) => r.data),

  listerTous: () =>
    api.get<PaiementResponse[]>('/paie').then((r) => r.data),

  trouverParId: (id: number) =>
    api.get<PaiementResponse>(`/paie/${id}`).then((r) => r.data),

  /** Sprint 2 — Ndeye Fatou : télécharger la fiche de paie PDF. */
  telecharger: async (id: number): Promise<Blob> => {
    const r = await api.get(`/paie/${id}/telecharger`, { responseType: 'blob' })
    return r.data as Blob
  },
}
