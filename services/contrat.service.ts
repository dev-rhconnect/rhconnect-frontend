import { api } from './api'

export type StatutContrat = 'ACTIF' | 'EXPIRE' | 'RESILIE'

export interface ContratResponse {
  id: number
  vacataireId: number
  nomVacataire: string
  emailVacataire: string
  module: string
  classe: string
  volumeHorairePrevisionnel: number
  tauxHoraire: number
  dateDebut: string
  dateFin: string
  pdfGenere: boolean
  estAvenant: boolean
  contratParentId?: number
  statut: StatutContrat
  dateCreation: string
}

export interface ContratRequest {
  vacataireId: number
  module: string
  classe: string
  volumeHorairePrevisionnel: number
  tauxHoraire: number
  dateDebut: string
  dateFin: string
  contratParentId?: number
  estAvenant?: boolean
}

export const contratService = {
  listerTous: () =>
    api.get<ContratResponse[]>('/contrats').then((r) => r.data),

  listerParVacataire: (vacataireId: number) =>
    api.get<ContratResponse[]>(`/contrats/vacataire/${vacataireId}`).then((r) => r.data),

  trouverParId: (id: number) =>
    api.get<ContratResponse>(`/contrats/${id}`).then((r) => r.data),

  creer: (data: ContratRequest) =>
    api.post<ContratResponse>('/contrats', data).then((r) => r.data),

  genererPdf: async (id: number): Promise<Blob> => {
    const response = await api.post(`/contrats/${id}/generer-pdf`, {}, {
      responseType: 'blob',
    })
    return response.data as Blob
  },

  envoyer: (id: number) =>
    api.post<void>(`/contrats/${id}/envoyer`).then((r) => r.data),

  resilier: (id: number) =>
    api.patch<ContratResponse>(`/contrats/${id}/resilier`).then((r) => r.data),
}

/** Utilitaire : déclenche le téléchargement d'un Blob PDF dans le navigateur. */
export function telechargerPdf(blob: Blob, nomFichier: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomFichier
  a.click()
  URL.revokeObjectURL(url)
}
