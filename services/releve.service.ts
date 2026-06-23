import { api } from './api'

export type StatutReleve =
  | 'EN_COURS'
  | 'SOUMIS'          // legacy
  | 'SOUMIS_RP'
  | 'VALIDE_RP'
  | 'SOUMIS_FINANCE'
  | 'VALIDE'
  | 'REJETE'

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

export interface FeuilleHeureResponse {
  id: number
  contratId: number
  contratModuleId?: number
  vacataireId: number
  nomVacataire: string
  module: string
  classe: string
  classes?: string[]
  periode: string
  nombreSeances: number
  totalHeuresValidees: number
  volumeHorairePrevisionnel?: number
  tauxHoraire?: number
  statut: StatutReleve
  dateSoumission?: string
  dateValidation?: string
  motifRejet?: string
  lignes: LigneHeureResponse[]
}

export interface ReleveFilters {
  periode?: string
  classeNom?: string
  vacataireId?: number
}

export const releveService = {
  lister: (filters: ReleveFilters = {}) =>
    api.get<FeuilleHeureResponse[]>('/releves', { params: filters }).then(r => r.data),

  soumisRP: () =>
    api.get<FeuilleHeureResponse[]>('/releves/soumis-rp').then(r => r.data),

  soumisFinance: () =>
    api.get<FeuilleHeureResponse[]>('/releves/soumis-finance').then(r => r.data),

  mesRelevesValides: () =>
    api.get<FeuilleHeureResponse[]>('/releves/mes-releves-valides').then(r => r.data),

  equipe: () =>
    api.get<FeuilleHeureResponse[]>('/releves/equipe').then(r => r.data),

  trouverParId: (id: number) =>
    api.get<FeuilleHeureResponse>(`/releves/${id}`).then(r => r.data),

  telechargerPdf: async (id: number) => {
    const response = await api.get(`/releves/${id}/pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `fiche_decompte_${id}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  },

  ajouterLigne: (feuilleId: number, data: {
    feuilleHeureId: number
    date: string
    heureDebut: string
    heureFin: string
    observation?: string
    absence?: boolean
  }) => api.post<LigneHeureResponse>(`/releves/${feuilleId}/lignes`, data).then(r => r.data),

  soumettre: (id: number) =>
    api.patch<FeuilleHeureResponse>(`/releves/${id}/soumettre`).then(r => r.data),

  validerParRP: (id: number) =>
    api.patch<FeuilleHeureResponse>(`/releves/${id}/valider-rp`).then(r => r.data),

  soumettreAFinance: (id: number) =>
    api.patch<FeuilleHeureResponse>(`/releves/${id}/soumettre-finance`).then(r => r.data),

  valider: (id: number) =>
    api.patch<FeuilleHeureResponse>(`/releves/${id}/valider`).then(r => r.data),

  rejeter: (id: number, motif: string) =>
    api.patch<FeuilleHeureResponse>(`/releves/${id}/rejeter`, null, { params: { motif } }).then(r => r.data),

  repondreExplication: (id: number, reponse: string) =>
    api.patch<FeuilleHeureResponse>(`/releves/${id}/reponse-explication`, null, { params: { reponse } }).then(r => r.data),
}
