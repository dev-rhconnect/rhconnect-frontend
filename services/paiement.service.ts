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
  dateGeneration?: string
}

export const paiementService = {
  listerTous: () =>
    api.get<PaiementResponse[]>('/paie').then((r) => r.data),

  mesFiches: () =>
    api.get<PaiementResponse[]>('/paie/mes-fiches').then((r) => r.data),

  trouverParId: (id: number) =>
    api.get<PaiementResponse>(`/paie/${id}`).then((r) => r.data),

  telechargerPdf: async (id: number): Promise<void> => {
    const response = await api.get(`/paie/${id}/telecharger`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `fiche_paie_${id}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
}
