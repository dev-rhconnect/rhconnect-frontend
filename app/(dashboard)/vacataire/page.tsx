'use client'

import Link from 'next/link'
import { useAuthStore } from '@/store/auth.store'
import { useQuery } from '@tanstack/react-query'
import { contratService } from '@/services/contrat.service'
import { releveService } from '@/services/releve.service'

const STATUT_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  EN_COURS: { label: 'En cours',  color: '#C88500', bg: '#FFF8E1' },
  SOUMIS:   { label: 'Soumis',    color: '#1976D2', bg: '#E3F2FD' },
  VALIDE:   { label: 'Validé',    color: '#2E7D32', bg: '#E8F5E9' },
  REJETE:   { label: 'Rejeté',    color: '#C62828', bg: '#FFEBEE' },
}

export default function VacataireDashboard() {
  const { user } = useAuthStore()

  const { data: contrats = [] } = useQuery({
    queryKey: ['mon-contrat'],
    queryFn: contratService.monContrat,
  })

  const { data: releves = [] } = useQuery({
    queryKey: ['mes-releves'],
    queryFn: releveService.mesReleves,
  })

  const contratActif = contrats.find((c) => c.statut === 'ACTIF') ?? contrats[0] ?? null
  const volumePrevu  = contratActif?.volumeHorairePrevisionnel ?? 0

  // Total heures validées sur tous les relevés
  const heuresEffectuees = releves.reduce((sum, r) => sum + (r.totalHeuresValidees ?? 0), 0)
  const progression = volumePrevu > 0 ? Math.min(100, Math.round((heuresEffectuees / volumePrevu) * 100)) : 0

  // Dernier relevé soumis
  const dernierReleve = [...releves]
    .sort((a, b) => (b.dateSoumission ?? '').localeCompare(a.dateSoumission ?? ''))
    .find((r) => r.statut !== 'EN_COURS') ?? releves[releves.length - 1] ?? null

  const statutInfo = dernierReleve ? (STATUT_LABEL[dernierReleve.statut] ?? null) : null

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-extrabold" style={{ color: '#2B1D10', letterSpacing: '-0.015em' }}>
            Bonjour, {user?.prenom ?? 'Vacataire'}
          </h2>
          <p className="mt-1 text-sm" style={{ color: '#8A7256' }}>
            {contratActif
              ? `Contrat actif : ${contratActif.module} — ${contratActif.classe}`
              : 'Consultez votre contrat, vos heures effectuées et vos fiches de paie.'}
          </p>
        </div>
        <Link
          href="/vacataire/contrat"
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-colors"
          style={{ color: '#5C4A38' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#C88500' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#5C4A38' }}
        >
          Mon contrat →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Heures contractuelles */}
        <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #F1E2D4', boxShadow: '0 1px 2px rgba(61,31,0,.05)' }}>
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl" style={{ background: '#F7E6C9' }}>
              <svg className="h-5 w-5" style={{ color: '#C88500' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            {contratActif && (
              <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: '#DCFCE7', color: '#16A34A' }}>Actif</span>
            )}
          </div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#8A7256' }}>Heures contractuelles</p>
          <p className="mt-1.5 text-4xl font-extrabold leading-none" style={{ color: '#2B1D10', letterSpacing: '-0.02em' }}>
            {volumePrevu > 0 ? `${volumePrevu} h` : '— h'}
          </p>
          {contratActif && (
            <p className="mt-1 text-xs" style={{ color: '#8A7256' }}>
              Taux : {contratActif.tauxHoraire ? `${contratActif.tauxHoraire.toLocaleString('fr-FR')} FCFA/h` : '—'}
            </p>
          )}
        </div>

        {/* Heures effectuées */}
        <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #F1E2D4', boxShadow: '0 1px 2px rgba(61,31,0,.05)' }}>
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl" style={{ background: '#F7E6C9' }}>
              <svg className="h-5 w-5" style={{ color: '#C88500' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: '#F7E6C9', color: '#C88500' }}>
              {progression} %
            </span>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#8A7256' }}>Heures effectuées</p>
          <p className="mt-1.5 text-4xl font-extrabold leading-none" style={{ color: '#2B1D10', letterSpacing: '-0.02em' }}>{heuresEffectuees.toFixed(1)} h</p>
          <div className="mt-3 h-2 w-full rounded-full" style={{ background: '#F7E6C9' }}>
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${progression}%`, background: progression >= 100 ? '#16A34A' : '#C88500' }}
            />
          </div>
          {volumePrevu > 0 && (
            <p className="mt-1 text-xs" style={{ color: '#8A7256' }}>
              {heuresEffectuees.toFixed(1)} / {volumePrevu} h prévues
            </p>
          )}
        </div>

        {/* Statut dernier relevé */}
        <div
          className="rounded-2xl p-5"
          style={statutInfo
            ? { background: statutInfo.bg, border: `1px solid ${statutInfo.color}40`, boxShadow: '0 1px 2px rgba(61,31,0,.05)' }
            : { background: 'white', border: '1px solid #F1E2D4', boxShadow: '0 1px 2px rgba(61,31,0,.05)' }}
        >
          <div className="mb-3">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl" style={{ background: (statutInfo?.color ?? '#C88500') + '22' }}>
              <svg className="h-5 w-5" style={{ color: statutInfo?.color ?? '#C88500' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: statutInfo?.color ?? '#8A7256' }}>Dernier relevé</p>
          {dernierReleve ? (
            <>
              <p className="mt-1 text-sm font-semibold" style={{ color: '#2B1D10' }}>{dernierReleve.module}</p>
              <p className="mt-0.5 text-xs" style={{ color: '#8A7256' }}>{dernierReleve.periode} — {dernierReleve.totalHeuresValidees.toFixed(1)} h</p>
              <span
                className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold"
                style={{ background: statutInfo?.color ?? '#C88500', color: 'white' }}
              >
                {statutInfo?.label ?? dernierReleve.statut}
              </span>
            </>
          ) : (
            <p className="mt-1 text-sm font-semibold" style={{ color: '#5C4A38' }}>Aucun relevé soumis.</p>
          )}
          <Link href="/vacataire/releves" className="mt-4 inline-flex items-center text-xs font-semibold transition-colors" style={{ color: '#8A7256' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#C88500' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#8A7256' }}
          >
            Voir mes relevés →
          </Link>
        </div>
      </div>

      {/* Accès rapide rémunérations */}
      <div className="mt-4 rounded-2xl bg-white p-5" style={{ border: '1px solid #F1E2D4', boxShadow: '0 1px 2px rgba(61,31,0,.05)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl" style={{ background: '#F7E6C9' }}>
              <svg className="h-5 w-5" style={{ color: '#C88500' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: '#2B1D10' }}>Mes rémunérations</p>
              <p className="text-xs" style={{ color: '#8A7256' }}>Fiches de paie disponibles après validation</p>
            </div>
          </div>
          <Link
            href="/vacataire/fiches-paie"
            className="rounded-xl px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: '#C88500' }}
          >
            Voir mes fiches →
          </Link>
        </div>
      </div>
    </div>
  )
}
