'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { seanceService, type SeanceProgrammeeResponse } from '@/services/seance.service'
import { vacataireService } from '@/services/vacataire.service'
import { api } from '@/services/api'

function moisCourant() {
  const now = new Date()
  return {
    debut: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
    fin: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
  }
}

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function exportCSV(seances: SeanceProgrammeeResponse[], nom: string) {
  const header = ['Date', 'Vacataire', 'Email', 'Module', 'Classe(s)', 'Type', 'Salle', 'Début', 'Fin', 'Durée (h)', 'Justification écart']
  const rows = seances.map(s => [
    s.dateSeance, s.nomVacataire, s.emailVacataire, s.module, s.classe,
    s.typeSeance ?? '', s.salle ?? '',
    s.heureDebut.slice(0, 5), s.heureFin.slice(0, 5),
    s.duree.toFixed(2), s.justificationEcart ?? '',
  ])
  const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(';')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${nom}_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function FinanceRelevesPage() {
  const { debut: debutDefaut, fin: finDefaut } = moisCourant()
  const [vacataireId, setVacataireId] = useState<number | ''>('')
  const [classeNom, setClasseNom] = useState('')
  const [debut, setDebut] = useState(debutDefaut)
  const [fin, setFin] = useState(finDefaut)

  const { data: vacataires = [] } = useQuery({
    queryKey: ['vacataires'],
    queryFn: vacataireService.listerTous,
  })

  const { data: maquette = [] } = useQuery({
    queryKey: ['maquette'],
    queryFn: () => api.get<{ classeNom: string }[]>('/maquette').then(r => r.data),
  })

  const classes = useMemo(() =>
    [...new Set(maquette.map((m: { classeNom: string }) => m.classeNom))].sort(), [maquette]
  )

  const { data: seances = [], isLoading } = useQuery({
    queryKey: ['releve-finance', vacataireId, classeNom, debut, fin],
    queryFn: () => seanceService.releve({
      ...(vacataireId !== '' ? { vacataireId: vacataireId as number } : {}),
      ...(classeNom ? { classeNom } : {}),
      ...(debut ? { debut } : {}),
      ...(fin ? { fin } : {}),
    }),
  })

  const parVacataire = useMemo(() => {
    const map = new Map<string, { seances: SeanceProgrammeeResponse[]; totalH: number; ecarts: number }>()
    for (const s of seances) {
      const k = s.nomVacataire
      const entry = map.get(k) ?? { seances: [], totalH: 0, ecarts: 0 }
      entry.seances.push(s)
      entry.totalH += s.duree
      if (s.justificationEcart) entry.ecarts++
      map.set(k, entry)
    }
    return map
  }, [seances])

  const totalHeures = seances.reduce((s, x) => s + x.duree, 0)
  const totalEcarts = seances.filter(s => s.justificationEcart).length

  const nomExport = [
    vacataireId !== '' ? (vacataires.find(v => v.id === vacataireId)?.nom ?? 'vacataire') : 'tous',
    classeNom || 'toutes-classes', debut, fin,
  ].join('_')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relevés d'heures</h2>
          <p className="mt-1 text-sm text-gray-500">Séances validées (REALISÉE) — pour traitement paiement</p>
        </div>
        <button
          onClick={() => exportCSV(seances, nomExport)}
          disabled={seances.length === 0}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
        >
          ↓ Exporter CSV
        </button>
      </div>

      {/* Filtres */}
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Filtres</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Vacataire</label>
            <select
              value={vacataireId}
              onChange={e => setVacataireId(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 bg-white"
            >
              <option value="">Tous</option>
              {vacataires.map(v => <option key={v.id} value={v.id}>{v.prenom} {v.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Classe</label>
            <select
              value={classeNom}
              onChange={e => setClasseNom(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 bg-white"
            >
              <option value="">Toutes</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Du</label>
            <input type="date" value={debut} onChange={e => setDebut(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Au</label>
            <input type="date" value={fin} onChange={e => setFin(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          {[
            { label: 'Ce mois', ...moisCourant() },
            { label: 'Mois préc.', debut: (() => { const d = new Date(); d.setMonth(d.getMonth()-1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01` })(), fin: (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 0).toISOString().slice(0,10) })() },
            { label: 'Cette année', debut: `${new Date().getFullYear()}-01-01`, fin: `${new Date().getFullYear()}-12-31` },
          ].map(p => (
            <button key={p.label} onClick={() => { setDebut(p.debut); setFin(p.fin) }}
              className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-900">{seances.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Séances validées</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm text-center">
          <p className="text-2xl font-bold text-amber-700">{totalHeures.toFixed(1)}h</p>
          <p className="text-xs text-gray-400 mt-0.5">Total heures</p>
        </div>
        <div className={`rounded-2xl bg-white p-5 shadow-sm text-center ${totalEcarts > 0 ? 'ring-1 ring-orange-300' : ''}`}>
          <p className={`text-2xl font-bold ${totalEcarts > 0 ? 'text-orange-600' : 'text-gray-900'}`}>{totalEcarts}</p>
          <p className="text-xs text-gray-400 mt-0.5">Avec écart VH</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center text-gray-400">Chargement…</div>
      ) : seances.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center text-gray-400 shadow-sm">
          Aucune séance validée pour ces critères.
        </div>
      ) : (
        <div className="space-y-4">
          {[...parVacataire.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([nom, data]) => (
            <div key={nom} className="rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between bg-gray-50 border-b border-gray-100 px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white uppercase" style={{ background: '#1C0800' }}>
                    {nom.split(' ').map(p => p[0]).slice(0, 2).join('')}
                  </div>
                  <span className="font-semibold text-gray-900">{nom}</span>
                  {data.ecarts > 0 && (
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                      {data.ecarts} écart{data.ecarts > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-amber-700">{data.totalH.toFixed(1)}h</span>
                  <button onClick={() => exportCSV(data.seances, nom.replace(' ', '_'))}
                    className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100">
                    ↓ CSV
                  </button>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                    <th className="px-5 py-2.5 text-left font-medium">Date</th>
                    <th className="px-5 py-2.5 text-left font-medium">Module</th>
                    <th className="px-5 py-2.5 text-left font-medium">Classe</th>
                    <th className="px-5 py-2.5 text-left font-medium">Type</th>
                    <th className="px-5 py-2.5 text-left font-medium">Horaire</th>
                    <th className="px-5 py-2.5 text-right font-medium">Durée</th>
                    <th className="px-5 py-2.5 text-left font-medium">Écart</th>
                  </tr>
                </thead>
                <tbody>
                  {data.seances.map(s => (
                    <tr key={s.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${s.justificationEcart ? 'bg-orange-50/40' : ''}`}>
                      <td className="px-5 py-3 text-gray-700 whitespace-nowrap">{formatDate(s.dateSeance)}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">{s.module}</td>
                      <td className="px-5 py-3 text-gray-600 text-xs">{s.classe}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{s.typeSeance ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">{s.heureDebut.slice(0, 5)} → {s.heureFin.slice(0, 5)}</td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900">{s.duree.toFixed(1)}h</td>
                      <td className="px-5 py-3">
                        {s.justificationEcart ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-800" title={s.justificationEcart}>
                            ⚠ {s.justificationEcart.length > 30 ? s.justificationEcart.slice(0, 30) + '…' : s.justificationEcart}
                          </span>
                        ) : <span className="text-gray-300 text-xs">—</span>}
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
