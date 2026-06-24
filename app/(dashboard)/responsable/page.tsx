'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useQuery } from '@tanstack/react-query'
import { vacataireService } from '@/services/vacataire.service'
import { contratService } from '@/services/contrat.service'
import { seanceService } from '@/services/seance.service'
import { releveService } from '@/services/releve.service'
import { rapportService } from '@/services/rapport.service'
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const GOLD = '#C88500'
const DARK = '#7A4010'
const GREEN = '#22C55E'
const BLUE = '#3B82F6'
const RED = '#EF4444'

/* ── Tooltip personnalisé ── */
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

export default function ResponsableDashboard() {
  const { user } = useAuthStore()
  const moisCourant = new Date().toISOString().slice(0, 7)
  const [exportMois, setExportMois] = useState(moisCourant)
  const [exporting, setExporting] = useState(false)

  const { data: vacataires = [] } = useQuery({ queryKey: ['vacataires'], queryFn: vacataireService.listerTous })
  const { data: expirants  = [] } = useQuery({ queryKey: ['contrats-expirants'], queryFn: contratService.expirants })
  const { data: seances    = [] } = useQuery({ queryKey: ['seances-toutes'], queryFn: seanceService.listerTous })
  const { data: releves    = [] } = useQuery({ queryKey: ['releves-equipe'], queryFn: releveService.equipe })

  /* ── KPIs ── */
  const totalVacataires  = vacataires.length
  const profilsComplets  = vacataires.filter(v => v.profilComplet).length
  const profilsIncomplets = totalVacataires - profilsComplets
  const seancesProg      = seances.filter(s => s.statut === 'PROGRAMMEE').length
  const seancesReal      = seances.filter(s => s.statut === 'REALISEE').length
  const seancesAnn       = seances.filter(s => s.statut === 'ANNULEE').length

  const vacatairesSoumis = new Set(
    releves
      .filter(r => r.periode === moisCourant && (r.statut === 'SOUMIS' || r.statut === 'VALIDE'))
      .map(r => r.nomVacataire)
  )
  const sansSoumission = vacataires.filter(v => !vacatairesSoumis.has(`${v.prenom} ${v.nom}`)).length
  const avecSoumission = totalVacataires - sansSoumission

  /* ── Données graphiques ── */
  const pieVacataires = [
    { name: 'Profil complet',   value: profilsComplets,   color: GOLD },
    { name: 'Profil incomplet', value: profilsIncomplets, color: '#E5E7EB' },
  ]

  const pieSeances = [
    { name: 'Programmées', value: seancesProg, color: BLUE },
    { name: 'Réalisées',   value: seancesReal, color: GREEN },
    { name: 'Annulées',    value: seancesAnn,  color: RED },
  ]

  const pieReleves = [
    { name: 'Soumis',      value: avecSoumission, color: GREEN },
    { name: 'Non soumis',  value: sansSoumission,  color: '#E5E7EB' },
  ]

  /* Évolution séances par mois (6 derniers mois) */
  const seancesParMois = (() => {
    const map: Record<string, { prog: number; real: number }> = {}
    seances.forEach(s => {
      const m = s.dateSeance.slice(0, 7)
      if (!map[m]) map[m] = { prog: 0, real: 0 }
      if (s.statut === 'PROGRAMMEE') map[m].prog++
      if (s.statut === 'REALISEE')   map[m].real++
    })
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([mois, v]) => ({
        mois: new Date(mois + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        Programmées: v.prog,
        Réalisées: v.real,
      }))
  })()

  /* Relevés par statut */
  const barReleves = [
    { name: 'En cours', value: releves.filter(r => r.statut === 'EN_COURS').length, color: '#9CA3AF' },
    { name: 'Soumis',   value: releves.filter(r => r.statut === 'SOUMIS').length,   color: BLUE },
    { name: 'Validés',  value: releves.filter(r => r.statut === 'VALIDE').length,   color: GREEN },
    { name: 'Rejetés',  value: releves.filter(r => r.statut === 'REJETE').length,   color: RED },
  ]

  const handleExportPdf = async () => {
    setExporting(true)
    try { await rapportService.telechargerRpMensuel(exportMois) }
    finally { setExporting(false) }
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl text-gray-900">Bonjour, {user?.prenom ?? 'Responsable'}</h2>
          <p className="mt-1 text-sm text-gray-500">Vue d'ensemble de votre programme — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start shrink-0">
          <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2">
            <input type="month" value={exportMois} onChange={e => setExportMois(e.target.value)}
              className="text-xs text-gray-600 focus:outline-none" />
            <button onClick={handleExportPdf} disabled={exporting}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-60"
              style={{ background: DARK }}>
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {exporting ? 'Export...' : 'Rapport PDF'}
            </button>
          </div>
          <Link href="/responsable/vacataires/nouveau"
            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
            style={{ background: GOLD }}>
            + Nouveau vacataire
          </Link>
        </div>
      </div>

      {/* ── Ligne 1 : 3 donuts + 1 alerte ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {/* Donut Vacataires */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vacataires</p>
            <Link href="/responsable/vacataires" className="text-xs font-semibold" style={{ color: GOLD }}>Voir →</Link>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-3">{totalVacataires}</p>
          <ResponsiveContainer width="100%" height={90}>
            <PieChart>
              <Pie data={pieVacataires} cx="50%" cy="50%" innerRadius={28} outerRadius={42} dataKey="value" strokeWidth={0}>
                {pieVacataires.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 text-center mt-1">{profilsComplets} complets · {profilsIncomplets} incomplets</p>
        </div>

        {/* Donut Séances */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Séances</p>
            <Link href="/responsable/emploi-du-temps" className="text-xs font-semibold" style={{ color: GOLD }}>Planning →</Link>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-3">{seances.length}</p>
          <ResponsiveContainer width="100%" height={90}>
            <PieChart>
              <Pie data={pieSeances.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={28} outerRadius={42} dataKey="value" strokeWidth={0}>
                {pieSeances.filter(d => d.value > 0).map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-3 mt-1">
            {pieSeances.map(s => (
              <span key={s.name} className="flex items-center gap-1 text-[10px] text-gray-500">
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                {s.value}
              </span>
            ))}
          </div>
        </div>

        {/* Donut Relevés */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Relevés ce mois</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-3">{avecSoumission}<span className="text-sm font-normal text-gray-400">/{totalVacataires}</span></p>
          <ResponsiveContainer width="100%" height={90}>
            <PieChart>
              <Pie data={pieReleves} cx="50%" cy="50%" innerRadius={28} outerRadius={42} dataKey="value" strokeWidth={0}>
                {pieReleves.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 text-center mt-1">
            {sansSoumission > 0
              ? <span className="text-orange-600 font-semibold">{sansSoumission} sans relevé</span>
              : <span className="text-green-600 font-semibold">Tous ont soumis ✓</span>}
          </p>
        </div>

        {/* Contrats expirants */}
        <div className={`rounded-2xl p-5 shadow-sm flex flex-col justify-between ${expirants.length > 0 ? 'border-2 border-amber-300 bg-amber-50' : 'bg-white'}`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: expirants.length > 0 ? '#B45309' : '#6B7280' }}>Contrats expirants</p>
            <p className="mt-1 text-4xl font-bold" style={{ color: expirants.length > 0 ? '#B45309' : '#111827' }}>{expirants.length}</p>
            <p className="text-xs mt-0.5" style={{ color: expirants.length > 0 ? '#D97706' : '#9CA3AF' }}>dans les 30 prochains jours</p>
          </div>
          {expirants.length > 0 ? (
            <div className="mt-3 space-y-1.5">
              {expirants.slice(0, 3).map(c => (
                <div key={c.id} className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 border border-amber-200">
                  <p className="text-xs font-semibold text-gray-800 truncate">{c.nomVacataire}</p>
                  <span className="text-[10px] font-bold text-amber-700 ml-2 whitespace-nowrap">
                    {new Date(c.dateFin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              ))}
              <Link href="/responsable/contrats" className="block text-center text-xs font-semibold text-amber-700 hover:underline pt-0.5">
                Voir tous →
              </Link>
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center">
              <svg className="h-10 w-10 text-green-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <p className="text-xs text-gray-400 text-center mt-1">Aucun contrat n'expire bientôt</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Ligne 2 : Area chart + Bar chart ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">

        {/* Évolution séances */}
        <div className="lg:col-span-3 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-gray-900">Évolution des séances</p>
              <p className="text-xs text-gray-400">6 derniers mois — programmées vs. réalisées</p>
            </div>
            <Link href="/responsable/emploi-du-temps" className="text-xs font-semibold rounded-lg px-3 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
              Voir le planning →
            </Link>
          </div>
          {seancesParMois.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-gray-300">Aucune donnée</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={seancesParMois} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradProg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={BLUE}  stopOpacity={0.15} />
                    <stop offset="95%" stopColor={BLUE}  stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={GREEN} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="mois" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Area type="monotone" dataKey="Programmées" stroke={BLUE}  strokeWidth={2} fill="url(#gradProg)" dot={false} activeDot={{ r: 4 }} />
                <Area type="monotone" dataKey="Réalisées"   stroke={GREEN} strokeWidth={2} fill="url(#gradReal)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar chart relevés */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4">
            <p className="text-sm font-bold text-gray-900">Relevés d'heures</p>
            <p className="text-xs text-gray-400">Répartition par statut</p>
          </div>
          {releves.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-gray-300">Aucune donnée</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barReleves} margin={{ top: 4, right: 8, left: -28, bottom: 0 }} barSize={28} barCategoryGap="30%">
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} label={{ position: 'top', fontSize: 10, fill: '#6B7280' }}>
                  {barReleves.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <Link href="/responsable/releves" className="mt-2 block text-center text-xs font-semibold hover:underline" style={{ color: GOLD }}>
            Gérer les relevés →
          </Link>
        </div>
      </div>

      {/* ── Ligne 3 : Accès rapides ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Dossiers vacataires', href: '/responsable/vacataires',     desc: 'Gérer les profils et signatures',  icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', color: '#FEF3C7', stroke: GOLD },
          { label: 'Contrats',            href: '/responsable/contrats',        desc: 'Créer et suivre les contrats',      icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8', color: '#FEF3C7', stroke: GOLD },
          { label: "Relevés d'heures",    href: '/responsable/releves',         desc: 'Superviser et valider',             icon: 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83', color: '#EFF6FF', stroke: BLUE },
          { label: 'Emploi du temps',     href: '/responsable/emploi-du-temps', desc: 'Planifier les séances',             icon: 'M3 4h18M3 9h18M3 14h18M3 19h18', color: '#F0FDF4', stroke: GREEN },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm hover:shadow-md transition-all group border border-transparent hover:border-gray-100">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: item.color }}>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke={item.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 group-hover:text-gray-900">{item.label}</p>
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
