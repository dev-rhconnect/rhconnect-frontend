'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useQuery } from '@tanstack/react-query'
import { releveService } from '@/services/releve.service'
import { paiementService } from '@/services/paiement.service'
import { rapportService } from '@/services/rapport.service'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const GOLD  = '#C88500'
const GREEN = '#22C55E'
const BLUE  = '#3B82F6'
const RED   = '#EF4444'
const GRAY  = '#9CA3AF'

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg text-xs">
      {label && <p className="font-semibold text-gray-700 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name} : <strong>{p.value}</strong></p>
      ))}
    </div>
  )
}

export default function FinanceDashboard() {
  const { user } = useAuthStore()
  const moisCourant = new Date().toISOString().slice(0, 7)
  const [exportMois, setExportMois] = useState(moisCourant)
  const [exporting, setExporting] = useState<null | 'pdf' | 'excel'>(null)

  const { data: soumis    = [] } = useQuery({ queryKey: ['releves-soumis'], queryFn: releveService.soumisFinance })
  const { data: paiements = [] } = useQuery({ queryKey: ['paiements'],      queryFn: paiementService.listerTous })
  const { data: equipe    = [] } = useQuery({ queryKey: ['releves-equipe'], queryFn: releveService.equipe })

  const totalAValider  = soumis.length
  const montantNet     = paiements.reduce((s, p) => s + (p.montantNet ?? 0), 0)
  const montantBrut    = paiements.reduce((s, p) => s + (p.montantBrut ?? 0), 0)
  const ecarts         = equipe.filter(r => r.volumeHorairePrevisionnel && r.totalHeuresValidees > r.volumeHorairePrevisionnel)

  /* Pie statuts relevés */
  const pieStatuts = [
    { name: 'En cours', value: equipe.filter(r => r.statut === 'EN_COURS').length, color: GRAY },
    { name: 'Soumis',   value: equipe.filter(r => r.statut === 'SOUMIS').length,   color: BLUE },
    { name: 'Validés',  value: equipe.filter(r => r.statut === 'VALIDE').length,   color: GREEN },
    { name: 'Rejetés',  value: equipe.filter(r => r.statut === 'REJETE').length,   color: RED },
  ].filter(d => d.value > 0)

  /* Bar montants par vacataire (top 6) */
  const barMontants = paiements
    .reduce<{ nom: string; net: number }[]>((acc, p) => {
      const existing = acc.find(x => x.nom === p.nomVacataire)
      if (existing) existing.net += p.montantNet
      else acc.push({ nom: p.nomVacataire.split(' ')[0], net: p.montantNet })
      return acc
    }, [])
    .sort((a, b) => b.net - a.net)
    .slice(0, 6)

  /* Bar relevés par mois */
  const barMois = equipe.reduce<Record<string, { val: number; rej: number }>>((acc, r) => {
    const m = r.periode ?? ''
    if (!acc[m]) acc[m] = { val: 0, rej: 0 }
    if (r.statut === 'VALIDE') acc[m].val++
    if (r.statut === 'REJETE') acc[m].rej++
    return acc
  }, {})
  const barMoisData = Object.entries(barMois)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-5)
    .map(([mois, v]) => ({
      mois: mois.slice(5) + '/' + mois.slice(2, 4),
      Validés: v.val,
      Rejetés: v.rej,
    }))

  const handleExport = async (fmt: 'pdf' | 'excel') => {
    setExporting(fmt)
    try {
      if (fmt === 'pdf')   await rapportService.telechargerFinancePdf(exportMois)
      else                 await rapportService.telechargerFinanceExcel(exportMois)
    } finally { setExporting(null) }
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bonjour, {user?.prenom ?? 'Relais Finance'}</h2>
          <p className="mt-1 text-sm text-gray-500">Tableau de bord financier — validez les relevés et supervisez les rémunérations.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2">
            <input type="month" value={exportMois} onChange={e => setExportMois(e.target.value)}
              className="text-xs text-gray-600 focus:outline-none" />
            <button onClick={() => handleExport('pdf')} disabled={exporting !== null}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-60"
              style={{ background: '#7A4010' }}>
              {exporting === 'pdf' ? '...' : 'PDF'}
            </button>
            <button onClick={() => handleExport('excel')} disabled={exporting !== null}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-60"
              style={{ background: '#2E7D32' }}>
              {exporting === 'excel' ? '...' : 'Excel'}
            </button>
          </div>
          <Link href="/finance/validations"
            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
            style={{ background: GOLD }}>
            Valider les relevés
          </Link>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-4 gap-4">

        {/* Relevés à valider */}
        <div className={`rounded-2xl p-5 shadow-sm flex flex-col gap-3 ${totalAValider > 0 ? 'border-2 border-blue-300 bg-blue-50' : 'bg-white'}`}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: totalAValider > 0 ? BLUE : GRAY }}>À valider</p>
            <Link href="/finance/validations" className="text-xs font-semibold rounded-lg px-2 py-0.5 bg-white border border-blue-200 text-blue-600">Traiter →</Link>
          </div>
          <p className="text-4xl font-bold" style={{ color: totalAValider > 0 ? BLUE : '#111827' }}>{totalAValider}</p>
          <p className="text-xs text-gray-400">relevé{totalAValider !== 1 ? 's' : ''} en attente</p>
          {totalAValider > 0 && (
            <div className="space-y-1">
              {soumis.slice(0, 2).map(r => (
                <div key={r.id} className="flex justify-between items-center rounded-lg bg-white px-2.5 py-1.5 border border-blue-100">
                  <p className="text-xs font-semibold text-gray-800 truncate">{r.nomVacataire}</p>
                  <span className="text-[10px] text-blue-600 ml-2 whitespace-nowrap">{r.totalHeuresValidees.toFixed(1)}h</span>
                </div>
              ))}
              {totalAValider > 2 && <p className="text-xs text-center text-blue-500">+{totalAValider - 2} autres</p>}
            </div>
          )}
        </div>

        {/* Pie statuts */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Relevés — statuts</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{equipe.length}</p>
          {pieStatuts.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={90}>
                <PieChart>
                  <Pie data={pieStatuts} cx="50%" cy="50%" innerRadius={26} outerRadius={42} dataKey="value" strokeWidth={0}>
                    {pieStatuts.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-2 mt-1">
                {pieStatuts.map(s => (
                  <span key={s.name} className="flex items-center gap-1 text-[10px] text-gray-500">
                    <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                    {s.name} ({s.value})
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-300 text-center py-8">Aucun relevé</p>
          )}
        </div>

        {/* Montant net */}
        <div className="rounded-2xl bg-white p-5 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Net à payer</p>
          <div>
            <p className="text-3xl font-bold text-gray-900 mt-1">{montantNet.toLocaleString('fr-FR')}</p>
            <p className="text-xs text-gray-400 mt-0.5">FCFA</p>
          </div>
          <div className="mt-3 rounded-xl bg-gray-50 p-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Brut total</span>
              <span className="font-semibold text-gray-700">{montantBrut.toLocaleString('fr-FR')} F</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Retenue 5%</span>
              <span className="font-semibold text-red-500">−{(montantBrut - montantNet).toLocaleString('fr-FR')} F</span>
            </div>
            <div className="h-px bg-gray-200" />
            <div className="flex justify-between text-xs">
              <span className="font-bold text-gray-700">Net</span>
              <span className="font-bold" style={{ color: GOLD }}>{montantNet.toLocaleString('fr-FR')} F</span>
            </div>
          </div>
        </div>

        {/* Écarts */}
        <div className={`rounded-2xl p-5 shadow-sm flex flex-col gap-3 ${ecarts.length > 0 ? 'border-2 border-amber-300 bg-amber-50' : 'bg-white'}`}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: ecarts.length > 0 ? '#B45309' : GRAY }}>Écarts VH</p>
            {ecarts.length > 0 && (
              <Link href="/finance/ecarts" className="text-xs font-semibold rounded-lg px-2 py-0.5 bg-white border border-amber-200 text-amber-700">Voir →</Link>
            )}
          </div>
          <p className="text-4xl font-bold" style={{ color: ecarts.length > 0 ? '#B45309' : '#111827' }}>{ecarts.length}</p>
          {ecarts.length > 0 ? (
            <>
              <p className="text-xs text-amber-600">relevé{ecarts.length !== 1 ? 's' : ''} dépassant le volume prévu</p>
              <div className="space-y-1">
                {ecarts.slice(0, 2).map(r => (
                  <div key={r.id} className="flex justify-between items-center rounded-lg bg-white px-2.5 py-1.5 border border-amber-100">
                    <p className="text-xs font-semibold text-gray-800 truncate">{r.nomVacataire}</p>
                    <span className="text-[10px] text-amber-700 ml-2">+{(r.totalHeuresValidees - (r.volumeHorairePrevisionnel ?? 0)).toFixed(1)}h</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-400">Aucun écart détecté ✓</p>
          )}
        </div>
      </div>

      {/* ── Graphiques ── */}
      <div className="grid grid-cols-5 gap-4">

        {/* Bar montants */}
        <div className="col-span-3 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-gray-900">Rémunérations nettes par vacataire</p>
              <p className="text-xs text-gray-400">Top 6 — cumul toutes périodes</p>
            </div>
            <Link href="/finance/remunerations" className="text-xs font-semibold rounded-lg px-3 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50">
              Voir tout →
            </Link>
          </div>
          {barMontants.length === 0 ? (
            <div className="flex h-44 items-center justify-center text-sm text-gray-300">Aucune fiche générée</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barMontants} margin={{ top: 4, right: 8, left: -10, bottom: 0 }} barSize={32}>
                <XAxis dataKey="nom" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip content={<CustomTooltip />} formatter={(v) => [`${Number(v).toLocaleString('fr-FR')} FCFA`, 'Net']} />
                <Bar dataKey="net" name="Net" fill={GOLD} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar relevés par mois */}
        <div className="col-span-2 rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4">
            <p className="text-sm font-bold text-gray-900">Validations par mois</p>
            <p className="text-xs text-gray-400">5 derniers mois</p>
          </div>
          {barMoisData.length === 0 ? (
            <div className="flex h-44 items-center justify-center text-sm text-gray-300">Aucune donnée</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barMoisData} margin={{ top: 4, right: 8, left: -28, bottom: 0 }} barSize={14} barCategoryGap="25%">
                <XAxis dataKey="mois" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Validés" fill={GREEN} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Rejetés" fill={RED}   radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Accès rapides */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Validation relevés',  href: '/finance/validations',  desc: 'Valider ou rejeter les relevés',    color: '#EFF6FF', stroke: BLUE },
          { label: 'Rémunérations',       href: '/finance/remunerations', desc: 'Fiches de paie et paiements',       color: '#FEF3C7', stroke: GOLD },
          { label: 'Écarts VH',           href: '/finance/ecarts',        desc: 'Relevés hors volume prévu',         color: '#FEF9C3', stroke: '#B45309' },
          { label: "Relevés d'heures",    href: '/finance/releves',       desc: 'Historique de tous les relevés',    color: '#F0FDF4', stroke: GREEN },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm hover:shadow-md transition-all group border border-transparent hover:border-gray-100">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: item.color }}>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke={item.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-400 truncate">{item.desc}</p>
            </div>
            <svg className="ml-auto h-4 w-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ))}
      </div>

    </div>
  )
}
