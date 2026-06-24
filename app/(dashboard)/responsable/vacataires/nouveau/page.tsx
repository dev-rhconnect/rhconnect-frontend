'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { vacataireService, type VacataireRequest } from '@/services/vacataire.service'
import { api } from '@/services/api'

/* ── Constantes ── */

const SPECIALITES_OPTIONS = [
  'Informatique', 'Réseaux & Télécommunications', 'Cybersécurité',
  'Développement Web', 'Développement Mobile', 'Intelligence Artificielle',
  'Base de données', 'Gestion de projet', 'Marketing Digital',
  'Communication', 'Comptabilité', 'Finance', 'Management',
  'Droit des affaires', 'Mathématiques', 'Statistiques', 'Anglais',
  'Français', 'Entrepreneuriat',
]

const NIVEAUX_OPTIONS = [
  { value: 'L1', label: 'L1 — Licence 1' },
  { value: 'L2', label: 'L2 — Licence 2' },
  { value: 'L3', label: 'L3 — Licence 3' },
  { value: 'MASTER', label: 'Master' },
  { value: 'MASTER_1', label: 'Master 1' },
  { value: 'MASTER_2', label: 'Master 2' },
  { value: 'DUT', label: 'DUT / BTS' },
]

/* ── Schéma de validation ── */
const vacataireSchema = z.object({
  nom: z.string().min(2, 'Minimum 2 caractères'),
  prenom: z.string().min(2, 'Minimum 2 caractères'),
  email: z.string().email('Adresse email invalide'),
  telephone: z.string(),
  adresse: z.string(),
  situationMatrimoniale: z.string(),
  dateNaissance: z.string(),
  lieuNaissance: z.string(),
  nationalite: z.string(),
  numeroCni: z.string(),
  ninea: z.string(),
  ipres: z.string(),
  nomBanque: z.string(),
  codeBanque: z.string(),
  codeGuichet: z.string(),
  numeroCompte: z.string(),
  rib: z.string(),
  typeVacataire: z.enum(['STANDARD', 'PROFESSEUR_UNIVERSITAIRE']),
})

type FormData = z.infer<typeof vacataireSchema>

export default function NouveauVacatairePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState<string | null>(null)
  const [specialites, setSpecialites] = useState<string[]>([])
  const [niveaux, setNiveaux] = useState<string[]>([])
  const [modules, setModules] = useState<string[]>([])
  const [specialiteLibre, setSpecialiteLibre] = useState('')

  // Charger la maquette pédagogique pour les modules disponibles
  const { data: maquette = [] } = useQuery({
    queryKey: ['maquette'],
    queryFn: () => api.get<Array<{ id: number; moduleNom: string }>>('/maquette').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })

  // Déduire les modules uniques
  const modulesDispos = [...new Set(maquette.map(m => m.moduleNom))].sort()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(vacataireSchema),
    defaultValues: {
      telephone: '', adresse: '', situationMatrimoniale: '',
      dateNaissance: '', lieuNaissance: '', nationalite: '',
      numeroCni: '', ninea: '', ipres: '',
      nomBanque: '', codeBanque: '', codeGuichet: '', numeroCompte: '', rib: '',
      typeVacataire: 'STANDARD',
    },
  })

  const toggleSpecialite = (s: string) =>
    setSpecialites(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const toggleNiveau = (n: string) =>
    setNiveaux(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n])

  const toggleModule = (m: string) =>
    setModules(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])

  const addSpecialiteLibre = () => {
    const trimmed = specialiteLibre.trim()
    if (trimmed && !specialites.includes(trimmed)) {
      setSpecialites(prev => [...prev, trimmed])
    }
    setSpecialiteLibre('')
  }

  const { mutate: creer, isPending } = useMutation({
    mutationFn: (data: FormData) => {
      const payload: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(data)) {
        if (v !== '') payload[k] = v
      }
      return vacataireService.creer({
        ...(payload as unknown as VacataireRequest),
        specialites: specialites.length > 0 ? specialites : undefined,
        niveaux: niveaux.length > 0 ? niveaux : undefined,
        modules: modules.length > 0 ? modules : undefined,
      })
    },
    onSuccess: (vacataire) => {
      queryClient.invalidateQueries({ queryKey: ['vacataires'] })
      // Rediriger vers le dossier pour créer le contrat immédiatement
      router.push(`/responsable/vacataires/${vacataire.id}`)
    },
    onError: (err: unknown) => {
      const errorData = (err as { response?: { data?: { message?: string; errors?: Record<string, string> } } })?.response?.data
      let msg = 'Une erreur est survenue. Vérifiez les informations saisies.'

      if (errorData?.message) {
        msg = errorData.message
      } else if (errorData?.errors) {
        const errorsArray = Object.entries(errorData.errors).map(([field, error]) => `${field}: ${error}`)
        msg = errorsArray.join('\n')
      }

      setServerError(msg)
    },
  })

  const onSubmit = (data: FormData) => {
    setServerError(null)
    creer(data)
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Fil d'ariane */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/responsable/vacataires" className="hover:text-gray-800 transition-colors">
          Dossiers vacataires
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Nouveau dossier</span>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold sm:text-2xl text-gray-900">Nouveau dossier vacataire</h2>
        <p className="mt-1 text-sm text-gray-500">
          Créez le dossier du vacataire. Le contrat sera créé depuis le dossier une fois le profil enregistré.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

        {/* ─── Section 1 — Identité ─── */}
        <FormSection title="Identité" subtitle="Informations obligatoires" icon={<PersonIcon />}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Prénom" required error={errors.prenom?.message}>
              <input {...register('prenom')} placeholder="Ex : Mamadou" className={inputCls(!!errors.prenom)} />
            </Field>
            <Field label="Nom" required error={errors.nom?.message}>
              <input {...register('nom')} placeholder="Ex : DIALLO" className={inputCls(!!errors.nom)} />
            </Field>
          </div>
          <Field label="Adresse e-mail" required error={errors.email?.message}>
            <input {...register('email')} type="email" placeholder="mamadou.diallo@ism.edu.sn" className={inputCls(!!errors.email)} />
          </Field>
          <Field label="Profil vacataire" required>
            <select {...register('typeVacataire')} className={inputCls(false)}>
              <option value="STANDARD">Vacataire standard (10 000 FCFA/h)</option>
              <option value="PROFESSEUR_UNIVERSITAIRE">Professeur universitaire (25 000 FCFA/h)</option>
            </select>
          </Field>
        </FormSection>

        {/* ─── Section 2 — Spécialités & Niveaux ─── */}
        <FormSection title="Compétences" subtitle="Spécialités et niveaux d'enseignement habilités" icon={<BookIcon />}>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Spécialités</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {SPECIALITES_OPTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSpecialite(s)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border ${
                    specialites.includes(s)
                      ? 'border-amber-400 bg-amber-50 text-amber-800'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-amber-200'
                  }`}
                >
                  {specialites.includes(s) ? '✓ ' : ''}{s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={specialiteLibre}
                onChange={e => setSpecialiteLibre(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSpecialiteLibre() } }}
                placeholder="Autre spécialité (puis Entrée)"
                className={inputCls(false)}
              />
              <button
                type="button"
                onClick={addSpecialiteLibre}
                className="rounded-xl border border-gray-200 px-3 text-sm text-gray-600 hover:bg-gray-50"
              >
                +
              </button>
            </div>
            {specialites.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {specialites.map(s => (
                  <span key={s} className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs text-amber-800">
                    {s}
                    <button type="button" onClick={() => toggleSpecialite(s)} className="text-amber-600 hover:text-amber-900">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Niveaux d'enseignement habilités</label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {NIVEAUX_OPTIONS.map(n => (
                <label
                  key={n.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-xs transition-colors ${
                    niveaux.includes(n.value)
                      ? 'border-amber-400 bg-amber-50 text-amber-800'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-amber-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={niveaux.includes(n.value)}
                    onChange={() => toggleNiveau(n.value)}
                    className="h-3.5 w-3.5 accent-amber-500"
                  />
                  {n.label}
                </label>
              ))}
            </div>
          </div>
        </FormSection>

        {/* ─── Section 2b — Modules ─── */}
        <FormSection title="Modules" subtitle="Modules que le vacataire peut enseigner" icon={<BookIcon />}>
          <div className="space-y-3">
            <label className="mb-2 block text-sm font-medium text-gray-700">Modules disponibles</label>
            {modulesDispos.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Aucun module disponible. Ajoutez d'abord des modules à la maquette pédagogique.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {modulesDispos.map(m => (
                  <label
                    key={m}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-xs transition-colors ${
                      modules.includes(m)
                        ? 'border-blue-400 bg-blue-50 text-blue-800'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={modules.includes(m)}
                      onChange={() => toggleModule(m)}
                      className="h-3.5 w-3.5 accent-blue-500"
                    />
                    {m}
                  </label>
                ))}
              </div>
            )}
          </div>
        </FormSection>

        {/* ─── Section 3 — Coordonnées ─── */}
        <FormSection title="Coordonnées personnelles" subtitle="Informations de contact (facultatif)" icon={<MapPinIcon />}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Date de naissance">
              <input {...register('dateNaissance')} placeholder="Ex : 15/03/1985" className={inputCls(false)} />
            </Field>
            <Field label="Lieu de naissance">
              <input {...register('lieuNaissance')} placeholder="Ex : Dakar" className={inputCls(false)} />
            </Field>
          </div>
          <Field label="Nationalité">
            <input {...register('nationalite')} placeholder="Ex : Sénégalaise" className={inputCls(false)} />
          </Field>
          <Field label="Numéro CNI / Passeport">
            <input {...register('numeroCni')} placeholder="Ex : 1 234 567 890 12" className={inputCls(false)} />
          </Field>
        </FormSection>

        {/* ─── Section 4 — Informations sociales ─── */}
        <FormSection title="Informations sociales" subtitle="Numéros fiscaux et de retraite" icon={<ShieldIcon />}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="NINEA">
              <input {...register('ninea')} placeholder="Ex : 12345 67 A 23" className={inputCls(false)} />
            </Field>
            <Field label="N° IPRES">
              <input {...register('ipres')} placeholder="Ex : 0001-23456" className={inputCls(false)} />
            </Field>
          </div>
        </FormSection>

        {/* ─── Section 5 — Coordonnées bancaires ─── */}
        <FormSection title="Coordonnées bancaires" subtitle="Informations pour le virement des rémunérations" icon={<BankIcon />}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Numéro de compte">
              <input {...register('numeroCompte')} placeholder="Ex : 12345678901" className={inputCls(false)} />
            </Field>
            <Field label="RIB / Clé">
              <input {...register('rib')} placeholder="Ex : 56" className={inputCls(false)} maxLength={2} />
            </Field>
          </div>
        </FormSection>

        {/* Accès vacataire */}
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <strong>Accès créé automatiquement :</strong> le vacataire recevra un compte avec l'email renseigné
          et le mot de passe temporaire <code className="rounded bg-blue-100 px-1 text-xs">Rhconnect@ISM2026</code>.
          Le contrat sera créé depuis son dossier après enregistrement.
        </div>

        {serverError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 whitespace-pre-wrap">
            {serverError}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2 pb-8">
          <Link href="/responsable/vacataires"
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
            Annuler
          </Link>
          <button type="submit" disabled={isPending}
            className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: '#C88500' }}>
            {isPending ? 'Enregistrement…' : 'Créer le dossier →'}
          </button>
        </div>
      </form>
    </div>
  )
}

/* ── Helpers ── */

function inputCls(hasError: boolean) {
  return `w-full rounded-xl border ${
    hasError ? 'border-red-400' : 'border-gray-200'
  } bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400 transition-colors`
}

function FormSection({ title, subtitle, icon, children }: {
  title: string; subtitle: string; icon: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-orange-50 text-ism-gold">{icon}</div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function PersonIcon() {
  return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
}
function MapPinIcon() {
  return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
}
function ShieldIcon() {
  return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
}
function BankIcon() {
  return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22" /><line x1="6" y1="18" x2="6" y2="11" /><line x1="10" y1="18" x2="10" y2="11" /><line x1="14" y1="18" x2="14" y2="11" /><line x1="18" y1="18" x2="18" y2="11" /><polygon points="12 2 20 7 4 7" /></svg>
}
function BookIcon() {
  return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
}
