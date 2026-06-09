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

export const contratService = {
  listerTous: () =>
    api.get<ContratResponse[]>('/contrats').then((r) => r.data),

  listerActifs: async () => {
    const all = await api.get<ContratResponse[]>('/contrats').then((r) => r.data)
    return all.filter((c) => c.statut === 'ACTIF')
  },
}
