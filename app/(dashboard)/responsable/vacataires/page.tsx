'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vacataireService, type VacataireResponse, type StatutVacataire } from '@/services/vacataire.service'

const statutConfig: Record<StatutVacataire, { label: string; className: string }> = {
  ACTIF:    { label: 'Actif',    className: 'bg-green-50 text-green-700' },
  INACTIF:  { label: 'Archivé', className: 'bg-gray-100 text-gray-500'  },
  SUSPENDU: { label: 'Suspendu', className: 'bg-red-50 text-red-600'     },
}

export default function VacatairesPage() {
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  const { data: vacataires = [], isLoading, isError } = useQuery({
    queryKey: ['vacataires'],
    queryFn: vacataireService.listerTous,
  })

  const { mutate: archiver } = useMutation({
    mutationFn: (id: number) => vacataireService.archiver(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vacataires'] }),
  })

  const filtered = vacataires.filter((v) => {
    const q = search.toLowerCase()
    return (
      v.nom.toLowerCase().includes(q) ||
      v.prenom.toLowerCase().includes(q) ||
      v.email.toLowerCase().includes(q) ||
      v.specialite.toLowerCase().includes(q)
    )
  })

  return (
    <div>
      {/* En-tête */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dossiers vacataires</h2>
          <p className="mt-1 text-sm text-gray-500">
            {vacataires.length} vacataire{vacataires.length !== 1 ? 's' : ''} enregistré{vacataires.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/responsable/vacataires/nouveau"
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          style={{ background: '#C88500' }}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nouveau dossier
        </Link>
      </div>

      {/* Barre de recherche */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un vacataire…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">
            Chargement…
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center py-16 text-sm text-red-500">
            Erreur lors du chargement des données.
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="mb-3 h-12 w-12 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <p className="text-sm font-medium text-gray-900">
              {search ? 'Aucun résultat' : 'Aucun vacataire enregistré'}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {search ? 'Essayez un autre terme de recherche.' : 'Créez le premier dossier vacataire.'}
            </p>
            {!search && (
              <Link
                href="/responsable/vacataires/nouveau"
                className="mt-4 rounded-xl px-4 py-2 text-xs font-semibold text-white"
                style={{ background: '#C88500' }}
              >
                + Nouveau dossier
              </Link>
            )}
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Vacataire</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Email</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Spécialité</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Statut</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => (
                <VacataireRow
                  key={v.id}
                  vacataire={v}
                  isLast={i === filtered.length - 1}
                  onArchiver={() => {
                    if (confirm(`Archiver le dossier de ${v.prenom} ${v.nom} ?`)) {
                      archiver(v.id)
                    }
                  }}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function VacataireRow({
  vacataire: v,
  isLast,
  onArchiver,
}: {
  vacataire: VacataireResponse
  isLast: boolean
  onArchiver: () => void
}) {
  const initiales = (v.prenom[0] ?? '') + (v.nom[0] ?? '')
  const cfg = statutConfig[v.statut]

  return (
    <tr className={`hover:bg-gray-50 transition-colors ${isLast ? '' : 'border-b border-gray-50'}`}>
      {/* Vacataire */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white uppercase"
            style={{ background: '#1C0800' }}
          >
            {initiales}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{v.prenom} {v.nom}</p>
            {v.telephone && <p className="text-xs text-gray-400">{v.telephone}</p>}
          </div>
        </div>
      </td>

      {/* Email */}
      <td className="px-5 py-4 text-gray-600">{v.email}</td>

      {/* Spécialité */}
      <td className="px-5 py-4 text-gray-600">{v.specialite}</td>

      {/* Statut */}
      <td className="px-5 py-4">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
          {cfg.label}
        </span>
      </td>

      {/* Actions */}
      <td className="px-5 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/responsable/vacataires/${v.id}`}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Voir
          </Link>
          {v.statut === 'ACTIF' && (
            <button
              onClick={onArchiver}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
            >
              Archiver
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
