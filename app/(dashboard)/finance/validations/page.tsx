'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { releveService } from '@/services/releve.service'
import { paiementService } from '@/services/paiement.service'
import { useState } from 'react'

export default function FinanceValidationsPage() {
  const [exporting, setExporting] = useState(false)

  const { data: releves = [], isLoading, isError } = useQuery({
    queryKey: ['releves-soumis'],
    queryFn: releveService.listerSoumis,
  })

  function heuresSoumises(r: (typeof releves)[0]) {
    return r.lignes.filter((l) => l.statut !== 'REJETEE').reduce((acc, l) => acc + (l.duree ?? 0), 0)
  }

  const totalHeures = releves.reduce((acc, r) => acc + heuresSoumises(r), 0)

  return (
    <div>
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
        {isLoading && <div className="flex items-center justify-center py-16 text-sm text-gray-400">Chargement…</div>}
        {isError && <div className="flex items-center justify-center py-16 text-sm text-red-500">Erreur de chargement.</div>}

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
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Heures soumises</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Volume prévu</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Statut</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {releves.map((r, i) => {
                const heures = heuresSoumises(r)
                const ecart = r.volumeHorairePrevisionnel != null ? heures - r.volumeHorairePrevisionnel : null
                return (
                  <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${i === releves.length - 1 ? '' : 'border-b border-gray-50'}`}>
                    <td className="px-5 py-4 font-medium text-gray-900">{r.nomVacataire}</td>
                    <td className="px-5 py-4 text-gray-600">
                      <p>{r.module}</p>
                      <p className="text-xs text-gray-400">{r.classe}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{r.periode}</td>
                    <td className="px-5 py-4 text-right font-semibold text-gray-900">
                      {heures.toFixed(1)} h
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
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                        Soumis
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/finance/validations/${r.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                      >
                        Voir plus
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </Link>
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
