'use client'

import Link from 'next/link'
import { useAuthStore } from '@/store/auth.store'
import { useQuery } from '@tanstack/react-query'
import { adminService } from '@/services/admin.service'
import { vacataireService } from '@/services/vacataire.service'

export default function AdminDashboard() {
  const { user } = useAuthStore()

  const { data: vacataires = [] } = useQuery({
    queryKey: ['vacataires'],
    queryFn: vacataireService.listerTous,
  })

  const { data: logs = [] } = useQuery({
    queryKey: ['logs'],
    queryFn: adminService.logs,
  })

  const total = vacataires.length
  const complets = vacataires.filter((v) => v.profilComplet).length
  const incomplets = total - complets

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Bonjour, {user?.prenom ?? 'Admin'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Supervision des dossiers vacataires et des activités du système.
          </p>
        </div>
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
          <p className="text-sm text-gray-500">Total vacataires</p>
          <p className="mt-1 text-4xl font-bold text-gray-900">{total}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
              <svg className="h-5 w-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-600">Complets</span>
          </div>
          <p className="text-sm text-gray-500">Profils complets</p>
          <p className="mt-1 text-4xl font-bold text-green-600">{complets}</p>
          <p className="mt-1 text-xs text-gray-400">contrat actif + signature uploadée</p>
        </div>

        <div className={`rounded-2xl p-5 shadow-sm ${incomplets > 0 ? 'border-2 border-amber-200 bg-amber-50' : 'bg-white'}`}>
          <div className="mb-4 flex items-start justify-between">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${incomplets > 0 ? 'bg-amber-100' : 'bg-orange-50'}`}>
              <svg className={`h-5 w-5 ${incomplets > 0 ? 'text-amber-500' : 'text-ism-gold'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${incomplets > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
              Incomplets
            </span>
          </div>
          <p className="text-sm text-gray-500">Profils incomplets</p>
          <p className={`mt-1 text-4xl font-bold ${incomplets > 0 ? 'text-amber-600' : 'text-gray-900'}`}>{incomplets}</p>
        </div>
      </div>

      {/* Accès rapides */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-gray-900">Accès rapides</h3>
          <div className="space-y-2">
            {[
              { label: 'Dossiers vacataires', href: '/admin/utilisateurs', desc: 'Vérifier profils, signatures, contrats' },
              { label: "Logs d'audit", href: '/admin/logs', desc: 'Traçabilité des actions du système' },
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
