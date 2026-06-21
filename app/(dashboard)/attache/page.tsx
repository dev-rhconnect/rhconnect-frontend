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
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-extrabold" style={{ color: '#2B1D10', letterSpacing: '-0.015em' }}>
            Bonjour, {user?.prenom ?? 'Attaché'}
          </h2>
          <p className="mt-1 text-sm" style={{ color: '#8A7256' }}>
            Suivez les séances, saisissez les heures et soumettez les relevés mensuels.
          </p>
        </div>
        <Link
          href="/attache/releves/nouveau"
          className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
          style={{ background: '#C88500' }}
        >
          + Saisir des heures
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Classes affectées */}
        <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #F1E2D4', boxShadow: '0 1px 2px rgba(61,31,0,.05)' }}>
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl" style={{ background: '#F7E6C9' }}>
              <svg className="h-5 w-5" style={{ color: '#C88500' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
            </div>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: '#F7E6C9', color: '#C88500' }}>
              {vacatairesUniques} vacataire{vacatairesUniques !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#8A7256' }}>Classes affectées</p>
          <p className="mt-1.5 text-4xl font-extrabold leading-none" style={{ color: '#2B1D10', letterSpacing: '-0.02em' }}>{classesUniques}</p>
          <p className="mt-1 text-xs" style={{ color: '#8A7256' }}>avec {vacatairesUniques} vacataire{vacatairesUniques !== 1 ? 's' : ''} actif{vacatairesUniques !== 1 ? 's' : ''}</p>
        </div>

        {/* Heures ce mois */}
        <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #F1E2D4', boxShadow: '0 1px 2px rgba(61,31,0,.05)' }}>
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl" style={{ background: '#F7E6C9' }}>
              <svg className="h-5 w-5" style={{ color: '#C88500' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: '#F7E6C9', color: '#C88500' }}>Ce mois</span>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#8A7256' }}>Heures planifiées</p>
          <p className="mt-1.5 text-4xl font-extrabold leading-none" style={{ color: '#2B1D10', letterSpacing: '-0.02em' }}>{totalHeuresMois.toFixed(1)} h</p>
          <p className="mt-1 text-xs" style={{ color: '#8A7256' }}>{seancesCeMois.length} séance{seancesCeMois.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Relevés non soumis */}
        <div className="rounded-2xl p-5" style={
          relevesNonSoumis.length > 0
            ? { background: '#FFFBEB', border: '1px solid #FDE68A', boxShadow: '0 1px 2px rgba(61,31,0,.05)' }
            : { background: '#fff', border: '1px solid #F1E2D4', boxShadow: '0 1px 2px rgba(61,31,0,.05)' }
        }>
          <div className="mb-3">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl" style={{ background: relevesNonSoumis.length > 0 ? '#FEF3C7' : '#F7E6C9' }}>
              <svg className="h-5 w-5" style={{ color: relevesNonSoumis.length > 0 ? '#D97706' : '#C88500' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: relevesNonSoumis.length > 0 ? '#92400E' : '#8A7256' }}>Relevés non soumis</p>
          {relevesNonSoumis.length > 0 ? (
            <>
              <p className="mt-1.5 text-4xl font-extrabold leading-none" style={{ color: '#92400E', letterSpacing: '-0.02em' }}>{relevesNonSoumis.length}</p>
              <p className="mt-1 text-xs" style={{ color: '#D97706' }}>relevé{relevesNonSoumis.length !== 1 ? 's' : ''} en cours ce mois</p>
              <Link href="/attache/releves" className="mt-3 inline-flex items-center text-xs font-semibold" style={{ color: '#92400E' }}>
                Soumettre →
              </Link>
            </>
          ) : (
            <p className="mt-1.5 text-sm font-semibold" style={{ color: '#5C4A38' }}>Tous les relevés sont soumis.</p>
          )}
        </div>
      </div>

      {/* Classes et vacataires affectés */}
      <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #F1E2D4', boxShadow: '0 1px 2px rgba(61,31,0,.05)' }}>
        <h3 className="mb-4 text-sm font-bold" style={{ color: '#2B1D10' }}>Classes et vacataires affectés</h3>
        {paires.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-xs" style={{ color: '#8A7256' }}>Aucune affectation pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {paires.map((p, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: '#FCF5EE' }}>
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-ism-900 text-xs font-bold text-ism-gold">
                  {p.vacataire.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold" style={{ color: '#2B1D10' }}>{p.vacataire}</p>
                  <p className="text-xs" style={{ color: '#8A7256' }}>{p.classe}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <Link
          href="/attache/validations"
          className="mt-4 inline-flex items-center text-xs font-semibold transition-colors"
          style={{ color: '#8A7256' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#C88500' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#8A7256' }}
        >
          Voir les validations →
        </Link>
      </div>
    </div>
  )
}
