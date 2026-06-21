import { api } from './api'

export type TypeNotification =
  | 'CONTRAT_EXPIRANT'
  | 'RELEVE_SOUMIS'
  | 'RELEVE_VALIDE'
  | 'RELEVE_REJETE'
  | 'FICHE_PAIE_DISPONIBLE'
  | 'ECART_VOLUME_HORAIRE'
  | 'NOUVEAU_COMPTE'

export interface NotificationResponse {
  id: number
  type: TypeNotification
  message: string
  lu: boolean
  dateEnvoi: string
}

const typeIcon: Record<TypeNotification, string> = {
  CONTRAT_EXPIRANT:      '⚠️',
  RELEVE_SOUMIS:         '📋',
  RELEVE_VALIDE:         '✅',
  RELEVE_REJETE:         '❌',
  FICHE_PAIE_DISPONIBLE: '💰',
  ECART_VOLUME_HORAIRE:  '📊',
  NOUVEAU_COMPTE:        '👤',
}

export { typeIcon }

export const notificationService = {
  mesDernieres: () =>
    api.get<NotificationResponse[]>('/notifications').then((r) => r.data),

  compterNonLues: () =>
    api.get<{ nonLues: number }>('/notifications/count').then((r) => r.data.nonLues),

  marquerLue: (id: number) =>
    api.patch<void>(`/notifications/${id}/lire`).then((r) => r.data),

  marquerToutesLues: () =>
    api.patch<void>('/notifications/lire-tout').then((r) => r.data),
}
