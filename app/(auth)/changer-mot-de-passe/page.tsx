'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { authService } from '@/services/auth.service'
import { useAuthStore, roleToPath } from '@/store/auth.store'

const schema = z
  .object({
    ancienMotDePasse: z.string().min(1, 'Ancien mot de passe requis'),
    nouveauMotDePasse: z
      .string()
      .min(8, 'Au moins 8 caractères')
      .regex(/[A-Z]/, 'Au moins une majuscule')
      .regex(/[0-9]/, 'Au moins un chiffre'),
    confirmation: z.string().min(1, 'Confirmation requise'),
  })
  .refine((d) => d.nouveauMotDePasse === d.confirmation, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmation'],
  })

type FormValues = z.infer<typeof schema>

export default function ChangerMotDePassePage() {
  const router = useRouter()
  const { user, login } = useAuthStore()
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormValues) => {
    setServerError(null)
    setLoading(true)
    try {
      await authService.changerMotDePasse({
        ancienMotDePasse: data.ancienMotDePasse,
        nouveauMotDePasse: data.nouveauMotDePasse,
      })
      // Met à jour le flag premierConnexion dans le store
      if (user) {
        login({
          token: useAuthStore.getState().token ?? '',
          refreshToken: useAuthStore.getState().refreshToken ?? '',
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          role: user.role,
          premierConnexion: false,
        })
      }
      router.replace(user ? roleToPath[user.role] : '/login')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erreur lors du changement de mot de passe.'
      setServerError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ism-warm px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        {/* En-tête */}
        <div className="mb-6 flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: '#FEF3C7' }}
          >
            <svg
              className="h-5 w-5"
              style={{ color: '#C88500' }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Créer votre mot de passe</h1>
            <p className="text-xs text-gray-500">
              Bonjour {user?.prenom} — première connexion détectée.
            </p>
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Pour des raisons de sécurité, vous devez définir un mot de passe personnel avant d'accéder
          à l'application.
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Ancien mot de passe */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Mot de passe temporaire
            </label>
            <input
              {...register('ancienMotDePasse')}
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40"
            />
            {errors.ancienMotDePasse && (
              <p className="mt-1 text-xs text-red-600">{errors.ancienMotDePasse.message}</p>
            )}
          </div>

          {/* Nouveau mot de passe */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Nouveau mot de passe
            </label>
            <input
              {...register('nouveauMotDePasse')}
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40"
            />
            {errors.nouveauMotDePasse && (
              <p className="mt-1 text-xs text-red-600">{errors.nouveauMotDePasse.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-400">Minimum 8 caractères, 1 majuscule, 1 chiffre</p>
          </div>

          {/* Confirmation */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Confirmer le nouveau mot de passe
            </label>
            <input
              {...register('confirmation')}
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40"
            />
            {errors.confirmation && (
              <p className="mt-1 text-xs text-red-600">{errors.confirmation.message}</p>
            )}
          </div>

          {serverError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: '#C88500' }}
          >
            {loading ? 'Enregistrement…' : 'Définir mon mot de passe →'}
          </button>
        </form>
      </div>
    </div>
  )
}
