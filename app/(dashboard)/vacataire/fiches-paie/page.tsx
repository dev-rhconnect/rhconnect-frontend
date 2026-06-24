'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { paiementService } from '@/services/paiement.service'

export default function VacataaireFichesPaiePage() {
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  const { data: fiches = [], isLoading, isError } = useQuery({
    queryKey: ['mes-fiches-paie'],
    queryFn: paiementService.mesFiches,
  })

  const { mutate: telecharger } = useMutation({
    mutationFn: async (id: number) => {
      setDownloadingId(id)
      await paiementService.telechargerPdf(id)
    },
    onSettled: () => setDownloadingId(null),
  })

  const totalNet = fiches.reduce((acc, f) => acc + f.montantNet, 0)

  return (
    <div>
      {/* En-tête */}
      <div className="mb-6">
        <h2 className="text-xl font-bold sm:text-2xl text-gray-900">Mes fiches de paie</h2>
        <p className="mt-1 text-sm text-gray-500">Consultez et téléchargez vos fiches de rémunération</p>
      </div>

      {/* KPI */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Fiches disponibles</p>
          <p className="mt-1 text-4xl font-bold text-gray-900">{fiches.length}</p>
        </div>
        <div className="rounded-2xl border-2 border-orange-200 bg-white p-5">
          <p className="text-sm font-semibold text-ism-gold">Total net perçu</p>
          <p className="mt-1 text-4xl font-bold text-gray-900">
            {totalNet.toLocaleString('fr-FR')} <span className="text-xl font-semibold text-gray-400">FCFA</span>
          </p>
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
        {!isLoading && !isError && fiches.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="mb-3 h-12 w-12 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <p className="text-sm font-medium text-gray-900">Aucune fiche disponible</p>
            <p className="mt-1 text-xs text-gray-400">Vos fiches de paie apparaîtront ici après validation.</p>
          </div>
        )}

        {!isLoading && !isError && fiches.length > 0 && (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Période</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Heures</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Taux horaire</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Brut</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Retenue (5%)</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Net</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">PDF</th>
              </tr>
            </thead>
            <tbody>
              {fiches.map((f, i) => (
                <tr key={f.id} className={`hover:bg-gray-50 transition-colors ${i === fiches.length - 1 ? '' : 'border-b border-gray-50'}`}>
                  <td className="px-5 py-4 font-medium text-gray-900">{f.periode}</td>
                  <td className="px-5 py-4 text-right text-gray-600">{f.totalHeures.toFixed(1)} h</td>
                  <td className="px-5 py-4 text-right text-gray-600">{f.tauxHoraire.toLocaleString('fr-FR')} FCFA</td>
                  <td className="px-5 py-4 text-right text-gray-600">{f.montantBrut.toLocaleString('fr-FR')} FCFA</td>
                  <td className="px-5 py-4 text-right text-red-500">−{f.retenueFiscale.toLocaleString('fr-FR')} FCFA</td>
                  <td className="px-5 py-4 text-right font-bold text-gray-900">{f.montantNet.toLocaleString('fr-FR')} FCFA</td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => telecharger(f.id)}
                      disabled={downloadingId === f.id}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                      style={{ background: '#C88500' }}
                    >
                      {downloadingId === f.id ? (
                        'Génération…'
                      ) : (
                        <>
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          PDF
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  )
}
