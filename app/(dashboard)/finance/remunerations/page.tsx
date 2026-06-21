'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { paiementService, type PaiementResponse } from '@/services/paiement.service'

const statutConfig: Record<string, { label: string; bg: string; color: string }> = {
  EN_ATTENTE: { label: 'En attente', bg: '#FEF9C3', color: '#854D0E' },
  VALIDE:     { label: 'Validé',     bg: '#DCFCE7', color: '#166534' },
  PAYE:       { label: 'Payé',       bg: '#D1FAE5', color: '#065F46' },
}

function formatFCFA(v: number) {
  return v.toLocaleString('fr-FR') + ' FCFA'
}

export default function FinanceRemunerationsPage() {
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)
  const [search, setSearch] = useState('')

  const { data: fiches = [], isLoading, isError } = useQuery({
    queryKey: ['fiches-paie-toutes'],
    queryFn: paiementService.listerTous,
  })

  const { mutate: telecharger } = useMutation({
    mutationFn: async (id: number) => {
      setDownloadingId(id)
      await paiementService.telechargerPdf(id)
    },
    onSettled: () => setDownloadingId(null),
  })

  const filtered = fiches.filter(f =>
    !search || f.nomVacataire.toLowerCase().includes(search.toLowerCase()) || f.periode.includes(search)
  )

  const totalBrut = filtered.reduce((s, f) => s + f.montantBrut, 0)
  const totalNet  = filtered.reduce((s, f) => s + f.montantNet,  0)
  const totalH    = filtered.reduce((s, f) => s + f.totalHeures, 0)

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rémunérations</h2>
          <p className="mt-1 text-sm text-gray-500">Fiches de paie générées automatiquement après validation des relevés</p>
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
          {exporting ? 'Export…' : 'Export BC365 (CSV)'}
        </button>
      </div>

      {/* KPIs */}
      <div className="mb-5 grid grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Fiches générées</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{filtered.length}</p>
          <p className="mt-0.5 text-xs text-gray-400">{totalH.toFixed(1)} h au total</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Montant brut</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totalBrut.toLocaleString('fr-FR')}</p>
          <p className="mt-0.5 text-xs text-gray-400">FCFA</p>
        </div>
        <div className="rounded-2xl border-2 border-amber-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#C88500' }}>Net à payer</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totalNet.toLocaleString('fr-FR')}</p>
          <p className="mt-0.5 text-xs text-gray-400">FCFA (après retenue 5%)</p>
        </div>
      </div>

      {/* Recherche */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par vacataire ou période…"
          className="w-full max-w-sm rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
        />
      </div>

      {/* Tableau */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">Chargement…</div>
        )}
        {isError && (
          <div className="flex items-center justify-center py-16 text-sm text-red-500">Erreur de chargement.</div>
        )}
        {!isLoading && !isError && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <svg className="mb-3 h-12 w-12 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <p className="text-sm font-medium text-gray-900">Aucune fiche de paie</p>
            <p className="mt-1 text-xs text-gray-400">
              {search ? 'Aucun résultat pour cette recherche.' : 'Les fiches sont générées automatiquement après validation des relevés.'}
            </p>
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Vacataire</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Période</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Heures</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Taux</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Brut</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Retenue 5%</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Net</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Statut</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">PDF</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f, i) => {
                const s = statutConfig[f.statut] ?? statutConfig.EN_ATTENTE
                return (
                  <tr key={f.id} className={`hover:bg-gray-50 transition-colors ${i < filtered.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <td className="px-5 py-4 font-semibold text-gray-900">{f.nomVacataire}</td>
                    <td className="px-5 py-4 text-gray-600">{f.periode}</td>
                    <td className="px-5 py-4 text-right text-gray-700 font-medium">{f.totalHeures.toFixed(1)} h</td>
                    <td className="px-5 py-4 text-right text-gray-500 text-xs">{f.tauxHoraire.toLocaleString('fr-FR')} F/h</td>
                    <td className="px-5 py-4 text-right text-gray-700">{f.montantBrut.toLocaleString('fr-FR')}</td>
                    <td className="px-5 py-4 text-right text-red-500">−{f.retenueFiscale.toLocaleString('fr-FR')}</td>
                    <td className="px-5 py-4 text-right font-bold text-gray-900">{f.montantNet.toLocaleString('fr-FR')}</td>
                    <td className="px-5 py-4 text-center">
                      <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{ background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => telecharger(f.id)}
                        disabled={downloadingId === f.id}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                        style={{ background: '#C88500' }}
                      >
                        {downloadingId === f.id ? (
                          'PDF…'
                        ) : (
                          <>
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            PDF
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
