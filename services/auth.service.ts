import api from './api'
import type { AuthResponse, LoginCredentials } from '@/types'

export interface ChangePasswordRequest {
  ancienMotDePasse: string
  nouveauMotDePasse: string
}

export const authService = {
  login: (credentials: LoginCredentials) =>
    api.post<AuthResponse>('/auth/login', credentials).then((r) => r.data),

  me: () => api.get<AuthResponse>('/auth/me').then((r) => r.data),

  changerMotDePasse: (data: ChangePasswordRequest) =>
    api.put('/auth/change-password', data).then((r) => r.data),
}
