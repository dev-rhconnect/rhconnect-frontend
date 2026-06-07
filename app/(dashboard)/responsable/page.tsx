'use client'

import Link from 'next/link'
import { useAuthStore } from '@/store/auth.store'
import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '@/services/dashboard.service'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const COLORS = ['#C88500', '#1C0800', '#7A4010', '#EDA832']

export default function ResponsableDashboard() {
  const { user } = useAuthStore()

  const { data: kpis, isLoading } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: dashboardService.kpis,
    refetchInterval: 120_000,
  })

  const pieData = kpis
    ? [
        { name: 'Actifs',   value: Number(kpis.vacatairesActifs) },
        { name: 'Inactifs', value: Number(kpis.vacatairesTotal) - Number(kpis.vacatairesActifs) },
      ]
    : []

  const relevesData = kpis
    ? [
        { name: 'En cours', value: Number(kpis.relevesEnCours) },
        { name: 'Soumis',   value: Number(kpis.relevesSoumis) },
      ]
    : []

  return (
    <div>
      {/* En-tête */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bonjour, {user?.prenom ?? 'Responsable'}</h2>
          <p className="mt-1 text-sm text-gray-500">
            Tableau de bord — activité des vacataires ISM Dakar
          </p>
        </div>
        <Link
          href="/responsable/vacataires/nouveau"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          style={{ background: '#1C0800' }}
        >
          + Nouveau vacataire
        </Link>
      </div>

      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="Vacataires actifs"
          value={isLoading ? '…' : String(kpis?.vacatairesActifs ?? '—')}
          sub={`sur ${kpis?.vacatairesTotal ?? '?'} total`}
          accent="#C88500"
        />
        <KpiCard
          label="Contrats actifs"
          value={isLoading ? '…' : String(kpis?.contratsActifs ?? '—')}
          sub={kpis?.contratsExpirantBientot ? `⚠ ${kpis.contratsExpirantBientot} expirent bientôt` : 'Aucune expiration proche'}
          accent="#1C0800"
          alertSub={!!kpis?.contratsExpirantBientot}
        />
        <KpiCard
          label="Relevés soumis"
          value={isLoading ? '…' : String(kpis?.relevesSoumis ?? '—')}
          sub="En attente de validation"
          accent="#7A4010"
        />
        <KpiCard
          label="Heures validées"
          value={isLoading ? '…' : kpis ? kpis.totalHeuresValidees.toFixed(0) + ' h' : '—'}
          sub="Toutes périodes confondues"
          accent="#EDA832"
        />
      </div>

      {/* Charts row */}
      <div className="mb-6 grid gap-6 md:grid-cols-3">
        {/* Evolution mensuelle (heures) */}
        <div className="md:col-span-2 rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-gray-900">Évolution des heures dispensées</h3>
          {isLoading || !kpis?.evolutionMensuelle?.length ? (
            <div className="flex h-44 items-center justify-center text-sm text-gray-400">
              {isLoading ? 'Chargement…' : 'Aucune donnée'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={kpis.evolutionMensuelle} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mois" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit="h" />
                <Tooltip
                  formatter={(v: number) => [`${v.toFixed(1)} h`, 'Heures']}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="heures" fill="#C88500" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Répartition vacataires */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-gray-900">Statut vacataires</h3>
          {isLoading || !kpis ? (
            <div className="flex h-44 items-center justify-center text-sm text-gray-400">
              {isLoading ? 'Chargement…' : 'Aucune donnée'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Relevés à valider */}
      {kpis && kpis.relevesSoumis > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  {kpis.relevesSoumis} relevé{kpis.relevesSoumis > 1 ? 's' : ''} en attente de validation
                </p>
                <p className="mt-0.5 text-xs text-amber-700">Des attachés de classe attendent votre validation.</p>
              </div>
            </div>
            <Link
              href="/responsable/releves"
              className="flex-shrink-0 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
            >
              Valider →
            </Link>
          </div>
        </div>
      )}

      {/* Raccourcis */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {[
          { href: '/responsable/vacataires', label: 'Gérer les vacataires', desc: 'Consulter et modifier les dossiers' },
          { href: '/responsable/vacataires/nouveau', label: 'Nouveau dossier', desc: 'Enregistrer un nouveau vacataire' },
          { href: '/responsable/releves', label: 'Valider les relevés', desc: 'Approuver les relevés soumis' },
        ].map((link) => (
          <Link key={link.href} href={link.href}
            className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:border-ism-gold/40 transition-colors">
            <p className="font-semibold text-gray-900 group-hover:text-ism-gold transition-colors">{link.label} →</p>
            <p className="mt-1 text-xs text-gray-400">{link.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

function KpiCard({ label, value, sub, accent, alertSub }: {
  label: string; value: string; sub: string; accent: string; alertSub?: boolean
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-3xl font-bold" style={{ color: accent }}>{value}</p>
      <p className={`mt-0.5 text-xs ${alertSub ? 'font-semibold text-amber-600' : 'text-gray-400'}`}>{sub}</p>
    </div>
  )
}
