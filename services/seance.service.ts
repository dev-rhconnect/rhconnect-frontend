import { api } from './api'

export type TypeSeance = 'CM' | 'TD' | 'TP' | 'CONFERENCE'
export type StatutSeance = 'PROGRAMMEE' | 'REALISEE' | 'ANNULEE'

export interface SeanceProgrammeeResponse {
  id: number
  contratId: number
  contratModuleId?: number
  nomVacataire: string
  emailVacataire: string
  specialiteVacataire: string
  module: string
  classe: string
  classes?: string[]
  justificationEcart?: string
  dateSeance: string
  heureDebut: string
  heureFin: string
  duree: number
  typeSeance?: TypeSeance
  salle?: string
  statut: StatutSeance
  feuillePresenceUploaded: boolean
  noteInterne?: string
  nomValidePar?: string
  dateValidation?: string
  dateCreation: string
}

export interface SeanceProgrammeeRequest {
  contratId: number
  contratModuleId?: number
  disponibiliteId?: number
  dateSeance: string
  heureDebut: string
  heureFin: string
  typeSeance?: TypeSeance
  salle?: string
  justificationEcart?: string
}

export interface ModuleActifParClasse {
  contratModuleId: number
  contratId: number
  nomModule: string
  niveau: string
  classes: string[]
  volumeHorairePrevisionnel: number
  heuresEffectuees: number
  vacataireNom: string
  vacataireId: number
}

export const seanceService = {
  creer: (data: SeanceProgrammeeRequest) =>
    api.post<SeanceProgrammeeResponse>('/seances', data).then((r) => r.data),

  semaine: (reference?: string, classeNom?: string) =>
    api.get<SeanceProgrammeeResponse[]>('/seances/semaine', {
      params: { ...(reference ? { reference } : {}), ...(classeNom ? { classeNom } : {}) },
    }).then((r) => r.data),

  listerTous: () =>
    api.get<SeanceProgrammeeResponse[]>('/seances').then((r) => r.data),

  mesSeances: () =>
    api.get<SeanceProgrammeeResponse[]>('/seances/mes-seances').then((r) => r.data),

  valider: (id: number, noteInterne?: string) =>
    api.patch<SeanceProgrammeeResponse>(`/seances/${id}/valider`, null, {
      params: noteInterne ? { noteInterne } : undefined,
    }).then((r) => r.data),

  annuler: (id: number, motif?: string) =>
    api.patch<SeanceProgrammeeResponse>(`/seances/${id}/annuler`, null, {
      params: motif ? { motif } : undefined,
    }).then((r) => r.data),

  releve: (params: { vacataireId?: number; classeNom?: string; debut?: string; fin?: string }) =>
    api.get<SeanceProgrammeeResponse[]>('/seances/releve', { params }).then(r => r.data),

  ecarts: () =>
    api.get<SeanceProgrammeeResponse[]>('/seances/ecarts').then(r => r.data),

  modulesActifsParClasse: (classeNom: string) =>
    api.get<ModuleActifParClasse[]>('/seances/modules-actifs', { params: { classeNom } }).then(r => r.data),

  uploadFeuillePresence: (id: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<SeanceProgrammeeResponse>(`/seances/${id}/feuille-presence`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data)
  },
}
