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

  exporterBC365: async (): Promise<void> => {
    const response = await api.get('/paie/export-bc365', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }))
    const link = document.createElement('a')
    link.href = url
    const date = new Date().toISOString().slice(0, 10)
    link.setAttribute('download', `export_bc365_${date}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

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
