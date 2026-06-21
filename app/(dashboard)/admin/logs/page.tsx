'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminService } from '@/services/admin.service'

export default function AdminLogsPage() {
  const [search, setSearch] = useState('')

  const { data: logs = [], isLoading, isError } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: adminService.logs,
  })

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase()
    return (
      l.utilisateurEmail?.toLowerCase().includes(q) ||
      l.action?.toLowerCase().includes(q) ||
      l.entite?.toLowerCase().includes(q) ||
      l.details?.toLowerCase().includes(q)
    )
  })

  return (
    <div>
      {/* En-tête */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Logs d'audit</h2>
          <p className="mt-1 text-sm text-gray-500">
            Traçabilité de toutes les actions sur les contrats et dossiers
          </p>
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrer…"
            className="w-60 rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        {isLoading && <div className="flex items-center justify-center py-16 text-sm text-gray-400">Chargement…</div>}
        {isError && <div className="flex items-center justify-center py-16 text-sm text-red-500">Erreur de chargement.</div>}
        {!isLoading && !isError && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-sm font-medium text-gray-900">{search ? 'Aucun résultat' : 'Aucun log enregistré'}</p>
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Date</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Utilisateur</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Action</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Entité</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Détails</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => (
                <tr key={l.id} className={`hover:bg-gray-50 transition-colors ${i === filtered.length - 1 ? '' : 'border-b border-gray-50'}`}>
                  <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                    {new Date(l.dateAction).toLocaleString('fr-FR', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="px-5 py-3.5 text-gray-700">{l.utilisateurEmail}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                      {l.action}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {l.entite}{l.entiteId ? ` #${l.entiteId}` : ''}
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 max-w-xs truncate">{l.details ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
