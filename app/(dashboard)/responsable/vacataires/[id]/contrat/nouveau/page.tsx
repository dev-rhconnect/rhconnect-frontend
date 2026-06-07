'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { vacataireService } from '@/services/vacataire.service'
import { contratService } from '@/services/contrat.service'

const schema = z.object({
  module:                     z.string().min(1, 'Module obligatoire'),
  classe:                     z.string().min(1, 'Classe obligatoire'),
  volumeHorairePrevisionnel:  z.coerce.number().positive('Volume positif requis'),
  tauxHoraire:                z.coerce.number().positive('Taux positif requis'),
  dateDebut:                  z.string().min(1, 'Date de début obligatoire'),
  dateFin:                    z.string().min(1, 'Date de fin obligatoire'),
}).refine((d) => d.dateFin > d.dateDebut, {
  message: 'La date de fin doit être après la date de début',
  path: ['dateFin'],
})

type FormData = z.infer<typeof schema>

export default function NouveauContratPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const parentId = searchParams.get('parentId')
  const vacataireId = Number(id)
  const router = useRouter()
  const qc = useQueryClient()

  const { data: vacataire } = useQuery({
    queryKey: ['vacataires', vacataireId],
    queryFn: () => vacataireService.trouverParId(vacataireId),
  })

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const vol = watch('volumeHorairePrevisionnel')
  const taux = watch('tauxHoraire')
  const montantPrev = vol && taux ? vol * taux : 0

  const { mutate, isPending, error } = useMutation({
    mutationFn: contratService.creer,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['contrats', 'vacataire', vacataireId] })
      router.push(`/responsable/vacataires/${vacataireId}`)
    },
  })

  const onSubmit = (data: FormData) => {
    mutate({
      vacataireId,
      module: data.module,
      classe: data.classe,
      volumeHorairePrevisionnel: data.volumeHorairePrevisionnel,
      tauxHoraire: data.tauxHoraire,
      dateDebut: data.dateDebut,
      dateFin: data.dateFin,
      contratParentId: parentId ? Number(parentId) : undefined,
      estAvenant: !!parentId,
    })
  }

  return (
    <div>
      {/* Navigation */}
      <Link
        href={`/responsable/vacataires/${vacataireId}`}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Retour au profil
      </Link>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {parentId ? 'Nouvel avenant' : 'Nouveau contrat'}
        </h2>
        {vacataire && (
          <p className="mt-1 text-sm text-gray-500">
            Pour <strong>{vacataire.prenom} {vacataire.nom}</strong> · {vacataire.specialite}
          </p>
        )}
        {parentId && (
          <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            Avenant au contrat n° RHC-VAC-{String(parentId).padStart(5, '0')}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {(error as Error).message}
          </div>
        )}

        {/* Section module */}
        <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-gray-900">Contenu pédagogique</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                Module *
              </label>
              <input
                {...register('module')}
                placeholder="ex: Gestion de Projet"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ism-gold/40"
              />
              {errors.module && <p className="mt-1 text-xs text-red-500">{errors.module.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                Classe *
              </label>
              <input
                {...register('classe')}
                placeholder="ex: L3 GLRS"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ism-gold/40"
              />
              {errors.classe && <p className="mt-1 text-xs text-red-500">{errors.classe.message}</p>}
            </div>
          </div>
        </div>

        {/* Section rémunération */}
        <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-gray-900">Rémunération</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                Volume horaire prévisionnel *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  {...register('volumeHorairePrevisionnel')}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ism-gold/40"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">h</span>
              </div>
              {errors.volumeHorairePrevisionnel && (
                <p className="mt-1 text-xs text-red-500">{errors.volumeHorairePrevisionnel.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                Taux horaire *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  {...register('tauxHoraire')}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-ism-gold/40"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">FCFA/h</span>
              </div>
              {errors.tauxHoraire && <p className="mt-1 text-xs text-red-500">{errors.tauxHoraire.message}</p>}
            </div>
          </div>

          {montantPrev > 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <p className="text-xs text-gray-500">Brut prévisionnel</p>
                  <p className="font-bold text-gray-900">{montantPrev.toLocaleString('fr-SN')} FCFA</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Retenue 5 %</p>
                  <p className="font-semibold text-red-600">−{(montantPrev * 0.05).toLocaleString('fr-SN', { maximumFractionDigits: 0 })} FCFA</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Net estimé</p>
                  <p className="font-bold text-green-700">{(montantPrev * 0.95).toLocaleString('fr-SN', { maximumFractionDigits: 0 })} FCFA</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section dates */}
        <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-gray-900">Période</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                Date de début *
              </label>
              <input
                type="date"
                {...register('dateDebut')}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ism-gold/40"
              />
              {errors.dateDebut && <p className="mt-1 text-xs text-red-500">{errors.dateDebut.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                Date de fin *
              </label>
              <input
                type="date"
                {...register('dateFin')}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ism-gold/40"
              />
              {errors.dateFin && <p className="mt-1 text-xs text-red-500">{errors.dateFin.message}</p>}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/responsable/vacataires/${vacataireId}`}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
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
            Créer le contrat
          </button>
        </div>
      </form>
    </div>
  )
}
