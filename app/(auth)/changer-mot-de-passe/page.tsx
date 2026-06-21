'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, roleToPath } from '@/store/auth.store'
import { authService } from '@/services/auth.service'

export default function ChangerMotDePassePage() {
  const router = useRouter()
  const { user, updateUser } = useAuthStore()

  const [ancienMotDePasse, setAncienMotDePasse] = useState('')
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPremierConnexion = user?.premierConnexion ?? false

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (nouveauMotDePasse.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (nouveauMotDePasse !== confirmation) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    try {
      await authService.changerMotDePasse({ ancienMotDePasse, nouveauMotDePasse })
      updateUser({ premierConnexion: false })
      router.replace(user ? roleToPath[user.role] : '/login')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Mot de passe actuel incorrect ou erreur serveur.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ism-warm px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <svg viewBox="0 0 240 295" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-9 flex-shrink-0">
            <polygon points="120,80 176,113 176,178 120,210 64,178 64,113" fill="none" stroke="#7A4010" strokeWidth="9" strokeLinejoin="round" />
            <circle cx="120" cy="145" r="11" fill="#7A4010" />
            <circle cx="120" cy="34" r="25" fill="#EDA832" />
            <path d="M90,64 Q120,51 150,64 L145,84 L95,84 Z" fill="#EDA832" />
            <circle cx="24" cy="133" r="20" fill="#C07820" />
            <path d="M0,158 Q24,146 48,158 L45,176 L3,176 Z" fill="#C07820" />
            <circle cx="216" cy="128" r="18" fill="#C07820" />
            <path d="M194,149 Q216,138 238,149 L235,166 L197,166 Z" fill="#C07820" />
            <circle cx="120" cy="238" r="22" fill="#EDA832" />
            <path d="M93,264 Q120,252 147,264 L143,283 L97,283 Z" fill="#EDA832" />
          </svg>
          <span className="text-xl font-black" style={{ color: '#EDA832' }}>
            RH<span style={{ color: '#C07820' }}>Connect</span>
          </span>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm">
          {/* Titre */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {isPremierConnexion ? 'Bienvenue sur RHConnect' : 'Changer le mot de passe'}
            </h1>
            <p className="mt-1.5 text-sm text-gray-500">
              {isPremierConnexion
                ? 'Pour sécuriser votre compte, vous devez définir un mot de passe personnel avant de continuer.'
                : 'Saisissez votre mot de passe actuel puis choisissez un nouveau.'}
            </p>
          </div>

          {/* Alerte première connexion */}
          {isPremierConnexion && (
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Votre mot de passe temporaire est{' '}
              <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-mono font-semibold">
                Vacataire@ISM2026
              </code>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Mot de passe actuel */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Mot de passe actuel <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={ancienMotDePasse}
                onChange={(e) => setAncienMotDePasse(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>

            {/* Nouveau mot de passe */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Nouveau mot de passe <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={nouveauMotDePasse}
                onChange={(e) => setNouveauMotDePasse(e.target.value)}
                placeholder="8 caractères minimum"
                autoComplete="new-password"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
              {nouveauMotDePasse.length > 0 && nouveauMotDePasse.length < 8 && (
                <p className="mt-1 text-xs text-amber-600">Minimum 8 caractères</p>
              )}
            </div>

            {/* Confirmation */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Confirmer le nouveau mot de passe <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${
                  confirmation.length > 0 && confirmation !== nouveauMotDePasse
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                    : 'border-gray-200 focus:border-amber-400 focus:ring-amber-100'
                }`}
              />
              {confirmation.length > 0 && confirmation !== nouveauMotDePasse && (
                <p className="mt-1 text-xs text-red-600">Les mots de passe ne correspondent pas</p>
              )}
            </div>

            {/* Erreur serveur */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !ancienMotDePasse || !nouveauMotDePasse || !confirmation}
              className="mt-2 w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: '#C88500' }}
            >
              {loading ? 'Enregistrement…' : isPremierConnexion ? 'Définir mon mot de passe →' : 'Changer le mot de passe →'}
            </button>
          </form>
        </div>

        {user && !isPremierConnexion && (
          <p className="mt-4 text-center text-sm text-gray-500">
            <button
              onClick={() => router.back()}
              className="font-semibold hover:underline"
              style={{ color: '#C88500' }}
            >
              ← Retour
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
