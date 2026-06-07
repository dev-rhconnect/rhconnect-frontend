'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { vacataireService } from '@/services/vacataire.service'

/* ── Schéma de validation ── */
const vacataireSchema = z.object({
  // Identité (obligatoires)
  nom: z.string().min(2, 'Minimum 2 caractères'),
  prenom: z.string().min(2, 'Minimum 2 caractères'),
  email: z.string().email('Adresse email invalide'),
  specialite: z.string().min(2, 'Spécialité requise'),
  // Coordonnées (facultatifs)
  telephone: z.string(),
  adresse: z.string(),
  situationMatrimoniale: z.string(),
  numeroCni: z.string(),
  // Informations sociales
  ninea: z.string(),
  ipres: z.string(),
  // Coordonnées bancaires
  nomBanque: z.string(),
  codeBanque: z.string(),
  codeGuichet: z.string(),
  numeroCompte: z.string(),
  rib: z.string(),
})

type FormData = z.infer<typeof vacataireSchema>

export default function NouveauVacatairePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(vacataireSchema),
    defaultValues: {
      telephone: '', adresse: '', situationMatrimoniale: '',
      numeroCni: '', ninea: '', ipres: '',
      nomBanque: '', codeBanque: '', codeGuichet: '', numeroCompte: '', rib: '',
    },
  })

  const { mutate: creer, isPending } = useMutation({
    mutationFn: (data: FormData) => {
      // Ne pas envoyer les champs vides
      const payload = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== '')
      ) as FormData
      return vacataireService.creer(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacataires'] })
      router.push('/responsable/vacataires')
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Une erreur est survenue. Vérifiez les informations saisies.'
      setServerError(msg)
    },
  })

  const onSubmit = (data: FormData) => {
    setServerError(null)
    creer(data)
  }

  return (
    <div>
      {/* Fil d'ariane */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/responsable/vacataires" className="hover:text-gray-800 transition-colors">
          Dossiers vacataires
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Nouveau dossier</span>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Nouveau dossier vacataire</h2>
        <p className="mt-1 text-sm text-gray-500">
          Remplissez les informations PR01. Un compte sera créé automatiquement avec un mot de passe temporaire.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

        {/* ─────────────────────────────────────
            Section 1 — Identité
            ───────────────────────────────────── */}
        <FormSection
          title="Identité"
          subtitle="Informations obligatoires pour créer le dossier"
          icon={<PersonIcon />}
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label="Prénom" required error={errors.prenom?.message}>
              <input {...register('prenom')} placeholder="Ex : Mamadou" className={inputCls(!!errors.prenom)} />
            </Field>
            <Field label="Nom" required error={errors.nom?.message}>
              <input {...register('nom')} placeholder="Ex : DIALLO" className={inputCls(!!errors.nom)} />
            </Field>
          </div>
          <Field label="Adresse e-mail" required error={errors.email?.message}>
            <input {...register('email')} type="email" placeholder="mamadou.diallo@example.com" className={inputCls(!!errors.email)} />
          </Field>
          <Field label="Spécialité / Matière enseignée" required error={errors.specialite?.message}>
            <input {...register('specialite')} placeholder="Ex : Mathématiques appliquées, Droit du travail…" className={inputCls(!!errors.specialite)} />
          </Field>
        </FormSection>

        {/* ─────────────────────────────────────
            Section 2 — Coordonnées personnelles
            ───────────────────────────────────── */}
        <FormSection
          title="Coordonnées personnelles"
          subtitle="Informations de contact et état civil (facultatif)"
          icon={<MapPinIcon />}
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label="Téléphone">
              <input {...register('telephone')} placeholder="77 000 00 00" className={inputCls(false)} />
            </Field>
            <Field label="Situation matrimoniale">
              <select {...register('situationMatrimoniale')} className={inputCls(false)}>
                <option value="">— Sélectionner —</option>
                <option value="CELIBATAIRE">Célibataire</option>
                <option value="MARIE">Marié(e)</option>
                <option value="DIVORCE">Divorcé(e)</option>
                <option value="VEUF">Veuf/Veuve</option>
              </select>
            </Field>
          </div>
          <Field label="Adresse complète">
            <input {...register('adresse')} placeholder="Ex : Mermoz, Dakar, Sénégal" className={inputCls(false)} />
          </Field>
          <Field label="Numéro CNI / Passeport">
            <input {...register('numeroCni')} placeholder="Ex : 1 234 567 890 12" className={inputCls(false)} />
          </Field>
        </FormSection>

        {/* ─────────────────────────────────────
            Section 3 — Informations sociales
            ───────────────────────────────────── */}
        <FormSection
          title="Informations sociales"
          subtitle="Numéros d'identification fiscaux et de retraite"
          icon={<ShieldIcon />}
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label="NINEA" hint="Numéro d'identification nationale des entreprises et associations">
              <input {...register('ninea')} placeholder="Ex : 12345 67 A 23" className={inputCls(false)} />
            </Field>
            <Field label="N° IPRES" hint="Institution de Prévoyance Retraite du Sénégal">
              <input {...register('ipres')} placeholder="Ex : 0001-23456" className={inputCls(false)} />
            </Field>
          </div>
        </FormSection>

        {/* ─────────────────────────────────────
            Section 4 — Coordonnées bancaires
            ───────────────────────────────────── */}
        <FormSection
          title="Coordonnées bancaires"
          subtitle="Informations nécessaires pour le virement des rémunérations"
          icon={<BankIcon />}
        >
          <div className="grid grid-cols-3 gap-4">
            <Field label="Code banque">
              <input {...register('codeBanque')} placeholder="Ex : 00020" className={inputCls(false)} maxLength={5} />
            </Field>
            <Field label="Code guichet">
              <input {...register('codeGuichet')} placeholder="Ex : 00001" className={inputCls(false)} maxLength={5} />
            </Field>
            <Field label="Nom de la banque">
              <input {...register('nomBanque')} placeholder="Ex : CBAO, Ecobank…" className={inputCls(false)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Numéro de compte">
              <input {...register('numeroCompte')} placeholder="Ex : 12345678901" className={inputCls(false)} />
            </Field>
            <Field label="RIB / Clé">
              <input {...register('rib')} placeholder="Ex : 56" className={inputCls(false)} maxLength={2} />
            </Field>
          </div>
        </FormSection>

        {/* Erreur serveur */}
        {serverError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        {/* Note mot de passe temporaire */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Note :</strong> Un compte sera créé avec le mot de passe temporaire{' '}
          <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">Vacataire@ISM2026</code>.
          Le vacataire devra le changer à sa première connexion.
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 pb-8">
          <Link
            href="/responsable/vacataires"
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: '#C88500' }}
          >
            {isPending ? 'Enregistrement…' : 'Créer le dossier →'}
          </button>
        </div>
      </form>
    </div>
  )
}

/* ── Helpers de mise en forme ── */

function inputCls(hasError: boolean) {
  return `w-full rounded-xl border ${
    hasError ? 'border-red-400' : 'border-gray-200'
  } bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400 transition-colors`
}

function FormSection({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-orange-50 text-ism-gold">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {hint && <p className="mb-1.5 text-xs text-gray-400">{hint}</p>}
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

/* ── Icônes de section ── */

function PersonIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function BankIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="22" x2="21" y2="22" /><line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" /><line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" />
      <polygon points="12 2 20 7 4 7" />
    </svg>
  )
}
