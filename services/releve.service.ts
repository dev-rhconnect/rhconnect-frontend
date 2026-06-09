import { api } from './api'

export type StatutReleve = 'EN_COURS' | 'SOUMIS' | 'VALIDE' | 'REJETE'

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
  nomVacataire: string
  module: string
  classe: string
  periode: string
  totalHeuresValidees: number
  volumeHorairePrevisionnel?: number
  statut: StatutReleve
  dateSoumission?: string
  dateValidation?: string
  motifRejet?: string
  lignes: LigneHeureResponse[]
}

export interface FeuilleHeureRequest {
  contratId: number
  periode: string
}

export interface LigneHeureRequest {
  feuilleHeureId: number
  date: string
  heureDebut: string
  heureFin: string
  observation?: string
  absence?: boolean
}

export const releveService = {
  creer: (data: FeuilleHeureRequest) =>
    api.post<FeuilleHeureResponse>('/releves', data).then((r) => r.data),

  ajouterLigne: (feuilleId: number, data: LigneHeureRequest) =>
    api.post<LigneHeureResponse>(`/releves/${feuilleId}/lignes`, data).then((r) => r.data),

  mesReleves: () =>
    api.get<FeuilleHeureResponse[]>('/releves').then((r) => r.data),

  mesRelevesValides: () =>
    api.get<FeuilleHeureResponse[]>('/releves/mes-releves-valides').then((r) => r.data),

  equipe: () =>
    api.get<FeuilleHeureResponse[]>('/releves/equipe').then((r) => r.data),

  listerSoumis: () =>
    api.get<FeuilleHeureResponse[]>('/releves/soumis').then((r) => r.data),

  trouverParId: (id: number) =>
    api.get<FeuilleHeureResponse>(`/releves/${id}`).then((r) => r.data),

  soumettre: (id: number) =>
    api.patch<FeuilleHeureResponse>(`/releves/${id}/soumettre`).then((r) => r.data),

  valider: (id: number) =>
    api.patch<FeuilleHeureResponse>(`/releves/${id}/valider`).then((r) => r.data),

  rejeter: (id: number, motif: string) =>
    api.patch<FeuilleHeureResponse>(`/releves/${id}/rejeter`, null, { params: { motif } }).then((r) => r.data),

  repondreExplication: (id: number, reponse: string) =>
    api.patch<FeuilleHeureResponse>(`/releves/${id}/reponse-explication`, null, { params: { reponse } }).then((r) => r.data),
}
