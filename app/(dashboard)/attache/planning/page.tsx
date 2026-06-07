'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import { interventionService } from '@/services/intervention.service'
import { releveService } from '@/services/releve.service'

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']

const saisieSchema = z.object({
  feuilleHeureId: z.coerce.number().min(1, 'Sélectionnez un relevé'),
  date:           z.string().min(1, 'Date obligatoire'),
  heureDebut:     z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM'),
  heureFin:       z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM'),
  observation:    z.string().optional(),
}).refine((d) => d.heureFin > d.heureDebut, {
  message: 'L\'heure de fin doit être après l\'heure de début',
  path: ['heureFin'],
})

type SaisieForm = z.infer<typeof saisieSchema>

function getDebutSemaine(date: Date): Date {
  const d = new Date(date)
  const jour = d.getDay()
  const diff = jour === 0 ? -6 : 1 - jour
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDate(date: Date) {
  return date.toLocaleDateString('fr-SN', { day: '2-digit', month: 'short' })
}

function toInputDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export default function PlanningPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [semaineDebut, setSemaineDebut] = useState(() => getDebutSemaine(new Date()))
  const [modalOuvert, setModalOuvert] = useState(false)
  const [jourSelectionne, setJourSelectionne] = useState<Date | null>(null)

  const semaineFin = new Date(semaineDebut)
  semaineFin.setDate(semaineFin.getDate() + 4)

  const joursAvecDates = JOURS.map((nom, i) => {
    const d = new Date(semaineDebut)
    d.setDate(d.getDate() + i)
    return { nom, date: d }
  })

  const { data: releves = [] } = useQuery({
    queryKey: ['releves', 'mes-releves'],
    queryFn: releveService.mesReleves,
  })

  const relevesEnCours = releves.filter((r) => r.statut === 'EN_COURS')

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<SaisieForm>({
    resolver: zodResolver(saisieSchema),
  })

  const { mutate: saisir, isPending, error: saisieError } = useMutation({
    mutationFn: interventionService.saisir,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['releves'] })
      setModalOuvert(false)
      reset()
    },
  })

  const ouvrirModal = (date?: Date) => {
    setJourSelectionne(date ?? new Date())
    if (date) setValue('date', toInputDate(date))
    setModalOuvert(true)
  }

  const fermerModal = () => {
    setModalOuvert(false)
    reset()
  }

  const onSubmit = (data: SaisieForm) => {
    saisir({
      feuilleHeureId: data.feuilleHeureId,
      date: data.date,
      heureDebut: data.heureDebut + ':00',
      heureFin: data.heureFin + ':00',
      observation: data.observation,
    })
  }

  const isAujourdHui = (date: Date) =>
    date.toDateString() === new Date().toDateString()

  return (
    <div>
      {/* En-tête */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Planning hebdomadaire</h2>
          <p className="mt-1 text-sm text-gray-500">
            Bonjour, {user?.prenom ?? 'Attaché'} — semaine du {formatDate(semaineDebut)} au {formatDate(semaineFin)}
          </p>
        </div>
        <button
          onClick={() => ouvrirModal()}
          disabled={relevesEnCours.length === 0}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: '#C88500' }}
          title={relevesEnCours.length === 0 ? 'Créez d\'abord un relevé mensuel' : 'Saisir une séance'}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Saisir une séance
        </button>
      </div>

      {relevesEnCours.length === 0 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Aucun relevé en cours. Créez un nouveau relevé mensuel dans l'onglet <strong>Relevés</strong> pour saisir des séances.
        </div>
      )}

      {/* Navigation semaine */}
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => { const d = new Date(semaineDebut); d.setDate(d.getDate() - 7); setSemaineDebut(d) }}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          onClick={() => setSemaineDebut(getDebutSemaine(new Date()))}
          className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Aujourd'hui
        </button>
        <button
          onClick={() => { const d = new Date(semaineDebut); d.setDate(d.getDate() + 7); setSemaineDebut(d) }}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <span className="ml-2 text-sm font-semibold text-gray-700">
          {semaineDebut.toLocaleDateString('fr-SN', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Grille calendaire */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="grid grid-cols-5 border-b border-gray-100">
          {joursAvecDates.map(({ nom, date }) => (
            <div key={nom} className={`px-4 py-3 text-center ${isAujourdHui(date) ? 'bg-amber-50' : ''}`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{nom}</p>
              <p className={`mt-0.5 text-lg font-bold ${isAujourdHui(date) ? 'text-ism-gold' : 'text-gray-800'}`}>
                {date.getDate()}
              </p>
              <p className="text-xs text-gray-400">{formatDate(date).split(' ')[1]}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-5 min-h-[380px]">
          {joursAvecDates.map(({ nom, date }) => (
            <div key={nom} className={`border-r border-gray-50 last:border-r-0 p-3 ${isAujourdHui(date) ? 'bg-amber-50/30' : ''}`}>
              <button
                onClick={() => relevesEnCours.length > 0 && ouvrirModal(date)}
                disabled={relevesEnCours.length === 0}
                className="flex w-full flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-gray-100 hover:border-amber-300 hover:bg-amber-50/50 transition-colors disabled:pointer-events-none"
              >
                <svg className="mb-1 h-5 w-5 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span className="text-xs text-gray-300">Cliquez pour saisir</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-amber-200" />
          Séance saisie
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-green-200" />
          Séance validée
        </div>
      </div>

      {/* Modal saisie séance */}
      {modalOuvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Saisir une séance</h3>
              <button onClick={fermerModal} className="text-gray-400 hover:text-gray-600">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              {saisieError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {(saisieError as Error).message}
                </div>
              )}

              {/* Relevé */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                  Relevé mensuel *
                </label>
                <select
                  {...register('feuilleHeureId')}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ism-gold/40"
                >
                  <option value="">— Sélectionnez un relevé —</option>
                  {relevesEnCours.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.module} · {r.periode}
                    </option>
                  ))}
                </select>
                {errors.feuilleHeureId && <p className="mt-1 text-xs text-red-500">{errors.feuilleHeureId.message}</p>}
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                  Date *
                </label>
                <input
                  type="date"
                  {...register('date')}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ism-gold/40"
                />
                {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date.message}</p>}
              </div>

              {/* Heures */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                    Heure de début *
                  </label>
                  <input
                    type="time"
                    {...register('heureDebut')}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ism-gold/40"
                  />
                  {errors.heureDebut && <p className="mt-1 text-xs text-red-500">{errors.heureDebut.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                    Heure de fin *
                  </label>
                  <input
                    type="time"
                    {...register('heureFin')}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ism-gold/40"
                  />
                  {errors.heureFin && <p className="mt-1 text-xs text-red-500">{errors.heureFin.message}</p>}
                </div>
              </div>

              {/* Observation */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                  Observation
                </label>
                <input
                  {...register('observation')}
                  placeholder="Facultatif"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ism-gold/40"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={fermerModal}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: '#C88500' }}
                >
                  {isPending && (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                    </svg>
                  )}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
