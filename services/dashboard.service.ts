import { api } from './api'

export interface StatMensuelle {
  mois: string
  heures: number
  montantNet: number
}

export interface KpiResponse {
  vacatairesActifs: number
  vacatairesTotal: number
  totalHeuresValidees: number
  totalRemunerationsNet: number
  totalRemunerationsBrut: number
  relevesEnCours: number
  relevesSoumis: number
  contratsActifs: number
  contratsExpirantBientot: number
  evolutionMensuelle: StatMensuelle[]
}

export const dashboardService = {
  kpis: () => api.get<KpiResponse>('/dashboard/kpis').then((r) => r.data),
}
