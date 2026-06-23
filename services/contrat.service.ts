import { api } from './api'

export type StatutContrat = 'ACTIF' | 'EXPIRE' | 'RESILIE'
export type NiveauEnseignement = 'L1' | 'L2' | 'L3' | 'MASTER' | 'MASTER_1' | 'MASTER_2' | 'DUT' | 'LICENCE'
export type StatutModule = 'NON_COMMENCE' | 'EN_COURS' | 'TERMINE'

export interface ContratModuleResponse {
  id: number
  nomModule: string
  classes: string[]
  niveau: NiveauEnseignement
  tauxHoraire?: number
  volumeHorairePrevisionnel?: number
  heuresEffectuees?: number
  heuresRestantes?: number
  dateDemarrage?: string
  statut: StatutModule
}

export interface ContratModuleRequest {
  nomModule: string
  classes: string[]
  niveau: NiveauEnseignement
  estTroncCommun?: boolean
}

export interface ContratResponse {
  id: number
  vacataireId: number
  nomVacataire: string
  emailVacataire: string
  anneeAcademique: string
  modules: ContratModuleResponse[]
  dateDebut: string
  dateFin: string
  statut: StatutContrat
  estAvenant: boolean
  contratParentId?: number
  pdfGenere: boolean
  dateCreation: string
  volumeHorairePrevisionnel?: number
  tauxHoraire?: number
}

export interface ContratRequest {
  vacataireId: number
  modules: ContratModuleRequest[]
  dateDebut?: string
  dateFin?: string
  tauxHoraire?: number
  estAvenant?: boolean
  contratParentId?: number
}

export interface AvenantRequest {
  modules: ContratModuleRequest[]
  dateDebut?: string
}

export interface MaquetteModuleResponse {
  id: number
  classeNom: string
  classeFiliere: string
  moduleNom: string
  volumeHoraire: number
  actif: boolean
}

export const contratService = {
  listerTous: () =>
    api.get<ContratResponse[]>('/contrats').then((r) => r.data),

  listerActifs: async () => {
    const all = await api.get<ContratResponse[]>('/contrats').then((r) => r.data)
    return all.filter((c) => c.statut === 'ACTIF')
  },

  listerParVacataire: (vacataireId: number) =>
    api.get<ContratResponse[]>(`/contrats/vacataire/${vacataireId}`).then((r) => r.data),

  creer: (data: ContratRequest) =>
    api.post<ContratResponse>('/contrats', data).then((r) => r.data),

  creerAvenant: (contratParentId: number, data: AvenantRequest) =>
    api.post<ContratResponse>(`/contrats/${contratParentId}/avenant`, data).then((r) => r.data),

  expirants: () =>
    api.get<ContratResponse[]>('/contrats/expirants').then((r) => r.data),

  monContrat: () =>
    api.get<ContratResponse[]>('/contrats/mon-contrat').then((r) => r.data),

  trouverParId: (id: number) =>
    api.get<ContratResponse>(`/contrats/${id}`).then((r) => r.data),

  demarrerModule: (contratId: number, moduleId: number, dateDemarrage?: string) =>
    api.post<ContratModuleResponse>(`/contrats/${contratId}/modules/${moduleId}/demarrer`,
      dateDemarrage ? { dateDemarrage } : {}).then((r) => r.data),

  listerModulesParClasse: (classeNom: string) =>
    api.get<MaquetteModuleResponse[]>(`/maquette/classe/${encodeURIComponent(classeNom)}`).then((r) => r.data),

  getVhModule: (classeNom: string, moduleNom: string) =>
    api.get<number>('/maquette/vh', { params: { classeNom, moduleNom } }).then((r) => r.data),

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
