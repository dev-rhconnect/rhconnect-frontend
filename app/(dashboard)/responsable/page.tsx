'use client'

import Link from 'next/link'
import { useAuthStore } from '@/store/auth.store'
import { useQuery } from '@tanstack/react-query'
import { vacataireService } from '@/services/vacataire.service'
import { contratService } from '@/services/contrat.service'
import { seanceService } from '@/services/seance.service'

export default function ResponsableDashboard() {
  const { user } = useAuthStore()

  const { data: vacataires = [] } = useQuery({
    queryKey: ['vacataires'],
    queryFn: vacataireService.listerTous,
  })

  const { data: expirants = [] } = useQuery({
    queryKey: ['contrats-expirants'],
    queryFn: contratService.expirants,
  })

  const { data: seances = [] } = useQuery({
    queryKey: ['seances-toutes'],
    queryFn: seanceService.listerTous,
  })

  const totalVacataires = vacataires.length
  const profilsComplets = vacataires.filter((v) => v.profilComplet).length
  const seancesSemaine = seances.filter((s) => s.statut === 'PROGRAMMEE').length

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Bonjour, {user?.prenom ?? 'Responsable'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Gérez les dossiers vacataires, les contrats et l'emploi du temps.
          </p>
        </div>
        <Link
          href="/responsable/vacataires/nouveau"
          className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
          style={{ background: '#C88500' }}
        >
          + Nouveau vacataire
        </Link>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Vacataires */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
              <svg className="h-5 w-5 text-ism-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <Link href="/responsable/vacataires" className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-ism-gold hover:bg-orange-100 transition-colors">
              Voir tous →
            </Link>
          </div>
          <p className="text-sm text-gray-500">Vacataires actifs</p>
          <p className="mt-1 text-4xl font-bold text-gray-900">{totalVacataires}</p>
          <p className="mt-1 text-xs text-gray-400">
            {profilsComplets} profil{profilsComplets !== 1 ? 's' : ''} complet{profilsComplets !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Séances semaine */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
              <svg className="h-5 w-5 text-ism-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <Link href="/responsable/emploi-du-temps" className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors">
              Planning →
            </Link>
          </div>
          <p className="text-sm text-gray-500">Séances programmées</p>
          <p className="mt-1 text-4xl font-bold text-gray-900">{seancesSemaine}</p>
          <p className="mt-1 text-xs text-gray-400">en attente de validation</p>
        </div>

        {/* Contrats expirants */}
        <div className={`rounded-2xl p-5 shadow-sm ${expirants.length > 0 ? 'border-2 border-amber-200 bg-amber-50' : 'bg-white'}`}>
          <div className="mb-3 flex items-center gap-2">
            <svg className={`h-5 w-5 ${expirants.length > 0 ? 'text-amber-500' : 'text-ism-gold'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span className={`text-sm font-bold ${expirants.length > 0 ? 'text-amber-700' : 'text-ism-gold'}`}>
              Contrats expirants
            </span>
          </div>
          {expirants.length > 0 ? (
            <>
              <p className="text-3xl font-bold text-amber-700">{expirants.length}</p>
              <p className="mt-1 text-xs text-amber-600">contrat{expirants.length !== 1 ? 's' : ''} expire{expirants.length !== 1 ? 'nt' : ''} dans 30 jours</p>
              <Link href="/responsable/vacataires" className="mt-3 inline-flex items-center text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors">
                Voir les dossiers →
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600">Aucun contrat n'expire dans les 30 prochains jours.</p>
            </>
          )}
        </div>
      </div>

      {/* Accès rapides */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-gray-900">Accès rapides</h3>
          <div className="space-y-2">
            {[
              { label: 'Dossiers vacataires', href: '/responsable/vacataires', desc: 'Gérer les profils et contrats' },
              { label: "Relevés d'heures", href: '/responsable/releves', desc: 'Superviser et répondre aux demandes' },
              { label: 'Emploi du temps', href: '/responsable/emploi-du-temps', desc: 'Planifier les séances' },
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
          <h3 className="mb-3 text-sm font-bold text-gray-900">Contrats expirant bientôt</h3>
          {expirants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <svg className="mb-2 h-8 w-8 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12" /></svg>
              <p className="text-xs text-gray-400">Aucun contrat expirant dans les 30 prochains jours</p>
            </div>
          ) : (
            <div className="space-y-2">
              {expirants.slice(0, 4).map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{c.nomVacataire}</p>
                    <p className="text-xs text-gray-500">{c.module} — {c.classe}</p>
                  </div>
                  <span className="text-xs font-semibold text-amber-600">
                    {new Date(c.dateFin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
