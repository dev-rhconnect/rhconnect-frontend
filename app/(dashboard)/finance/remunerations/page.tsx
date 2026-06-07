'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { paiementService, type PaiementResponse, type StatutPaiement } from '@/services/paiement.service'

function telechargerBlob(blob: Blob, nom: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nom
  a.click()
  URL.revokeObjectURL(url)
}

const statutConfig: Record<StatutPaiement, { label: string; className: string }> = {
  EN_ATTENTE: { label: 'En attente', className: 'bg-amber-50 text-amber-700'  },
  VALIDE:     { label: 'Validé',     className: 'bg-blue-50 text-blue-700'    },
  PAYE:       { label: 'Payé',       className: 'bg-green-50 text-green-700'  },
}

export default function RemunerationsPage() {
  const [loadingId, setLoadingId] = useState<number | null>(null)

  const { data: paiements = [], isLoading } = useQuery({
    queryKey: ['paiements'],
    queryFn: paiementService.listerTous,
  })

  const totalNet = paiements.reduce((acc, p) => acc + p.montantNet, 0)

  const handleTelecharger = async (id: number) => {
    setLoadingId(id)
    try {
      const blob = await paiementService.telecharger(id)
      telechargerBlob(blob, `FichePaie_${id}.pdf`)
    } catch {
      alert('Erreur lors du téléchargement')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div>
      {/* En-tête */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rémunérations</h2>
          <p className="mt-1 text-sm text-gray-500">
            Calcul automatique — retenue fiscale 5 % (CGI art. 200)
          </p>
        </div>
      </div>

      {/* Carte formule fiscale */}
      <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="mb-3 flex items-center gap-2">
          <svg className="h-5 w-5 text-ism-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="text-sm font-bold text-amber-800">Formule de calcul appliquée</span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="rounded-xl bg-white p-3">
            <p className="text-xs text-gray-500">Montant brut</p>
            <p className="mt-1 font-mono text-sm font-bold text-gray-900">Heures × Taux horaire</p>
          </div>
          <div className="rounded-xl bg-white p-3">
            <p className="text-xs text-gray-500">Retenue CGI art. 200</p>
            <p className="mt-1 font-mono text-sm font-bold text-gray-900">Brut × 5 %</p>
          </div>
          <div className="rounded-xl bg-white p-3">
            <p className="text-xs text-gray-500">Net à payer</p>
            <p className="mt-1 font-mono text-sm font-bold text-green-700">Brut − Retenue</p>
          </div>
        </div>
      </div>

      {/* Résumé total */}
      {paiements.length > 0 && (
        <div className="mb-5 grid grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs text-gray-500">Fiches générées</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{paiements.length}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs text-gray-500">Total brut</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              {paiements.reduce((a, p) => a + p.montantBrut, 0).toLocaleString('fr-SN')} <span className="text-sm font-medium text-gray-400">FCFA</span>
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs text-gray-500">Total net à verser</p>
            <p className="mt-1 text-3xl font-bold text-green-700">
              {totalNet.toLocaleString('fr-SN')} <span className="text-sm font-medium text-gray-400">FCFA</span>
            </p>
          </div>
        </div>
      )}

      {/* Tableau des paiements */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        {isLoading && (
          <div className="flex items-center justify-center py-12 text-sm text-gray-400">
            Chargement…
          </div>
        )}

        {!isLoading && paiements.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="mb-3 h-12 w-12 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <p className="text-sm font-medium text-gray-900">Aucun paiement calculé</p>
            <p className="mt-1 text-xs text-gray-400">
              Les paiements seront disponibles après validation des relevés (Sprint 2).
            </p>
          </div>
        )}

        {!isLoading && paiements.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Vacataire</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Période</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Heures</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Brut (FCFA)</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Retenue 5 %</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Net (FCFA)</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Statut</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {paiements.map((p, i) => {
                const cfg = statutConfig[p.statut]
                return (
                  <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${i < paiements.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <td className="px-5 py-4 font-semibold text-gray-900">{p.nomVacataire}</td>
                    <td className="px-5 py-4 text-gray-600">{p.periode}</td>
                    <td className="px-5 py-4 text-right text-gray-700">{p.totalHeures.toFixed(1)}</td>
                    <td className="px-5 py-4 text-right font-mono text-gray-900">{p.montantBrut.toLocaleString('fr-SN')}</td>
                    <td className="px-5 py-4 text-right font-mono text-red-500">−{p.retenueFiscale.toLocaleString('fr-SN')}</td>
                    <td className="px-5 py-4 text-right font-mono font-bold text-green-700">{p.montantNet.toLocaleString('fr-SN')}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleTelecharger(p.id)}
                        disabled={loadingId === p.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        {loadingId === p.id ? (
                          <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                          </svg>
                        ) : (
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        )}
                        PDF
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
