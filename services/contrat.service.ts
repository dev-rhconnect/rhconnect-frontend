import { api } from './api'

export type StatutContrat = 'ACTIF' | 'EXPIRE' | 'RESILIE'

export interface ContratResponse {
  id: number
  vacataireId: number
  nomVacataire: string
  emailVacataire: string
  module: string
  classe: string
  volumeHorairePrevisionnel?: number
  tauxHoraire?: number
  dateDebut: string
  dateFin: string
  statut: StatutContrat
  estAvenant: boolean
}

export interface ContratRequest {
  vacataireId: number
  module: string
  classe: string
  volumeHorairePrevisionnel: number
  tauxHoraire: number
  dateDebut: string
  dateFin: string
  estAvenant?: boolean
  contratParentId?: number
}

export const contratService = {
  listerTous: () =>
    api.get<ContratResponse[]>('/contrats').then((r) => r.data),

  listerActifs: async () => {
    const all = await api.get<ContratResponse[]>('/contrats').then((r) => r.data)
    return all.filter((c) => c.statut === 'ACTIF')
  },

  creer: (data: ContratRequest) =>
    api.post<ContratResponse>('/contrats', data).then((r) => r.data),

  expirants: () =>
    api.get<ContratResponse[]>('/contrats/expirants').then((r) => r.data),

  monContrat: () =>
    api.get<ContratResponse[]>('/contrats/mon-contrat').then((r) => r.data),

  telechargerPdf: async (id: number): Promise<void> => {
    const response = await api.get(`/contrats/${id}/pdf`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Contrat_RHC-${String(id).padStart(5, '0')}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
}
