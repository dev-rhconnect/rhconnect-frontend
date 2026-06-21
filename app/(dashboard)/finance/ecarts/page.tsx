'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { seanceService, type SeanceProgrammeeResponse } from '@/services/seance.service'

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function exportCSV(seances: SeanceProgrammeeResponse[]) {
  const header = ['Date', 'Vacataire', 'Email', 'Module', 'Classe', 'Durée (h)', 'Justification écart']
  const rows = seances.map(s => [
    s.dateSeance, s.nomVacataire, s.emailVacataire,
    s.module, s.classe, s.duree.toFixed(2), s.justificationEcart ?? '',
  ])
  const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(';')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ecarts_vh_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function FinanceEcartsPage() {
  const { data: seances = [], isLoading } = useQuery({
    queryKey: ['ecarts'],
    queryFn: seanceService.ecarts,
  })

  const parVacataire = useMemo(() => {
    const map = new Map<string, SeanceProgrammeeResponse[]>()
    for (const s of seances) {
      const arr = map.get(s.nomVacataire) ?? []
      arr.push(s)
      map.set(s.nomVacataire, arr)
    }
    return map
  }, [seances])

  const totalH = seances.reduce((acc, s) => acc + s.duree, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Écarts de volume horaire</h2>
          <p className="mt-1 text-sm text-gray-500">Séances dont le VH prévu a été dépassé — justification obligatoire</p>
        </div>
        <button
          onClick={() => exportCSV(seances)}
          disabled={seances.length === 0}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
        >
          ↓ Exporter CSV
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm text-center ring-1 ring-orange-200">
          <p className="text-2xl font-bold text-orange-600">{seances.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Séances avec écart</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm text-center">
          <p className="text-2xl font-bold text-amber-700">{totalH.toFixed(1)}h</p>
          <p className="text-xs text-gray-400 mt-0.5">Heures totales en écart</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-900">{parVacataire.size}</p>
          <p className="text-xs text-gray-400 mt-0.5">Vacataires concernés</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center text-gray-400">Chargement…</div>
      ) : seances.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <p className="text-green-600 font-semibold">Aucun écart détecté</p>
          <p className="text-sm text-gray-400 mt-1">Tous les volumes horaires sont respectés.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {[...parVacataire.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([nom, data]) => (
            <div key={nom} className="rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between bg-orange-50 border-b border-orange-100 px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white uppercase">
                    {nom.split(' ').map(p => p[0]).slice(0, 2).join('')}
                  </div>
                  <span className="font-semibold text-gray-900">{nom}</span>
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                    {data.length} séance{data.length > 1 ? 's' : ''}
                  </span>
                </div>
                <span className="text-sm font-bold text-orange-700">
                  {data.reduce((s, x) => s + x.duree, 0).toFixed(1)}h en écart
                </span>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                    <th className="px-5 py-2.5 text-left font-medium">Date</th>
                    <th className="px-5 py-2.5 text-left font-medium">Module</th>
                    <th className="px-5 py-2.5 text-left font-medium">Classe</th>
                    <th className="px-5 py-2.5 text-right font-medium">Durée</th>
                    <th className="px-5 py-2.5 text-left font-medium">Justification</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(s => (
                    <tr key={s.id} className="border-b border-gray-50 bg-orange-50/30 hover:bg-orange-50 transition-colors">
                      <td className="px-5 py-3 text-gray-700 whitespace-nowrap">{formatDate(s.dateSeance)}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">{s.module}</td>
                      <td className="px-5 py-3 text-gray-600 text-xs">{s.classe}</td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900">{s.duree.toFixed(1)}h</td>
                      <td className="px-5 py-3">
                        <span className="inline-block rounded-lg bg-orange-100 px-3 py-1 text-xs text-orange-900 leading-relaxed">
                          {s.justificationEcart}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
