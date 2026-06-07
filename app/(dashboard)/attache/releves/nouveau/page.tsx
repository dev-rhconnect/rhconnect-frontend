'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { releveService } from '@/services/releve.service'
import { contratService } from '@/services/contrat.service'

const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function periodeOptions() {
  const options = []
  const now = new Date()
  for (let i = -1; i <= 2; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    options.push(`${MOIS[d.getMonth()]} ${d.getFullYear()}`)
  }
  return options
}

const schema = z.object({
  contratId: z.coerce.number().min(1, 'Sélectionnez un contrat'),
  periode:   z.string().min(1, 'Sélectionnez une période'),
})

type FormData = z.infer<typeof schema>

export default function NouveauRelevePage() {
  const router = useRouter()
  const qc = useQueryClient()

  const { data: contrats = [], isLoading: contratsLoading } = useQuery({
    queryKey: ['contrats'],
    queryFn: contratService.listerTous,
  })

  const contratsActifs = contrats.filter((c) => c.statut === 'ACTIF')

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      periode: periodeOptions()[1], // mois courant
    },
  })

  const selectedContratId = watch('contratId')
  const selectedContrat = contrats.find((c) => c.id === Number(selectedContratId))

  const { mutate, isPending, error } = useMutation({
    mutationFn: releveService.creer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['releves'] })
      router.push('/attache/releves')
    },
  })

  const onSubmit = (data: FormData) => {
    mutate({ contratId: data.contratId, periode: data.periode })
  }

  return (
    <div>
      {/* Navigation */}
      <Link
        href="/attache/releves"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Retour aux relevés
      </Link>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Nouveau relevé mensuel</h2>
        <p className="mt-1 text-sm text-gray-500">
          Créez un nouveau relevé d'heures pour un module et une période donnés.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl bg-white p-6 shadow-sm space-y-5">

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {(error as Error).message}
          </div>
        )}

        {/* Contrat */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
            Contrat *
          </label>
          {contratsLoading ? (
            <div className="h-10 rounded-xl bg-gray-100 animate-pulse" />
          ) : contratsActifs.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Aucun contrat actif disponible. Contactez votre Responsable de Programme.
            </div>
          ) : (
            <select
              {...register('contratId')}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ism-gold/40"
            >
              <option value="">— Sélectionnez un contrat —</option>
              {contratsActifs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.module} · {c.classe} ({c.nomVacataire})
                </option>
              ))}
            </select>
          )}
          {errors.contratId && <p className="mt-1 text-xs text-red-500">{errors.contratId.message}</p>}
        </div>

        {/* Aperçu contrat sélectionné */}
        {selectedContrat && (
          <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm">
            <p className="font-semibold text-gray-900">{selectedContrat.module} — {selectedContrat.classe}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
              <span>Volume : {selectedContrat.volumeHorairePrevisionnel} h</span>
              <span>Taux : {selectedContrat.tauxHoraire.toLocaleString('fr-SN')} FCFA/h</span>
              <span>Vacataire : {selectedContrat.nomVacataire}</span>
              <span>
                {new Date(selectedContrat.dateDebut).toLocaleDateString('fr-SN')} →{' '}
                {new Date(selectedContrat.dateFin).toLocaleDateString('fr-SN')}
              </span>
            </div>
          </div>
        )}

        {/* Période */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
            Période *
          </label>
          <select
            {...register('periode')}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ism-gold/40"
          >
            {periodeOptions().map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          {errors.periode && <p className="mt-1 text-xs text-red-500">{errors.periode.message}</p>}
          <p className="mt-1 text-xs text-gray-400">
            Un seul relevé par contrat et par période.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/attache/releves"
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={isPending || contratsActifs.length === 0}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: '#1C0800' }}
          >
            {isPending && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
              </svg>
            )}
            Créer le relevé
          </button>
        </div>
      </form>
    </div>
  )
}
