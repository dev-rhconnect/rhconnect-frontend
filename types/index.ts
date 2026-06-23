export type Role =
  | 'ADMIN'
  | 'RESPONSABLE_PROGRAMME'
  | 'ATTACHE_CLASSE'
  | 'RELAIS_FINANCE'
  | 'VACATAIRE'

export interface User {
  email: string
  nom: string
  prenom: string
  role: Role
  premierConnexion: boolean
  niveauGere?: string
}

export interface AuthResponse {
  token: string
  refreshToken: string
  email: string
  nom: string
  prenom: string
  role: Role
  premierConnexion: boolean
}

export interface LoginCredentials {
  email: string
  motDePasse: string
}

export interface ApiError {
  message: string
  status?: number
}
