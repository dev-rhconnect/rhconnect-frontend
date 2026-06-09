'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { releveService, type StatutReleve } from '@/services/releve.service'

const statutConfig: Record<StatutReleve, { label: string; className: string }> = {
  EN_COURS: { label: 'En cours',  className: 'bg-gray-100 text-gray-600' },
  SOUMIS:   { label: 'Soumis',    className: 'bg-blue-50 text-blue-700' },
  VALIDE:   { label: 'Validé',    className: 'bg-green-50 text-green-700' },
  REJETE:   { label: 'Rejeté',    className: 'bg-red-50 text-red-600' },
}

export default function AttacheRelevesPage() {
  const queryClient = useQueryClient()
  const [confirmId, setConfirmId] = useState<number | null>(null)

  const { data: releves = [], isLoading, isError } = useQuery({
    queryKey: ['mes-releves'],
    queryFn: releveService.mesReleves,
  })

  const { mutate: soumettre, isPending } = useMutation({
    mutationFn: (id: number) => releveService.soumettre(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mes-releves'] })
      setConfirmId(null)
    },
  })

  return (
    <div>
      {/* En-tête */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mes relevés d'heures</h2>
          <p className="mt-1 text-sm text-gray-500">
            Saisissez les séances effectuées par vos vacataires puis soumettez pour validation.
          </p>
        </div>
        <Link
          href="/attache/releves/nouveau"
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          style={{ background: '#C88500' }}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nouveau relevé
        </Link>
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
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <p className="text-sm font-medium text-gray-900">Aucun relevé créé</p>
            <Link
              href="/attache/releves/nouveau"
              className="mt-4 rounded-xl px-4 py-2 text-xs font-semibold text-white"
              style={{ background: '#C88500' }}
            >
              Créer un relevé
            </Link>
          </div>
        )}

        {!isLoading && !isError && releves.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Vacataire</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Module / Classe</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Période</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Séances</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Heures</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Statut</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {releves.map((r, i) => {
                const cfg = statutConfig[r.statut]
                return (
                  <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${i === releves.length - 1 ? '' : 'border-b border-gray-50'}`}>
                    <td className="px-5 py-4 font-medium text-gray-900">{r.nomVacataire}</td>
                    <td className="px-5 py-4 text-gray-600">
                      <p>{r.module}</p>
                      <p className="text-xs text-gray-400">{r.classe}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{r.periode}</td>
                    <td className="px-5 py-4 text-right text-gray-600">{r.lignes.length}</td>
                    <td className="px-5 py-4 text-right font-semibold text-gray-900">
                      {r.totalHeuresValidees.toFixed(1)} h
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
                        {cfg.label}
                      </span>
                      {r.statut === 'REJETE' && r.motifRejet && (
                        <p className="mt-1 text-xs text-red-500 max-w-xs truncate">{r.motifRejet}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {r.statut === 'EN_COURS' && (
                          <>
                            <Link
                              href={`/attache/releves/${r.id}/saisir`}
                              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              Saisir séance
                            </Link>
                            {r.lignes.length > 0 && (
                              <button
                                onClick={() => setConfirmId(r.id)}
                                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                                style={{ background: '#C88500' }}
                              >
                                Soumettre
                              </button>
                            )}
                          </>
                        )}
                        {r.statut === 'REJETE' && (
                          <Link
                            href={`/attache/releves/${r.id}/saisir`}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                          >
                            Corriger
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal confirmation soumission */}
      {confirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900">Soumettre le relevé ?</h3>
            <p className="mt-2 text-sm text-gray-500">
              Une fois soumis, vous ne pourrez plus modifier ce relevé. Il sera transmis au Relais Finance pour validation.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmId(null)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => soumettre(confirmId)}
                disabled={isPending}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50"
                style={{ background: '#C88500' }}
              >
                {isPending ? 'Envoi…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
