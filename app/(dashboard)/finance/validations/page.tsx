'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { releveService, type FeuilleHeureResponse } from '@/services/releve.service'
import { paiementService } from '@/services/paiement.service'

const statutConfig = {
  EN_COURS:  { label: 'En cours',    className: 'bg-gray-100 text-gray-600' },
  SOUMIS:    { label: 'Soumis',      className: 'bg-blue-50 text-blue-700' },
  VALIDE:    { label: 'Validé',      className: 'bg-green-50 text-green-700' },
  REJETE:    { label: 'Rejeté',      className: 'bg-red-50 text-red-600' },
} as const

export default function FinanceValidationsPage() {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<FeuilleHeureResponse | null>(null)
  const [motif, setMotif] = useState('')
  const [action, setAction] = useState<'valider' | 'rejeter' | null>(null)
  const [exporting, setExporting] = useState(false)

  const { data: releves = [], isLoading, isError } = useQuery({
    queryKey: ['releves-soumis'],
    queryFn: releveService.listerSoumis,
  })

  const { mutate: valider, isPending: validating } = useMutation({
    mutationFn: (id: number) => releveService.valider(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['releves-soumis'] })
      closeModal()
    },
  })

  const { mutate: rejeter, isPending: rejecting } = useMutation({
    mutationFn: ({ id, motif }: { id: number; motif: string }) => releveService.rejeter(id, motif),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['releves-soumis'] })
      closeModal()
    },
  })

  function openModal(releve: FeuilleHeureResponse, type: 'valider' | 'rejeter') {
    setSelected(releve)
    setAction(type)
    setMotif('')
  }

  function closeModal() {
    setSelected(null)
    setAction(null)
    setMotif('')
  }

  function confirmer() {
    if (!selected) return
    if (action === 'valider') valider(selected.id)
    else if (action === 'rejeter') rejeter({ id: selected.id, motif })
  }

  const totalHeures = releves.reduce((acc, r) => acc + (r.totalHeuresValidees ?? 0), 0)

  return (
    <div>
      {/* En-tête */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Validation des relevés</h2>
          <p className="mt-1 text-sm text-gray-500">
            {releves.length} relevé{releves.length !== 1 ? 's' : ''} en attente de validation
          </p>
        </div>
        <button
          onClick={async () => {
            setExporting(true)
            try { await paiementService.exporterBC365() } finally { setExporting(false) }
          }}
          disabled={exporting}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-colors"
          style={{ background: '#1C6E3D' }}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {exporting ? 'Export…' : 'Exporter BC365 (CSV)'}
        </button>
      </div>

      {/* KPI */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Relevés soumis</p>
          <p className="mt-1 text-4xl font-bold text-gray-900">{releves.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Volume horaire total déclaré</p>
          <p className="mt-1 text-4xl font-bold text-gray-900">{totalHeures.toFixed(1)} h</p>
        </div>
      </div>

      {/* Tableau */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">Chargement…</div>
        )}
        {isError && (
          <div className="flex items-center justify-center py-16 text-sm text-red-500">Erreur de chargement.</div>
        )}
        {!isLoading && !isError && releves.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="mb-3 h-12 w-12 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <p className="text-sm font-medium text-gray-900">Aucun relevé en attente</p>
            <p className="mt-1 text-xs text-gray-400">Tous les relevés ont été traités.</p>
          </div>
        )}

        {!isLoading && !isError && releves.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Vacataire</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Module / Classe</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Période</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Heures déclarées</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Volume prévu</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Statut</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {releves.map((r, i) => {
                const cfg = statutConfig[r.statut]
                const ecart = r.volumeHorairePrevisionnel != null
                  ? r.totalHeuresValidees - r.volumeHorairePrevisionnel
                  : null
                return (
                  <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${i === releves.length - 1 ? '' : 'border-b border-gray-50'}`}>
                    <td className="px-5 py-4 font-medium text-gray-900">{r.nomVacataire}</td>
                    <td className="px-5 py-4 text-gray-600">
                      <p>{r.module}</p>
                      <p className="text-xs text-gray-400">{r.classe}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{r.periode}</td>
                    <td className="px-5 py-4 text-right font-semibold text-gray-900">
                      {r.totalHeuresValidees.toFixed(1)} h
                    </td>
                    <td className="px-5 py-4 text-right">
                      {r.volumeHorairePrevisionnel != null ? (
                        <span>
                          {r.volumeHorairePrevisionnel.toFixed(1)} h
                          {ecart !== null && ecart !== 0 && (
                            <span className={`ml-1.5 text-xs font-semibold ${ecart > 0 ? 'text-red-500' : 'text-green-600'}`}>
                              {ecart > 0 ? '+' : ''}{ecart.toFixed(1)}h
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {r.statut === 'SOUMIS' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openModal(r, 'valider')}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                            style={{ background: '#C88500' }}
                          >
                            Valider
                          </button>
                          <button
                            onClick={() => openModal(r, 'rejeter')}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                          >
                            Rejeter
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal confirmation */}
      {selected && action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900">
              {action === 'valider' ? 'Valider le relevé' : 'Rejeter le relevé'}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {selected.nomVacataire} — {selected.module} — {selected.periode}
            </p>

            {action === 'valider' && (
              <div className="mt-4 rounded-xl bg-green-50 p-4">
                <p className="text-sm font-semibold text-green-800">
                  Total heures à valider : {selected.totalHeuresValidees.toFixed(1)} h
                </p>
                {selected.volumeHorairePrevisionnel != null && (
                  <p className="text-xs text-green-600 mt-1">
                    Volume prévu : {selected.volumeHorairePrevisionnel.toFixed(1)} h
                  </p>
                )}
              </div>
            )}

            {action === 'rejeter' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motif du rejet <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  rows={3}
                  placeholder="Expliquez la raison du rejet…"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={closeModal}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmer}
                disabled={(action === 'rejeter' && !motif.trim()) || validating || rejecting}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
                  action === 'valider' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {validating || rejecting ? 'En cours…' : action === 'valider' ? 'Confirmer la validation' : 'Confirmer le rejet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
