import { api } from './api'

export type TypeSeance = 'CM' | 'TD' | 'TP' | 'CONFERENCE'
export type StatutSeance = 'PROGRAMMEE' | 'REALISEE' | 'ANNULEE'

export interface SeanceProgrammeeResponse {
  id: number
  contratId: number
  nomVacataire: string
  emailVacataire: string
  specialiteVacataire: string
  module: string
  classe: string
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
  disponibiliteId?: number
  dateSeance: string
  heureDebut: string
  heureFin: string
  typeSeance?: TypeSeance
  salle?: string
}

export const seanceService = {
  creer: (data: SeanceProgrammeeRequest) =>
    api.post<SeanceProgrammeeResponse>('/seances', data).then((r) => r.data),

  semaine: (reference?: string) =>
    api.get<SeanceProgrammeeResponse[]>('/seances/semaine', {
      params: reference ? { reference } : undefined,
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

  uploadFeuillePresence: (id: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<SeanceProgrammeeResponse>(`/seances/${id}/feuille-presence`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data)
  },
}
