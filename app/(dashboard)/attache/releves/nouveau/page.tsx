'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { contratService } from '@/services/contrat.service'
import { releveService, type FeuilleHeureResponse } from '@/services/releve.service'

export default function NouveauRelevePage() {
  const router = useRouter()

  const [contratId, setContratId] = useState('')
  const [periode, setPeriode] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [erreur, setErreur] = useState('')

  const { data: contrats = [], isLoading: loadingContrats } = useQuery({
    queryKey: ['contrats-actifs'],
    queryFn: contratService.listerActifs,
  })

  const { mutate: creer, isPending } = useMutation({
    mutationFn: () =>
      releveService.creer({ contratId: Number(contratId), periode }),
    onSuccess: (releve: FeuilleHeureResponse) => {
      router.push(`/attache/releves/${releve.id}/saisir`)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setErreur(msg ?? 'Erreur lors de la création du relevé.')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    if (!contratId) { setErreur('Sélectionnez un contrat.'); return }
    if (!periode) { setErreur('Renseignez la période.'); return }
    creer()
  }

  const contratSelectionne = contrats.find((c) => c.id === Number(contratId))

  return (
    <div className="mx-auto max-w-xl">
      {/* En-tête */}
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
          Choisissez le contrat et la période pour commencer la saisie des séances.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm space-y-5">
        {/* Contrat */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Contrat vacataire <span className="text-red-500">*</span>
          </label>
          {loadingContrats ? (
            <div className="h-10 rounded-xl bg-gray-100 animate-pulse" />
          ) : (
            <select
              value={contratId}
              onChange={(e) => setContratId(e.target.value)}
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

        {/* Aperçu contrat sélectionné */}
        {contratSelectionne && (
          <div className="rounded-xl bg-orange-50 px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Vacataire</span>
              <span className="font-semibold text-gray-900">{contratSelectionne.nomVacataire}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-500">Module</span>
              <span className="font-semibold text-gray-900">{contratSelectionne.module}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-500">Classe</span>
              <span className="text-gray-700">{contratSelectionne.classe}</span>
            </div>
            {contratSelectionne.volumeHorairePrevisionnel && (
              <div className="flex justify-between mt-1">
                <span className="text-gray-500">Volume prévu</span>
                <span className="text-gray-700">{contratSelectionne.volumeHorairePrevisionnel} h</span>
              </div>
            )}
          </div>
        )}

        {/* Période */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Période <span className="text-red-500">*</span>
          </label>
          <input
            type="month"
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-amber-400"
          />
          <p className="mt-1 text-xs text-gray-400">Mois concerné par ce relevé d'heures.</p>
        </div>

        {/* Erreur */}
        {erreur && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{erreur}</div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending || !contratId}
          className="w-full rounded-xl py-3 text-sm font-bold text-white transition-colors disabled:opacity-50"
          style={{ background: '#C88500' }}
        >
          {isPending ? 'Création…' : 'Créer le relevé et saisir les séances →'}
        </button>
      </form>
    </div>
  )
}
