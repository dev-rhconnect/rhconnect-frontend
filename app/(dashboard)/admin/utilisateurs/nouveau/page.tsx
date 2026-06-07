'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { adminService } from '@/services/admin.service'

type Role = 'RESPONSABLE_PROGRAMME' | 'ATTACHE_CLASSE' | 'RELAIS_FINANCE'

const schema = z.object({
  prenom:               z.string().min(1, 'Prénom obligatoire'),
  nom:                  z.string().min(1, 'Nom obligatoire'),
  email:                z.string().email('Email invalide'),
  role:                 z.enum(['RESPONSABLE_PROGRAMME', 'ATTACHE_CLASSE', 'RELAIS_FINANCE'] as const),
  motDePasseTemporaire: z.string().min(8, '8 caractères minimum').optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

const roles: { value: Role; label: string }[] = [
  { value: 'RESPONSABLE_PROGRAMME', label: 'Responsable Pédagogique' },
  { value: 'ATTACHE_CLASSE',        label: 'Attaché de Classe' },
  { value: 'RELAIS_FINANCE',        label: 'Relais Finance' },
]

export default function NouveauUtilisateurPage() {
  const router = useRouter()
  const qc = useQueryClient()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'RESPONSABLE_PROGRAMME' },
  })

  const { mutate, isPending, error } = useMutation({
    mutationFn: adminService.creerCompte,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'utilisateurs'] })
      router.push('/admin/utilisateurs')
    },
  })

  const onSubmit = (data: FormData) => {
    mutate({
      prenom: data.prenom,
      nom: data.nom,
      email: data.email,
      role: data.role,
      motDePasseTemporaire: data.motDePasseTemporaire || undefined,
    })
  }

  return (
    <div>
      {/* En-tête */}
      <div className="mb-6">
        <Link href="/admin/utilisateurs" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Retour aux utilisateurs
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">Nouveau compte</h2>
        <p className="mt-1 text-sm text-gray-500">Créer un compte utilisateur sur RHConnect.</p>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl bg-white p-6 shadow-sm space-y-5">

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {(error as Error).message}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
              Prénom *
            </label>
            <input {...register('prenom')} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ism-gold/40" />
            {errors.prenom && <p className="mt-1 text-xs text-red-500">{errors.prenom.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
              Nom *
            </label>
            <input {...register('nom')} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ism-gold/40" />
            {errors.nom && <p className="mt-1 text-xs text-red-500">{errors.nom.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
            Adresse email *
          </label>
          <input type="email" {...register('email')} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ism-gold/40" />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
            Rôle *
          </label>
          <select {...register('role')} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ism-gold/40">
            {roles.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
            Mot de passe temporaire
          </label>
          <input
            type="password"
            {...register('motDePasseTemporaire')}
            placeholder="Laissez vide pour utiliser le mot de passe par défaut"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ism-gold/40"
          />
          <p className="mt-1 text-xs text-gray-400">
            Par défaut : <code className="font-mono bg-gray-100 px-1 rounded">Rhconnect@ISM2026</code>
          </p>
          {errors.motDePasseTemporaire && (
            <p className="mt-1 text-xs text-red-500">{errors.motDePasseTemporaire.message}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/admin/utilisateurs" className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Annuler
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: '#1C0800' }}
          >
            {isPending && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
              </svg>
            )}
            Créer le compte
          </button>
        </div>
      </form>
    </div>
  )
}
