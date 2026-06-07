'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { releveService, type FeuilleHeureResponse } from '@/services/releve.service'

export default function ValidationsPage() {
  const qc = useQueryClient()
  const [motifModal, setMotifModal] = useState<{ id: number } | null>(null)
  const [motif, setMotif] = useState('')

  const { data: releves = [], isLoading } = useQuery({
    queryKey: ['releves', 'soumis'],
    queryFn: releveService.listerSoumis,
    refetchInterval: 30_000,
  })

  const { mutate: valider, isPending: validEnCours } = useMutation({
    mutationFn: releveService.valider,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['releves'] }),
  })

  const { mutate: rejeter, isPending: rejetEnCours } = useMutation({
    mutationFn: ({ id, motif }: { id: number; motif?: string }) =>
      releveService.rejeter(id, motif),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['releves'] })
      setMotifModal(null)
      setMotif('')
    },
  })

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Validations</h2>
        <p className="mt-1 text-sm text-gray-500">
          {releves.length} relevé{releves.length !== 1 ? 's' : ''} en attente de validation
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-sm text-gray-400">Chargement…</div>
      )}

      {!isLoading && releves.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 shadow-sm">
          <svg className="mb-3 h-14 w-14 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          <p className="text-sm font-medium text-gray-900">Aucun relevé en attente</p>
          <p className="mt-1 text-xs text-gray-400">Tous les relevés soumis ont été traités.</p>
        </div>
      )}

      {!isLoading && releves.length > 0 && (
        <div className="space-y-4">
          {releves.map((r) => (
            <ReleveValidationCard
              key={r.id}
              releve={r}
              onValider={() => valider(r.id)}
              onRejeter={() => { setMotifModal({ id: r.id }); setMotif('') }}
              loading={validEnCours || rejetEnCours}
            />
          ))}
        </div>
      )}

      {/* Modal motif rejet */}
      {motifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Motif de rejet</h3>
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Expliquez pourquoi ce relevé est rejeté… (optionnel)"
              rows={4}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
            />
            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setMotifModal(null)}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => rejeter({ id: motifModal.id, motif: motif || undefined })}
                disabled={rejetEnCours}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {rejetEnCours && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                  </svg>
                )}
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ReleveValidationCard({
  releve: r,
  onValider,
  onRejeter,
  loading,
}: {
  releve: FeuilleHeureResponse
  onValider: () => void
  onRejeter: () => void
  loading: boolean
}) {
  const nbSeances = r.lignes?.length ?? 0

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900">{r.module}</h3>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              Soumis
            </span>
          </div>
          <p className="mt-0.5 text-sm text-gray-500">
            {r.nomVacataire} · {r.classe} · {r.periode}
          </p>
          {r.dateSoumission && (
            <p className="mt-0.5 text-xs text-gray-400">
              Soumis le {new Date(r.dateSoumission).toLocaleDateString('fr-SN', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </p>
          )}
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-400">Séances</p>
          <p className="text-2xl font-bold text-gray-900">{nbSeances}</p>
        </div>
      </div>

      {/* Lignes */}
      {r.lignes && r.lignes.length > 0 && (
        <div className="mt-4 rounded-xl bg-gray-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Détail des séances</p>
          <div className="space-y-1.5">
            {r.lignes.slice(0, 5).map((l) => (
              <div key={l.id} className="flex items-center justify-between text-xs">
                <span className="text-gray-600">
                  {new Date(l.date).toLocaleDateString('fr-SN', { weekday: 'short', day: '2-digit', month: 'short' })}
                </span>
                <span className="font-mono text-gray-700">
                  {l.heureDebut?.slice(0, 5)} → {l.heureFin?.slice(0, 5)}
                </span>
                <span className="font-semibold text-gray-900">{l.duree?.toFixed(1)} h</span>
              </div>
            ))}
            {r.lignes.length > 5 && (
              <p className="text-xs text-gray-400">… et {r.lignes.length - 5} séance(s) de plus</p>
            )}
          </div>
          <div className="mt-2 border-t border-gray-200 pt-2 text-xs">
            <span className="text-gray-500">Total estimé : </span>
            <span className="font-bold text-gray-900">
              {r.lignes.reduce((s, l) => s + (l.duree ?? 0), 0).toFixed(1)} h
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={onValider}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Valider
        </button>
        <button
          onClick={onRejeter}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          Rejeter
        </button>
      </div>
    </div>
  )
}
