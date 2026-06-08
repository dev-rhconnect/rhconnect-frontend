'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { releveService, type StatutReleve } from '@/services/releve.service'

const statutConfig: Record<StatutReleve, { label: string; className: string }> = {
  EN_COURS: { label: 'En cours',  className: 'bg-gray-100 text-gray-600' },
  SOUMIS:   { label: 'Soumis',    className: 'bg-blue-50 text-blue-700' },
  VALIDE:   { label: 'Validé',    className: 'bg-green-50 text-green-700' },
  REJETE:   { label: 'Rejeté',    className: 'bg-red-50 text-red-600' },
}

type Filtre = 'TOUS' | StatutReleve

export default function RPRelevesPage() {
  const [filtre, setFiltre] = useState<Filtre>('TOUS')
  const [search, setSearch] = useState('')

  const { data: releves = [], isLoading, isError } = useQuery({
    queryKey: ['releves-equipe'],
    queryFn: releveService.equipe,
  })

  const filtered = releves.filter((r) => {
    const matchStatut = filtre === 'TOUS' || r.statut === filtre
    const q = search.toLowerCase()
    const matchSearch =
      r.nomVacataire.toLowerCase().includes(q) ||
      r.module.toLowerCase().includes(q) ||
      r.classe.toLowerCase().includes(q) ||
      r.periode.toLowerCase().includes(q)
    return matchStatut && matchSearch
  })

  const counts = {
    TOUS:    releves.length,
    SOUMIS:  releves.filter((r) => r.statut === 'SOUMIS').length,
    VALIDE:  releves.filter((r) => r.statut === 'VALIDE').length,
    REJETE:  releves.filter((r) => r.statut === 'REJETE').length,
  }

  return (
    <div>
      {/* En-tête */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Suivi des relevés d'heures</h2>
        <p className="mt-1 text-sm text-gray-500">Vue d'ensemble des relevés soumis par votre équipe</p>
      </div>

      {/* Filtres */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(['TOUS', 'SOUMIS', 'VALIDE', 'REJETE'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltre(f)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              filtre === f
                ? 'text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
            }`}
            style={filtre === f ? { background: '#C88500' } : undefined}
          >
            {f === 'TOUS' ? 'Tous' : statutConfig[f].label}
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
              filtre === f ? 'bg-white/20' : 'bg-gray-100'
            }`}>
              {f === 'TOUS' ? counts.TOUS : counts[f] ?? 0}
            </span>
          </button>
        ))}

        <div className="relative ml-auto">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="w-52 rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400"
          />
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
        {!isLoading && !isError && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="mb-3 h-12 w-12 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <p className="text-sm font-medium text-gray-900">
              {search || filtre !== 'TOUS' ? 'Aucun résultat' : 'Aucun relevé soumis'}
            </p>
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Vacataire</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Module / Classe</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Période</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Heures</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Volume prévu</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Statut</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Motif rejet</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const cfg = statutConfig[r.statut]
                const ecart = r.volumeHorairePrevisionnel != null
                  ? r.totalHeuresValidees - r.volumeHorairePrevisionnel
                  : null
                return (
                  <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${i === filtered.length - 1 ? '' : 'border-b border-gray-50'}`}>
                    <td className="px-5 py-4 font-medium text-gray-900">{r.nomVacataire}</td>
                    <td className="px-5 py-4 text-gray-600">
                      <p>{r.module}</p>
                      <p className="text-xs text-gray-400">{r.classe}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{r.periode}</td>
                    <td className="px-5 py-4 text-right font-semibold text-gray-900">
                      {r.totalHeuresValidees.toFixed(1)} h
                    </td>
                    <td className="px-5 py-4 text-right text-gray-600">
                      {r.volumeHorairePrevisionnel != null ? (
                        <span>
                          {r.volumeHorairePrevisionnel.toFixed(1)} h
                          {ecart !== null && ecart !== 0 && (
                            <span className={`ml-1 text-xs font-semibold ${ecart > 0 ? 'text-red-500' : 'text-green-600'}`}>
                              {ecart > 0 ? '+' : ''}{ecart.toFixed(1)}h
                            </span>
                          )}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {r.motifRejet ?? '—'}
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
