'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { releveService, type FeuilleHeureResponse, type StatutReleve } from '@/services/releve.service'

function periodeLabel(p: string) {
  const [y, m] = p.split('-')
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

const STATUT_COLORS: Record<StatutReleve, { bg: string; text: string; label: string }> = {
  EN_COURS:       { bg: 'bg-gray-100',   text: 'text-gray-700',   label: 'En cours' },
  SOUMIS:         { bg: 'bg-blue-50',    text: 'text-blue-700',   label: 'Soumis' },
  SOUMIS_RP:      { bg: 'bg-blue-50',    text: 'text-blue-700',   label: 'Soumis au RP' },
  VALIDE_RP:      { bg: 'bg-indigo-50',  text: 'text-indigo-700', label: 'Validé RP' },
  SOUMIS_FINANCE: { bg: 'bg-amber-50',   text: 'text-amber-700',  label: 'En attente' },
  VALIDE:         { bg: 'bg-green-50',   text: 'text-green-700',  label: 'Validé ✓' },
  REJETE:         { bg: 'bg-red-50',     text: 'text-red-600',    label: 'Rejeté' },
}

function BadgeStatut({ statut }: { statut: StatutReleve }) {
  const s = STATUT_COLORS[statut] ?? STATUT_COLORS.EN_COURS
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}

function exportCSV(releves: FeuilleHeureResponse[], nom: string) {
  const header = ['Période', 'Vacataire', 'Module', 'Classe', 'Statut', 'Séances', 'Heures validées', 'Taux', 'Montant estimé']
  const rows = releves.map(r => [
    r.periode, r.nomVacataire, r.module ?? '', r.classe ?? '', r.statut,
    String(r.nombreSeances), r.totalHeuresValidees.toFixed(2),
    r.tauxHoraire ? String(r.tauxHoraire) : '',
    r.tauxHoraire ? (r.totalHeuresValidees * r.tauxHoraire).toFixed(0) : '',
  ])
  const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(';')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `releves_valides_${nom}_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function FinanceRelevesPage() {
  const [filtreStatut, setFiltreStatut] = useState<StatutReleve | 'TOUS'>('TOUS')
  const [filtreVacataire, setFiltreVacataire] = useState('')

  const { data: tous = [], isLoading } = useQuery({
    queryKey: ['releves-finance-historique'],
    queryFn: releveService.soumisFinance,
  })

  const releves = tous.filter(r => {
    if (filtreStatut !== 'TOUS' && r.statut !== filtreStatut) return false
    if (filtreVacataire && !r.nomVacataire.toLowerCase().includes(filtreVacataire.toLowerCase())) return false
    return true
  })

  const totalValides = tous.filter(r => r.statut === 'VALIDE').length
  const totalHeures  = tous.filter(r => r.statut === 'VALIDE').reduce((s, r) => s + r.totalHeuresValidees, 0)
  const totalMontant = tous.filter(r => r.statut === 'VALIDE' && r.tauxHoraire)
    .reduce((s, r) => s + r.totalHeuresValidees * (r.tauxHoraire ?? 0), 0)

  const vacatairesUniques = [...new Set(tous.map(r => r.nomVacataire))].sort()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl text-gray-900">Relevés — historique</h2>
          <p className="mt-1 text-sm text-gray-500">Relevés transmis au Finance (en attente, validés, rejetés)</p>
        </div>
        <button
          onClick={() => exportCSV(releves, filtreVacataire || 'tous')}
          disabled={releves.length === 0}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 shadow-sm self-start shrink-0"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Exporter CSV
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 text-center">
          <p className="text-3xl font-bold text-green-700">{totalValides}</p>
          <p className="mt-1 text-xs text-gray-400">Relevés validés</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 text-center">
          <p className="text-3xl font-bold text-amber-700">{totalHeures.toFixed(1)} h</p>
          <p className="mt-1 text-xs text-gray-400">Heures validées</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 text-center">
          <p className="text-3xl font-bold text-gray-900">{totalMontant > 0 ? totalMontant.toLocaleString('fr-FR') : '—'}</p>
          <p className="mt-1 text-xs text-gray-400">Montant total (FCFA)</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">Vacataire</label>
            <select value={filtreVacataire} onChange={e => setFiltreVacataire(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-amber-400">
              <option value="">Tous</option>
              {vacatairesUniques.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">Statut</label>
            <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value as StatutReleve | 'TOUS')}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-amber-400">
              <option value="TOUS">Tous les statuts</option>
              <option value="SOUMIS_FINANCE">En attente</option>
              <option value="VALIDE">Validés</option>
              <option value="REJETE">Rejetés</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
        </div>
      ) : releves.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-16 text-center border border-dashed border-gray-200">
          <p className="text-sm font-semibold text-gray-900">Aucun relevé</p>
          <p className="mt-1 text-xs text-gray-400">Aucun relevé ne correspond aux filtres sélectionnés.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              {releves.length} relevé{releves.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400">Vacataire</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400">Module</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400">Classe</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400">Période</th>
                <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-gray-400">Heures</th>
                <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-gray-400">Montant</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400">Statut</th>
                <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-gray-400">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {releves.map(r => {
                const montant = r.tauxHoraire ? r.totalHeuresValidees * r.tauxHoraire : null
                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white flex-shrink-0"
                          style={{ background: '#1C0800' }}>
                          {r.nomVacataire.split(' ').map(p => p[0]).slice(0, 2).join('')}
                        </div>
                        <span className="font-medium text-gray-900 text-xs">{r.nomVacataire}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-900 text-xs">{r.module ?? '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{r.classe ?? '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{periodeLabel(r.periode)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="font-bold text-gray-900">{r.totalHeuresValidees.toFixed(1)}h</span>
                      <span className="text-[10px] text-gray-400 ml-1">({r.nombreSeances} séances)</span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs font-semibold text-gray-700">
                      {montant != null ? `${montant.toLocaleString('fr-FR')} FCFA` : '—'}
                    </td>
                    <td className="px-5 py-3.5"><BadgeStatut statut={r.statut} /></td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => releveService.telechargerPdf(r.id)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white"
                        style={{ background: '#C88500' }}
                        title="Télécharger PDF"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        PDF
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  )
}
