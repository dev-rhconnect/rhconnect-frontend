'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminService, type AuditLog } from '@/services/admin.service'

const actionColor: Record<string, string> = {
  CREATE_USER:      'bg-green-100 text-green-700',
  ACTIVER_USER:     'bg-blue-100 text-blue-700',
  DESACTIVER_USER:  'bg-red-100 text-red-700',
  CREATE_VACATAIRE: 'bg-amber-100 text-amber-700',
  ARCHIVE:          'bg-gray-100 text-gray-600',
}

function badgeClass(action: string) {
  for (const k of Object.keys(actionColor)) {
    if (action.startsWith(k)) return actionColor[k]
  }
  return 'bg-gray-100 text-gray-600'
}

export default function LogsPage() {
  const [search, setSearch] = useState('')

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['admin', 'logs'],
    queryFn: adminService.listerLogs,
    refetchInterval: 60_000,
  })

  const filtres = logs.filter((l) => {
    const q = search.toLowerCase()
    return (
      l.action.toLowerCase().includes(q) ||
      l.ressource.toLowerCase().includes(q) ||
      l.detail.toLowerCase().includes(q) ||
      `${l.utilisateur.prenom} ${l.utilisateur.nom}`.toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Journal d'audit</h2>
        <p className="mt-1 text-sm text-gray-500">
          Toutes les actions administratives — {logs.length} entrée{logs.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="relative mb-5 max-w-sm">
        <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrer les logs…"
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ism-gold/40"
        />
      </div>

      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        {isLoading && (
          <div className="flex items-center justify-center py-12 text-sm text-gray-400">Chargement…</div>
        )}

        {!isLoading && filtres.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <svg className="mb-3 h-12 w-12 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
            </svg>
            <p className="text-sm font-medium text-gray-900">Aucun log trouvé</p>
          </div>
        )}

        {!isLoading && filtres.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Horodatage</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Utilisateur</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Action</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Ressource</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Détail</th>
              </tr>
            </thead>
            <tbody>
              {filtres.map((log, i) => (
                <tr key={log.id} className={`hover:bg-gray-50 transition-colors ${i < filtres.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {new Date(log.dateAction).toLocaleString('fr-SN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {log.utilisateur.prenom} {log.utilisateur.nom}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{log.ressource}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs max-w-xs truncate">{log.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
