'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { authService } from '@/services/auth.service'
import { useAuthStore, roleToPath } from '@/store/auth.store'

const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  motDePasse: z.string().min(1, 'Mot de passe requis'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const login = useAuthStore((s) => s.login)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginForm) => {
    setServerError(null)
    setLoading(true)
    try {
      const response = await authService.login(data)
      login(response)
      if (response.premierConnexion) {
        router.replace('/changer-mot-de-passe')
      } else {
        router.replace(roleToPath[response.role])
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Email ou mot de passe incorrect.'
      setServerError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ══════════════════════════════════════════
          Panneau gauche — Brand splash
          ══════════════════════════════════════════ */}
      <div
        className="relative hidden overflow-hidden lg:flex lg:w-[56%] flex-col items-center justify-center"
        style={{
          background:
            'radial-gradient(ellipse 80% 70% at 50% 50%, #2E1200 0%, #1C0800 55%, #080200 100%)',
        }}
      >
        {/* Halos décoratifs */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 80%, rgba(200,133,0,0.04) 0%, transparent 60%),' +
              'radial-gradient(circle at 80% 20%, rgba(200,133,0,0.03) 0%, transparent 50%)',
          }}
        />

        {/* Brand showcase centré */}
        <div className="relative z-10 flex items-center gap-10 px-12">

          {/* Icône réseau */}
          <NetworkIcon />

          {/* Typographie */}
          <div className="flex flex-col">
            <span
              className="font-black leading-none"
              style={{ fontSize: '6.5rem', color: '#EDA832', lineHeight: 1 }}
            >
              RH
            </span>
            <span
              className="font-bold"
              style={{ fontSize: '2.4rem', color: '#C07820', letterSpacing: '0.32em', marginTop: '-0.1rem' }}
            >
              Connect
            </span>
            <div style={{ height: 1, background: 'rgba(200,133,0,0.30)', width: '100%', margin: '1rem 0' }} />
            <span style={{ color: 'rgba(200,133,0,0.50)', fontSize: '0.88rem', letterSpacing: '0.01em' }}>
              Connecter les talents, simplifier la gestion
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          Panneau droit — Formulaire blanc
          ══════════════════════════════════════════ */}
      <div className="flex flex-1 flex-col items-center justify-between bg-white px-8 py-10 overflow-y-auto">

        {/* Logo mobile */}
        <div className="mb-6 flex items-center gap-2 self-start lg:hidden">
          <NetworkIconSmall />
          <span className="font-black text-xl" style={{ color: '#EDA832' }}>
            RH<span style={{ color: '#C07820' }}>Connect</span>
          </span>
        </div>

        <div className="w-full max-w-sm lg:mt-auto">
          <h1 className="text-3xl font-bold" style={{ color: '#0D1117' }}>Connexion</h1>
          <p className="mt-2 text-sm text-gray-500">
            Veuillez vous identifier pour accéder à votre espace personnel.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                Adresse e-mail
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-gray-400">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input
                  id="email"
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="prenom.nom@ism.edu.sn"
                  className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            {/* Mot de passe */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="motDePasse" className="text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <button type="button" className="text-xs font-semibold" style={{ color: '#C88500' }}>
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-gray-400">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="motDePasse"
                  {...register('motDePasse')}
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500"
                />
              </div>
              {errors.motDePasse && <p className="mt-1 text-xs text-red-600">{errors.motDePasse.message}</p>}
            </div>

            {serverError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: '#C88500' }}
            >
              {loading ? 'Connexion en cours…' : 'Se connecter →'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Pas encore de compte ?{' '}
              <a href="/register" className="font-semibold" style={{ color: '#C88500' }}>
                S'inscrire
              </a>
            </p>
          </form>
        </div>

        <p className="mt-auto pt-8 text-center text-xs text-gray-400">
          © 2025 ISM Gestion · Tous droits réservés
        </p>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   Icône réseau 4 personnes — logo RHConnect
   ══════════════════════════════════════════════════════ */
function NetworkIcon() {
  return (
    <svg viewBox="0 0 240 295" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[175px] flex-shrink-0">
      {/* Hexagone connecteur */}
      <polygon points="120,80 176,113 176,178 120,210 64,178 64,113"
        fill="none" stroke="#7A4010" strokeWidth="9" strokeLinejoin="round" />
      {/* Point central */}
      <circle cx="120" cy="145" r="11" fill="#7A4010" />
      {/* P1 — haut, ambré vif */}
      <circle cx="120" cy="34" r="25" fill="#EDA832" />
      <path d="M90,64 Q120,51 150,64 L145,84 L95,84 Z" fill="#EDA832" />
      {/* P2 — gauche, ambré moyen */}
      <circle cx="24" cy="133" r="20" fill="#C07820" />
      <path d="M0,158 Q24,146 48,158 L45,176 L3,176 Z" fill="#C07820" />
      {/* P3 — droite, ambré moyen */}
      <circle cx="216" cy="128" r="18" fill="#C07820" />
      <path d="M194,149 Q216,138 238,149 L235,166 L197,166 Z" fill="#C07820" />
      {/* P4 — bas, ambré vif */}
      <circle cx="120" cy="238" r="22" fill="#EDA832" />
      <path d="M93,264 Q120,252 147,264 L143,283 L97,283 Z" fill="#EDA832" />
    </svg>
  )
}

function NetworkIconSmall() {
  return (
    <svg viewBox="0 0 240 295" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-7">
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
  )
}
