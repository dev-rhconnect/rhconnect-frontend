import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthResponse, Role, User } from '@/types'

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: User | null
  _hasHydrated: boolean
  login: (data: AuthResponse) => void
  logout: () => void
  setHasHydrated: (v: boolean) => void
  updateUser: (patch: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      _hasHydrated: false,
      login: (data) =>
        set({
          token: data.token,
          refreshToken: data.refreshToken,
          user: {
            email: data.email,
            nom: data.nom,
            prenom: data.prenom,
            role: data.role,
            premierConnexion: data.premierConnexion,
          },
        }),
      logout: () => set({ token: null, refreshToken: null, user: null }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      updateUser: (patch) => set((s) => ({ user: s.user ? { ...s.user, ...patch } : s.user })),
    }),
    {
      name: 'rhconnect-auth',
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
)

export const roleToPath: Record<Role, string> = {
  ADMIN: '/admin',
  RESPONSABLE_PROGRAMME: '/responsable',
  ATTACHE_CLASSE: '/attache',
  RELAIS_FINANCE: '/finance',
  VACATAIRE: '/vacataire',
}

export const roleLabel: Record<Role, string> = {
  ADMIN: 'Admin IT',
  RESPONSABLE_PROGRAMME: 'Responsable de Programme',
  ATTACHE_CLASSE: 'Attaché de Classe',
  RELAIS_FINANCE: 'Relais Finance',
  VACATAIRE: 'Vacataire',
}
