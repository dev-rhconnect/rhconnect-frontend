'use client'

import Link from 'next/link'
import { useAuthStore } from '@/store/auth.store'
import { useQuery } from '@tanstack/react-query'
import { adminService } from '@/services/admin.service'

const ROLES_ADMIN = ['RESPONSABLE_PROGRAMME', 'ATTACHE_CLASSE', 'RELAIS_FINANCE', 'ADMIN']

export default function AdminDashboard() {
  const { user } = useAuthStore()

  const { data: tous = [] } = useQuery({
    queryKey: ['utilisateurs-admin'],
    queryFn: adminService.listerUtilisateurs,
  })

  const { data: logs = [] } = useQuery({
    queryKey: ['logs'],
    queryFn: adminService.logs,
  })

  const utilisateurs = tous.filter((u) => ROLES_ADMIN.includes(u.role))
  const actifs = utilisateurs.filter((u) => u.actif).length
  const inactifs = utilisateurs.length - actifs
  const enAttente = utilisateurs.filter((u) => u.premierConnexion).length

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Bonjour, {user?.prenom ?? 'Admin'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Gérez les comptes de l'équipe et supervisez l'activité du système.
          </p>
        </div>
        <Link
          href="/admin/utilisateurs"
          className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
          style={{ background: '#C88500' }}
        >
          Gérer les comptes
        </Link>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
              <svg className="h-5 w-5 text-ism-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <Link href="/admin/utilisateurs" className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-ism-gold hover:bg-orange-100 transition-colors">
              Voir tous →
            </Link>
          </div>
          <p className="text-sm text-gray-500">Comptes créés</p>
          <p className="mt-1 text-4xl font-bold text-gray-900">{utilisateurs.length}</p>
          <p className="mt-1 text-xs text-gray-400">{actifs} actif{actifs !== 1 ? 's' : ''}</p>
        </div>

        <div className={`rounded-2xl p-5 shadow-sm ${inactifs > 0 ? 'border-2 border-red-100 bg-red-50' : 'bg-white'}`}>
          <div className="mb-4 flex items-start justify-between">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${inactifs > 0 ? 'bg-red-100' : 'bg-gray-50'}`}>
              <svg className={`h-5 w-5 ${inactifs > 0 ? 'text-red-500' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${inactifs > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
              Désactivés
            </span>
          </div>
          <p className="text-sm text-gray-500">Comptes inactifs</p>
          <p className={`mt-1 text-4xl font-bold ${inactifs > 0 ? 'text-red-600' : 'text-gray-900'}`}>{inactifs}</p>
        </div>

        <div className={`rounded-2xl p-5 shadow-sm ${enAttente > 0 ? 'border-2 border-amber-200 bg-amber-50' : 'bg-white'}`}>
          <div className="mb-4 flex items-start justify-between">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${enAttente > 0 ? 'bg-amber-100' : 'bg-orange-50'}`}>
              <svg className={`h-5 w-5 ${enAttente > 0 ? 'text-amber-500' : 'text-ism-gold'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${enAttente > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
              En attente
            </span>
          </div>
          <p className="text-sm text-gray-500">1ère connexion en attente</p>
          <p className={`mt-1 text-4xl font-bold ${enAttente > 0 ? 'text-amber-600' : 'text-gray-900'}`}>{enAttente}</p>
        </div>
      </div>

      {/* Accès rapides + derniers logs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-gray-900">Accès rapides</h3>
          <div className="space-y-2">
            {[
              { label: 'Comptes utilisateurs',  href: '/admin/utilisateurs', desc: 'Créer, activer ou désactiver des comptes' },
              { label: "Logs d'audit",          href: '/admin/logs',         desc: 'Traçabilité des actions du système' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-xl px-4 py-3 hover:bg-orange-50 transition-colors group"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-ism-gold transition-colors">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
                <svg className="h-4 w-4 text-gray-300 group-hover:text-ism-gold transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-gray-900">Derniers logs d'audit</h3>
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <p className="text-xs text-gray-400">Aucun log disponible</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-start justify-between rounded-xl bg-gray-50 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-gray-800">{log.action}</p>
                    <p className="text-xs text-gray-400">{log.utilisateurEmail}</p>
                  </div>
                  <span className="ml-2 flex-shrink-0 text-xs text-gray-400">
                    {new Date(log.dateAction).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              ))}
              <Link href="/admin/logs" className="block text-center text-xs font-semibold text-ism-gold hover:text-ism-900 transition-colors pt-1">
                Voir tous les logs →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
