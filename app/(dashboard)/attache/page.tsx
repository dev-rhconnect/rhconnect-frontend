'use client'

import Link from 'next/link'
import { useAuthStore } from '@/store/auth.store'
import { useQuery } from '@tanstack/react-query'
import { seanceService } from '@/services/seance.service'
import { releveService } from '@/services/releve.service'

export default function AttacheDashboard() {
  const { user } = useAuthStore()

  const { data: seances = [] } = useQuery({
    queryKey: ['seances-toutes'],
    queryFn: seanceService.listerTous,
  })

  const { data: releves = [] } = useQuery({
    queryKey: ['releves-equipe'],
    queryFn: releveService.equipe,
  })

  const moisCourant = new Date().toISOString().slice(0, 7) // YYYY-MM

  // Classes et vacataires affectés (paires uniques depuis les séances)
  const pairesSet = new Map<string, { vacataire: string; classe: string }>()
  for (const s of seances) {
    const key = `${s.nomVacataire}__${s.classe}`
    if (!pairesSet.has(key)) pairesSet.set(key, { vacataire: s.nomVacataire, classe: s.classe })
  }
  const paires = Array.from(pairesSet.values())

  const classesUniques   = new Set(paires.map((p) => p.classe)).size
  const vacatairesUniques = new Set(paires.map((p) => p.vacataire)).size

  // Relevés non soumis du mois courant
  const relevesNonSoumis = releves.filter(
    (r) => r.periode === moisCourant && r.statut === 'EN_COURS'
  )

  const seancesCeMois = seances.filter((s) => s.dateSeance.startsWith(moisCourant))
  const totalHeuresMois = seancesCeMois.reduce((sum, s) => sum + (s.duree ?? 0), 0)

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl text-gray-900">
            Bonjour, {user?.prenom ?? 'Attaché'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Suivez les séances, saisissez les heures et soumettez les relevés mensuels.
          </p>
        </div>
        <Link
          href="/attache/releves/nouveau"
          className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white self-start shrink-0"
          style={{ background: '#C88500' }}
        >
          + Saisir des heures
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Classes affectées */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
              <svg className="h-5 w-5 text-ism-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
            </div>
            <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-ism-gold">
              {vacatairesUniques} vacataire{vacatairesUniques !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-sm text-gray-500">Classes affectées</p>
          <p className="mt-1 text-4xl font-bold text-gray-900">{classesUniques}</p>
          <p className="mt-1 text-xs text-gray-400">avec {vacatairesUniques} vacataire{vacatairesUniques !== 1 ? 's' : ''} actif{vacatairesUniques !== 1 ? 's' : ''}</p>
        </div>

        {/* Heures ce mois */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
              <svg className="h-5 w-5 text-ism-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-ism-gold">Ce mois</span>
          </div>
          <p className="text-sm text-gray-500">Heures planifiées</p>
          <p className="mt-1 text-4xl font-bold text-gray-900">{totalHeuresMois.toFixed(1)} h</p>
          <p className="mt-1 text-xs text-gray-400">{seancesCeMois.length} séance{seancesCeMois.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Relevés non soumis */}
        <div className={`rounded-2xl p-5 shadow-sm ${relevesNonSoumis.length > 0 ? 'border-2 border-amber-200 bg-amber-50' : 'bg-white'}`}>
          <div className="mb-3 flex items-center gap-2">
            <svg className={`h-5 w-5 ${relevesNonSoumis.length > 0 ? 'text-amber-500' : 'text-ism-gold'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span className={`text-sm font-bold ${relevesNonSoumis.length > 0 ? 'text-amber-700' : 'text-ism-gold'}`}>
              Relevés non soumis
            </span>
          </div>
          {relevesNonSoumis.length > 0 ? (
            <>
              <p className="text-3xl font-bold text-amber-700">{relevesNonSoumis.length}</p>
              <p className="mt-1 text-xs text-amber-600">relevé{relevesNonSoumis.length !== 1 ? 's' : ''} en cours ce mois</p>
              <Link href="/attache/releves" className="mt-3 inline-flex items-center text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors">
                Soumettre →
              </Link>
            </>
          ) : (
            <p className="text-sm text-gray-600">Tous les relevés du mois sont soumis.</p>
          )}
        </div>
      </div>

      {/* Classes et vacataires affectés */}
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-gray-900">Classes et vacataires affectés</h3>
        {paires.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-xs text-gray-400">Aucune affectation pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {paires.map((p, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-orange-50/60 px-4 py-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-ism-900 text-xs font-bold text-ism-gold">
                  {p.vacataire.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-gray-800">{p.vacataire}</p>
                  <p className="text-xs text-gray-500">{p.classe}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <Link
          href="/attache/validations"
          className="mt-4 inline-flex items-center text-xs font-semibold text-gray-500 hover:text-ism-gold transition-colors"
        >
          Voir les validations →
        </Link>
      </div>
    </div>
  )
}
