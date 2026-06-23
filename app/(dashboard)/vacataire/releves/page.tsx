'use client'

import { useQuery } from '@tanstack/react-query'
import { releveService, type StatutReleve } from '@/services/releve.service'

const STATUT_INFO: Record<StatutReleve, { label: string; bg: string; text: string }> = {
  EN_COURS:       { label: 'En cours',         bg: 'bg-gray-100',   text: 'text-gray-700' },
  SOUMIS:         { label: 'Soumis',           bg: 'bg-blue-50',    text: 'text-blue-700' },
  SOUMIS_RP:      { label: 'Soumis au RP',     bg: 'bg-blue-50',    text: 'text-blue-700' },
  VALIDE_RP:      { label: 'Validé par le RP', bg: 'bg-indigo-50',  text: 'text-indigo-700' },
  SOUMIS_FINANCE: { label: 'Transmis Finance', bg: 'bg-amber-50',   text: 'text-amber-700' },
  VALIDE:         { label: 'Validé ✓',         bg: 'bg-green-50',   text: 'text-green-700' },
  REJETE:         { label: 'Rejeté',           bg: 'bg-red-50',     text: 'text-red-600' },
}

export default function VacataireRelevesPage() {
  const { data: releves = [], isLoading, isError } = useQuery({
    queryKey: ['mes-releves-valides'],
    queryFn: releveService.mesRelevesValides,
  })

  const totalHeures  = releves.filter(r => r.statut === 'VALIDE').reduce((acc, r) => acc + r.totalHeuresValidees, 0)
  const nbValides    = releves.filter(r => r.statut === 'VALIDE').length
  const nbEnCours    = releves.filter(r => r.statut === 'EN_COURS').length

  return (
    <div>
      {/* En-tête */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Mes relevés d'heures</h2>
        <p className="mt-1 text-sm text-gray-500">Suivi de tous vos relevés, du dépôt jusqu'à la validation Finance</p>
      </div>

      {/* KPI */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total relevés</p>
          <p className="mt-1 text-4xl font-bold text-gray-900">{releves.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Heures validées</p>
          <p className="mt-1 text-4xl font-bold text-green-700">{totalHeures.toFixed(1)} h</p>
          <p className="text-xs text-gray-400 mt-0.5">{nbValides} relevé{nbValides !== 1 ? 's' : ''} validé{nbValides !== 1 ? 's' : ''}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">En cours de saisie</p>
          <p className="mt-1 text-4xl font-bold text-amber-700">{nbEnCours}</p>
        </div>
      </div>

      {/* Liste */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden border border-gray-100">
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">Chargement…</div>
        )}
        {isError && (
          <div className="flex items-center justify-center py-16 text-sm text-red-500">Erreur de chargement.</div>
        )}
        {!isLoading && !isError && releves.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="mb-3 h-12 w-12 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <p className="text-sm font-medium text-gray-900">Aucun relevé</p>
            <p className="mt-1 text-xs text-gray-400">Vos relevés apparaîtront ici dès qu'ils seront créés par votre attaché.</p>
          </div>
        )}

        {!isLoading && !isError && releves.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Module</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Classe</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Période</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Heures</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">VH prévu</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Statut</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {releves.map(r => {
                const si = STATUT_INFO[r.statut] ?? STATUT_INFO.EN_COURS
                const ecart = r.volumeHorairePrevisionnel != null
                  ? r.totalHeuresValidees - r.volumeHorairePrevisionnel : null
                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-gray-900">{r.module ?? '—'}</td>
                    <td className="px-5 py-4 text-gray-600 text-xs">{r.classe ?? '—'}</td>
                    <td className="px-5 py-4 text-gray-600 text-xs">{r.periode}</td>
                    <td className="px-5 py-4 text-right font-bold text-gray-900">
                      {r.totalHeuresValidees.toFixed(1)} h
                    </td>
                    <td className="px-5 py-4 text-right text-gray-500 text-xs">
                      {r.volumeHorairePrevisionnel != null ? (
                        <span>
                          {r.volumeHorairePrevisionnel.toFixed(1)} h
                          {ecart !== null && ecart !== 0 && (
                            <span className={`ml-1 font-semibold ${ecart > 0 ? 'text-red-500' : 'text-green-600'}`}>
                              {ecart > 0 ? '+' : ''}{ecart.toFixed(1)}h
                            </span>
                          )}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${si.bg} ${si.text}`}>
                        {si.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {(r.statut === 'VALIDE' || r.statut === 'SOUMIS_FINANCE' || r.statut === 'VALIDE_RP') && (
                        <button
                          onClick={() => releveService.telechargerPdf(r.id)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white"
                          style={{ background: '#C88500' }}
                        >
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                          PDF
                        </button>
                      )}
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
