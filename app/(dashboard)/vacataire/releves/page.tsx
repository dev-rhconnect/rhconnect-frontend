'use client'

import { useQuery } from '@tanstack/react-query'
import { releveService } from '@/services/releve.service'

export default function VacataireRelevesPage() {
  const { data: releves = [], isLoading, isError } = useQuery({
    queryKey: ['mes-releves-valides'],
    queryFn: releveService.mesRelevesValides,
  })

  const totalHeures = releves.reduce((acc, r) => acc + r.totalHeuresValidees, 0)

  return (
    <div>
      {/* En-tête */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Mes relevés validés</h2>
        <p className="mt-1 text-sm text-gray-500">Historique de vos heures validées par le Relais Finance</p>
      </div>

      {/* KPI */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Relevés validés</p>
          <p className="mt-1 text-4xl font-bold text-gray-900">{releves.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total heures validées</p>
          <p className="mt-1 text-4xl font-bold text-gray-900">{totalHeures.toFixed(1)} h</p>
        </div>
      </div>

      {/* Liste */}
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
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <p className="text-sm font-medium text-gray-900">Aucun relevé validé</p>
            <p className="mt-1 text-xs text-gray-400">Vos relevés validés apparaîtront ici.</p>
          </div>
        )}

        {!isLoading && !isError && releves.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Module</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Classe</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Période</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Heures validées</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Volume prévu</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Date validation</th>
              </tr>
            </thead>
            <tbody>
              {releves.map((r, i) => {
                const ecart = r.volumeHorairePrevisionnel != null
                  ? r.totalHeuresValidees - r.volumeHorairePrevisionnel
                  : null
                return (
                  <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${i === releves.length - 1 ? '' : 'border-b border-gray-50'}`}>
                    <td className="px-5 py-4 font-medium text-gray-900">{r.module}</td>
                    <td className="px-5 py-4 text-gray-600">{r.classe}</td>
                    <td className="px-5 py-4 text-gray-600">{r.periode}</td>
                    <td className="px-5 py-4 text-right font-bold text-gray-900">
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
                    <td className="px-5 py-4 text-gray-500">
                      {r.dateValidation
                        ? new Date(r.dateValidation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
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
