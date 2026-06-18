'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useQuery, useMutation } from '@tanstack/react-query'
import { vacataireService } from '@/services/vacataire.service'
import { contratService } from '@/services/contrat.service'
import { seanceService } from '@/services/seance.service'
import { releveService } from '@/services/releve.service'
import { rapportService } from '@/services/rapport.service'

export default function ResponsableDashboard() {
  const { user } = useAuthStore()

  const moisCourant = new Date().toISOString().slice(0, 7)
  const [exportMois, setExportMois] = useState(moisCourant)
  const [exporting, setExporting] = useState(false)

  const { data: vacataires = [] } = useQuery({ queryKey: ['vacataires'], queryFn: vacataireService.listerTous })
  const { data: expirants  = [] } = useQuery({ queryKey: ['contrats-expirants'], queryFn: contratService.expirants })
  const { data: seances    = [] } = useQuery({ queryKey: ['seances-toutes'], queryFn: seanceService.listerTous })
  const { data: releves    = [] } = useQuery({ queryKey: ['releves-equipe'], queryFn: releveService.equipe })

  const totalVacataires = vacataires.length
  const profilsComplets = vacataires.filter((v) => v.profilComplet).length
  const seancesProgrammees = seances.filter((s) => s.statut === 'PROGRAMMEE').length

  // Vacataires sans relevé soumis ou validé ce mois
  const vacatairesSoumis = new Set(
    releves
      .filter((r) => r.periode === moisCourant && (r.statut === 'SOUMIS' || r.statut === 'VALIDE'))
      .map((r) => r.nomVacataire)
  )
  const sansSoumission = vacataires.filter((v) => {
    const nom = `${v.prenom} ${v.nom}`
    return !vacatairesSoumis.has(nom)
  })

  const handleExportPdf = async () => {
    setExporting(true)
    try { await rapportService.telechargerRpMensuel(exportMois) }
    finally { setExporting(false) }
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-extrabold" style={{ color: '#2B1D10', letterSpacing: '-0.015em' }}>
            Bonjour, {user?.prenom ?? 'Responsable'}
          </h2>
          <p className="mt-1 text-sm" style={{ color: '#8A7256' }}>
            Gérez les dossiers vacataires, les contrats et l'emploi du temps.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export rapport mensuel */}
          <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2">
            <input
              type="month"
              value={exportMois}
              onChange={(e) => setExportMois(e.target.value)}
              className="text-xs text-gray-600 focus:outline-none"
            />
            <button
              onClick={handleExportPdf}
              disabled={exporting}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-60 transition-opacity"
              style={{ background: '#7A4010' }}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {exporting ? 'Export...' : 'Rapport PDF'}
            </button>
          </div>
          <Link
            href="/responsable/vacataires/nouveau"
            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
            style={{ background: '#C88500' }}
          >
            + Nouveau vacataire
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* Vacataires */}
        <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #F1E2D4', boxShadow: '0 1px 2px rgba(61,31,0,.05)' }}>
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl" style={{ background: '#F7E6C9' }}>
              <svg className="h-5 w-5" style={{ color: '#C88500' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <Link href="/responsable/vacataires" className="rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors" style={{ background: '#F7E6C9', color: '#C88500' }}>
              Voir →
            </Link>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#8A7256' }}>Vacataires actifs</p>
          <p className="mt-1.5 text-4xl font-extrabold leading-none" style={{ color: '#2B1D10', letterSpacing: '-0.02em' }}>{totalVacataires}</p>
          <p className="mt-1 text-xs" style={{ color: '#8A7256' }}>{profilsComplets} profil{profilsComplets !== 1 ? 's' : ''} complet{profilsComplets !== 1 ? 's' : ''}</p>
        </div>

        {/* Séances programmées */}
        <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #F1E2D4', boxShadow: '0 1px 2px rgba(61,31,0,.05)' }}>
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl" style={{ background: '#F7E6C9' }}>
              <svg className="h-5 w-5" style={{ color: '#C88500' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <Link href="/responsable/emploi-du-temps" className="rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors" style={{ background: '#F7E6C9', color: '#C88500' }}>
              Planning →
            </Link>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#8A7256' }}>Séances programmées</p>
          <p className="mt-1.5 text-4xl font-extrabold leading-none" style={{ color: '#2B1D10', letterSpacing: '-0.02em' }}>{seancesProgrammees}</p>
          <p className="mt-1 text-xs" style={{ color: '#8A7256' }}>en attente de validation</p>
        </div>

        {/* Vacataires sans relevé soumis */}
        <div className="rounded-2xl p-5" style={
          sansSoumission.length > 0
            ? { background: '#EFF6FF', border: '1px solid #BFDBFE', boxShadow: '0 1px 2px rgba(61,31,0,.05)' }
            : { background: '#fff', border: '1px solid #F1E2D4', boxShadow: '0 1px 2px rgba(61,31,0,.05)' }
        }>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl" style={{ background: sansSoumission.length > 0 ? '#DBEAFE' : '#F7E6C9' }}>
              <svg className="h-5 w-5" style={{ color: sansSoumission.length > 0 ? '#3B82F6' : '#C88500' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
              </svg>
            </div>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: sansSoumission.length > 0 ? '#1D4ED8' : '#8A7256' }}>Sans relevé soumis</p>
          {sansSoumission.length > 0 ? (
            <>
              <p className="mt-1.5 text-4xl font-extrabold leading-none" style={{ color: '#1D4ED8', letterSpacing: '-0.02em' }}>{sansSoumission.length}</p>
              <p className="mt-1 text-xs" style={{ color: '#3B82F6' }}>vacataire{sansSoumission.length !== 1 ? 's' : ''} sans relevé ce mois</p>
            </>
          ) : (
            <p className="mt-1.5 text-sm font-semibold" style={{ color: '#5C4A38' }}>Tous ont soumis leur relevé.</p>
          )}
        </div>

        {/* Contrats expirants */}
        <div className="rounded-2xl p-5" style={
          expirants.length > 0
            ? { background: '#FFFBEB', border: '1px solid #FDE68A', boxShadow: '0 1px 2px rgba(61,31,0,.05)' }
            : { background: '#fff', border: '1px solid #F1E2D4', boxShadow: '0 1px 2px rgba(61,31,0,.05)' }
        }>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl" style={{ background: expirants.length > 0 ? '#FEF3C7' : '#F7E6C9' }}>
              <svg className="h-5 w-5" style={{ color: expirants.length > 0 ? '#D97706' : '#C88500' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: expirants.length > 0 ? '#92400E' : '#8A7256' }}>Contrats expirants</p>
          {expirants.length > 0 ? (
            <>
              <p className="mt-1.5 text-4xl font-extrabold leading-none" style={{ color: '#92400E', letterSpacing: '-0.02em' }}>{expirants.length}</p>
              <p className="mt-1 text-xs" style={{ color: '#D97706' }}>expirent dans 30 jours</p>
              <Link href="/responsable/contrats" className="mt-2 inline-flex items-center text-xs font-semibold transition-colors" style={{ color: '#92400E' }}>
                Voir les contrats →
              </Link>
            </>
          ) : (
            <p className="mt-1.5 text-sm font-semibold" style={{ color: '#5C4A38' }}>Aucun contrat expirant.</p>
          )}
        </div>
      </div>

      {/* Accès rapides + liste contrats expirants */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #F1E2D4', boxShadow: '0 1px 2px rgba(61,31,0,.05)' }}>
          <h3 className="mb-3 text-sm font-bold" style={{ color: '#2B1D10' }}>Accès rapides</h3>
          <div className="space-y-1">
            {[
              { label: 'Dossiers vacataires',    href: '/responsable/vacataires',     desc: 'Gérer les profils et signatures' },
              { label: 'Contrats',               href: '/responsable/contrats',        desc: 'Créer et suivre les contrats' },
              { label: "Relevés d'heures",       href: '/responsable/releves',         desc: 'Superviser et valider les relevés' },
              { label: 'Emploi du temps',        href: '/responsable/emploi-du-temps', desc: 'Planifier les séances' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-xl px-4 py-3 transition-colors group"
                style={{ color: '#2B1D10' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#FCF5EE' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#2B1D10' }}>{item.label}</p>
                  <p className="text-xs" style={{ color: '#8A7256' }}>{item.desc}</p>
                </div>
                <svg className="h-4 w-4" style={{ color: '#E7D3C1' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #F1E2D4', boxShadow: '0 1px 2px rgba(61,31,0,.05)' }}>
          <h3 className="mb-3 text-sm font-bold" style={{ color: '#2B1D10' }}>Contrats expirant bientôt</h3>
          {expirants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <svg className="mb-2 h-8 w-8" style={{ color: '#E7D3C1' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12" /></svg>
              <p className="text-xs" style={{ color: '#8A7256' }}>Aucun contrat expirant dans les 30 prochains jours</p>
            </div>
          ) : (
            <div className="space-y-2">
              {expirants.slice(0, 4).map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl px-4 py-2.5" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#2B1D10' }}>{c.nomVacataire}</p>
                    <p className="text-xs" style={{ color: '#8A7256' }}>{c.module} — {c.classe}</p>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: '#D97706' }}>
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
