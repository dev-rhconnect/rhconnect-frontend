'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { paiementService, type PaiementResponse, type StatutPaiement } from '@/services/paiement.service'

const statutConfig: Record<StatutPaiement, { label: string; className: string }> = {
  EN_ATTENTE: { label: 'En attente', className: 'bg-amber-50 text-amber-700' },
  VALIDE:     { label: 'Validée',    className: 'bg-blue-50 text-blue-700'   },
  PAYE:       { label: 'Payée',      className: 'bg-green-50 text-green-700' },
}

function telechargerBlob(blob: Blob, nom: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nom
  a.click()
  URL.revokeObjectURL(url)
}

export default function FichesPaiePage() {
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  const { data: paiements = [], isLoading } = useQuery({
    queryKey: ['paiements'],
    queryFn: paiementService.listerTous,
  })

  const filtres = paiements.filter((p) => {
    const q = search.toLowerCase()
    return (
      p.nomVacataire.toLowerCase().includes(q) ||
      p.periode.toLowerCase().includes(q)
    )
  })

  const handleTelecharger = async (p: PaiementResponse) => {
    setLoadingId(p.id)
    try {
      const blob = await paiementService.telecharger(p.id)
      telechargerBlob(blob, `FichePaie_${p.nomVacataire.replace(' ', '_')}_${p.periode.replace(' ', '_')}.pdf`)
    } catch {
      alert('Erreur lors du téléchargement')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fiches de paie</h2>
          <p className="mt-1 text-sm text-gray-500">
            {paiements.length} fiche{paiements.length !== 1 ? 's' : ''} générée{paiements.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Résumé */}
      {paiements.length > 0 && (
        <div className="mb-5 grid grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs text-gray-400">Total fiches</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{paiements.length}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs text-gray-400">Net total versé</p>
            <p className="mt-1 text-2xl font-bold text-green-700">
              {paiements.reduce((a, p) => a + p.montantNet, 0).toLocaleString('fr-SN')}
              <span className="ml-1 text-sm font-normal text-gray-400">FCFA</span>
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs text-gray-400">Retenues fiscales totales</p>
            <p className="mt-1 text-2xl font-bold text-red-600">
              {paiements.reduce((a, p) => a + p.retenueFiscale, 0).toLocaleString('fr-SN')}
              <span className="ml-1 text-sm font-normal text-gray-400">FCFA</span>
            </p>
          </div>
        </div>
      )}

      {/* Recherche */}
      <div className="relative mb-5 max-w-sm">
        <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrer par vacataire ou période…"
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ism-gold/40"
        />
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {isLoading && (
          <div className="flex items-center justify-center py-12 text-sm text-gray-400">Chargement…</div>
        )}

        {!isLoading && filtres.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-sm">
            <svg className="mb-3 h-12 w-12 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <p className="text-sm font-medium text-gray-900">Aucune fiche de paie</p>
            <p className="mt-1 text-xs text-gray-400">
              Les fiches de paie apparaissent après le calcul des rémunérations.
            </p>
          </div>
        )}

        {filtres.map((p) => {
          const cfg = statutConfig[p.statut]
          return (
            <div key={p.id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">{p.nomVacataire}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500">
                    Période : <strong>{p.periode}</strong> · {p.totalHeures.toFixed(1)} h @ {p.tauxHoraire.toLocaleString('fr-SN')} FCFA/h
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    Générée le {new Date(p.dateGeneration).toLocaleDateString('fr-SN')}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-400">Net à payer</p>
                  <p className="text-2xl font-bold text-green-700">
                    {p.montantNet.toLocaleString('fr-SN')}
                    <span className="ml-1 text-xs font-normal text-gray-400">FCFA</span>
                  </p>
                  <p className="text-xs text-red-500">−{p.retenueFiscale.toLocaleString('fr-SN')} FCFA (5 %)</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={() => handleTelecharger(p)}
                  disabled={loadingId === p.id}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {loadingId === p.id ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  )}
                  Télécharger PDF
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
