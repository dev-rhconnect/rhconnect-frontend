'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { contratService } from '@/services/contrat.service'
import { releveService } from '@/services/releve.service'
import { seanceService, type SeanceProgrammeeResponse } from '@/services/seance.service'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })
}

function formatHeure(t: string) {
  return t.slice(0, 5)
}

export default function NouveauRelevePage() {
  const router = useRouter()

  const [contratId, setContratId] = useState('')
  const [periode, setPeriode] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [selection, setSelection] = useState<Set<number>>(new Set())
  const [erreur, setErreur] = useState('')

  const { data: contrats = [], isLoading: loadingContrats } = useQuery({
    queryKey: ['contrats-actifs'],
    queryFn: contratService.listerActifs,
  })

  const contratSelectionne = contrats.find((c) => c.id === Number(contratId))

  const { data: seancesDisponibles = [], isLoading: loadingSeances } = useQuery({
    queryKey: ['seances-realisees', contratId, periode],
    queryFn: () => seanceService.realiseesPourPeriode(Number(contratId), periode),
    enabled: !!contratId && !!periode,
  })

  const { mutate: creer, isPending } = useMutation({
    mutationFn: async () => {
      const releve = await releveService.creer({ contratId: Number(contratId), periode })
      if (selection.size > 0) {
        await releveService.importerSeances(releve.id, Array.from(selection))
      }
      return releve
    },
    onSuccess: (releve) => {
      router.push(`/attache/releves/${releve.id}/saisir`)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setErreur(msg ?? 'Erreur lors de la création du relevé.')
    },
  })

  function toggleSelection(id: number) {
    setSelection((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selection.size === seancesDisponibles.length) {
      setSelection(new Set())
    } else {
      setSelection(new Set(seancesDisponibles.map((s) => s.id)))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    if (!contratId) { setErreur('Sélectionnez un contrat.'); return }
    if (!periode) { setErreur('Renseignez la période.'); return }
    creer()
  }

  const totalSelectionne = Array.from(selection).reduce((acc, sid) => {
    const s = seancesDisponibles.find((x) => x.id === sid)
    return acc + (s?.duree ?? 0)
  }, 0)

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Retour
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Nouveau relevé d'heures</h2>
        <p className="mt-1 text-sm text-gray-500">
          Choisissez le contrat et la période — les séances réalisées s'afficheront pour sélection.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Contrat + Période */}
        <div className="rounded-2xl bg-white p-6 shadow-sm space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Contrat vacataire <span className="text-red-500">*</span>
            </label>
            {loadingContrats ? (
              <div className="h-10 rounded-xl bg-gray-100 animate-pulse" />
            ) : (
              <select
                value={contratId}
                onChange={(e) => { setContratId(e.target.value); setSelection(new Set()) }}
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-amber-400"
              >
                <option value="">Sélectionner un contrat…</option>
                {contrats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nomVacataire} — {c.module} ({c.classe})
                  </option>
                ))}
              </select>
            )}
            {contrats.length === 0 && !loadingContrats && (
              <p className="mt-1 text-xs text-orange-600">Aucun contrat actif disponible.</p>
            )}
          </div>

          {contratSelectionne && (
            <div className="rounded-xl bg-orange-50 px-4 py-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Vacataire</span>
                <span className="font-semibold text-gray-900">{contratSelectionne.nomVacataire}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Module</span>
                <span className="font-semibold text-gray-900">{contratSelectionne.module}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Classe</span>
                <span className="text-gray-700">{contratSelectionne.classe}</span>
              </div>
              {contratSelectionne.volumeHorairePrevisionnel && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Volume prévu</span>
                  <span className="text-gray-700">{contratSelectionne.volumeHorairePrevisionnel} h</span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Période <span className="text-red-500">*</span>
            </label>
            <input
              type="month"
              value={periode}
              onChange={(e) => { setPeriode(e.target.value); setSelection(new Set()) }}
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-amber-400"
            />
            <p className="mt-1 text-xs text-gray-400">Mois concerné par ce relevé d'heures.</p>
          </div>
        </div>

        {/* Séances réalisées à cocher */}
        {contratId && periode && (
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Séances réalisées</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Cochez les séances à inclure dans ce relevé
                </p>
              </div>
              {seancesDisponibles.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-xs font-semibold text-amber-600 hover:underline"
                >
                  {selection.size === seancesDisponibles.length ? 'Tout décocher' : 'Tout cocher'}
                </button>
              )}
            </div>

            {loadingSeances ? (
              <div className="flex items-center justify-center py-10 text-sm text-gray-400">
                Chargement des séances…
              </div>
            ) : seancesDisponibles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-6">
                <svg className="mb-2 h-8 w-8 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                <p className="text-sm text-gray-500">Aucune séance réalisée pour ce contrat sur cette période.</p>
                <p className="text-xs text-gray-400 mt-1">Vous pourrez saisir les séances manuellement après création.</p>
              </div>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="w-10 px-4 py-3" />
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Horaires</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Durée</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Salle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seancesDisponibles.map((s: SeanceProgrammeeResponse, i) => {
                      const checked = selection.has(s.id)
                      return (
                        <tr
                          key={s.id}
                          onClick={() => toggleSelection(s.id)}
                          className={`cursor-pointer transition-colors ${i < seancesDisponibles.length - 1 ? 'border-b border-gray-50' : ''} ${checked ? 'bg-amber-50' : 'hover:bg-gray-50'}`}
                        >
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSelection(s.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-4 w-4 rounded border-gray-300 accent-amber-500"
                            />
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">{formatDate(s.dateSeance)}</td>
                          <td className="px-4 py-3 text-gray-600">{formatHeure(s.heureDebut)} – {formatHeure(s.heureFin)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">{s.duree.toFixed(1)} h</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{s.typeSeance ?? '—'}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{s.salle ?? '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {selection.size > 0 && (
                  <div className="border-t border-gray-100 bg-amber-50 px-5 py-3 text-sm text-amber-800 font-medium">
                    {selection.size} séance{selection.size > 1 ? 's' : ''} sélectionnée{selection.size > 1 ? 's' : ''} — {totalSelectionne.toFixed(1)} h
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {erreur && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{erreur}</div>
        )}

        <button
          type="submit"
          disabled={isPending || !contratId}
          className="w-full rounded-xl py-3 text-sm font-bold text-white transition-colors disabled:opacity-50"
          style={{ background: '#C88500' }}
        >
          {isPending
            ? 'Création…'
            : selection.size > 0
            ? `Créer le relevé avec ${selection.size} séance${selection.size > 1 ? 's' : ''} (${totalSelectionne.toFixed(1)} h)`
            : 'Créer le relevé'}
        </button>
      </form>
    </div>
  )
}
