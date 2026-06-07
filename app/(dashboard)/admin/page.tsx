'use client'

import Link from 'next/link'
import { useAuthStore } from '@/store/auth.store'
import { useQuery } from '@tanstack/react-query'
import { adminService } from '@/services/admin.service'

export default function AdminDashboard() {
  const { user } = useAuthStore()

  const { data: utilisateurs = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['admin', 'utilisateurs'],
    queryFn: adminService.listerUtilisateurs,
    refetchInterval: 60_000,
  })

  const { data: logs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['admin', 'logs'],
    queryFn: adminService.listerLogs,
    refetchInterval: 60_000,
  })

  const totalComptes   = utilisateurs.length
  const comptesActifs  = utilisateurs.filter((u) => u.actif).length
  const comptesInactifs = utilisateurs.filter((u) => !u.actif).length
  const totalLogs      = logs.length
  const derniersLogs   = [...logs].reverse().slice(0, 5)

  const actionColor: Record<string, string> = {
    CREATE_USER:    'bg-green-50 text-green-700',
    ACTIVER_USER:   'bg-blue-50 text-blue-700',
    DESACTIVER_USER:'bg-red-50 text-red-700',
  }

  return (
    <div>
      {/* En-tête */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bonjour, {user?.prenom ?? 'Admin'}</h2>
          <p className="mt-1 text-sm text-gray-500">Administration des comptes — RHConnect ISM Dakar</p>
        </div>
        <Link
          href="/admin/utilisateurs/nouveau"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#C88500' }}
        >
          + Nouveau compte
        </Link>
      </div>

      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="Total comptes"
          value={loadingUsers ? '…' : totalComptes}
          sub="tous rôles confondus"
          color="text-gray-900"
          bg="bg-gray-50"
          icon={<UsersIcon />}
        />
        <KpiCard
          label="Comptes actifs"
          value={loadingUsers ? '…' : comptesActifs}
          sub="connectables à la plateforme"
          color="text-green-700"
          bg="bg-green-50"
          icon={<CheckIcon />}
        />
        <KpiCard
          label="Comptes inactifs"
          value={loadingUsers ? '…' : comptesInactifs}
          sub="désactivés par l'Admin IT"
          color="text-red-600"
          bg="bg-red-50"
          icon={<BanIcon />}
        />
        <KpiCard
          label="Actions journalisées"
          value={loadingLogs ? '…' : totalLogs}
          sub="dans le journal d'audit"
          color="text-amber-700"
          bg="bg-amber-50"
          icon={<LogIcon />}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Répartition par rôle */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-bold text-gray-900">Répartition des comptes par rôle</h3>
          {loadingUsers ? (
            <div className="flex h-32 items-center justify-center text-sm text-gray-400">Chargement…</div>
          ) : utilisateurs.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-gray-400">Aucun compte</div>
          ) : (
            <div className="space-y-3">
              {([
                ['RESPONSABLE_PROGRAMME', 'Responsable Pédagogique', '#C88500'],
                ['ATTACHE_CLASSE',        'Attaché de Classe',        '#1C0800'],
                ['RELAIS_FINANCE',        'Relais Finance',           '#047857'],
                ['VACATAIRE',             'Vacataire',                '#6366F1'],
              ] as [string, string, string][]).map(([role, label, color]) => {
                const count = utilisateurs.filter((u) => u.role === role).length
                const pct   = totalComptes > 0 ? (count / totalComptes) * 100 : 0
                return (
                  <div key={role}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-700">{label}</span>
                      <span className="tabular-nums text-gray-500">{count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Dernières actions */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Dernières actions</h3>
            <Link href="/admin/logs" className="text-xs font-semibold hover:underline" style={{ color: '#C88500' }}>
              Voir tout →
            </Link>
          </div>
          {loadingLogs ? (
            <div className="flex h-32 items-center justify-center text-sm text-gray-400">Chargement…</div>
          ) : derniersLogs.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-gray-400">Aucune action enregistrée</div>
          ) : (
            <div className="space-y-2.5">
              {derniersLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  <span className={`mt-0.5 rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${actionColor[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                    {log.action.replace('_USER', '')}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-gray-700">
                      {log.utilisateur?.email ?? '—'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(log.dateAction).toLocaleString('fr-SN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Raccourcis */}
      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        {[
          { href: '/admin/utilisateurs',        label: 'Gérer les comptes',     desc: 'Activer, désactiver, voir les rôles' },
          { href: '/admin/utilisateurs/nouveau', label: 'Créer un compte',       desc: 'Nouveau responsable, attaché ou relais finance' },
          { href: '/admin/logs',                 label: "Journal d'audit",       desc: 'Historique de toutes les actions effectuées' },
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

function KpiCard({
  label, value, sub, color, bg, icon,
}: {
  label: string; value: number | string; sub: string; color: string; bg: string; icon: React.ReactNode
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
        <span className={color}>{icon}</span>
      </div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`mt-0.5 text-3xl font-bold ${color}`}>{value}</p>
      <p className="mt-0.5 text-xs text-gray-400">{sub}</p>
    </div>
  )
}

function UsersIcon() {
  return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
function CheckIcon() {
  return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
}
function BanIcon() {
  return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
}
function LogIcon() {
  return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
}
