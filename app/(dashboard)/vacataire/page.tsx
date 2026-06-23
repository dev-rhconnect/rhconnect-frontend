'use client'

import Link from 'next/link'
import { useAuthStore } from '@/store/auth.store'
import { useQuery } from '@tanstack/react-query'
import { contratService } from '@/services/contrat.service'
import { releveService } from '@/services/releve.service'
import { seanceService } from '@/services/seance.service'

function jourCourt(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][d.getDay()]
}

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
    queryFn: releveService.mesRelevesValides,
  })

  const { data: seances = [] } = useQuery({
    queryKey: ['mes-seances'],
    queryFn: seanceService.mesSeances,
    staleTime: 2 * 60 * 1000,
  })

  const contratActif = contrats.find((c) => c.statut === 'ACTIF' && !c.estAvenant) ?? contrats[0] ?? null
  const modules = contratActif?.modules ?? []

  // Prochaines séances (aujourd'hui ou futures, programmées)
  const todayStr = new Date().toISOString().slice(0, 10)
  const prochainesSeances = seances
    .filter(s => s.dateSeance >= todayStr && s.statut === 'PROGRAMMEE')
    .sort((a, b) => a.dateSeance.localeCompare(b.dateSeance))
    .slice(0, 3)
  const volumePrevu  = contratActif?.volumeHorairePrevisionnel ?? 0

  // Heures validées (uniquement statut VALIDE)
  const heuresEffectuees = releves
    .filter(r => r.statut === 'VALIDE')
    .reduce((sum, r) => sum + (r.totalHeuresValidees ?? 0), 0)
  const progression = volumePrevu > 0 ? Math.min(100, Math.round((heuresEffectuees / volumePrevu) * 100)) : 0

  // Dernier relevé soumis (hors EN_COURS, trié par date de soumission desc)
  const dernierReleve = [...releves]
    .sort((a, b) => (b.dateSoumission ?? b.periode ?? '').localeCompare(a.dateSoumission ?? a.periode ?? ''))
    .find((r) => r.statut !== 'EN_COURS') ?? releves[releves.length - 1] ?? null

  const statutInfo = dernierReleve ? (STATUT_LABEL[dernierReleve.statut] ?? null) : null

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Bonjour, {user?.prenom ?? 'Vacataire'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {contratActif
              ? `Contrat actif — ${contratActif.anneeAcademique}`
              : 'Consultez votre contrat, vos heures effectuées et vos fiches de paie.'}
          </p>
        </div>
        <Link
          href="/vacataire/contrat"
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold text-ism-900 hover:text-ism-gold transition-colors"
        >
          Mon contrat →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Heures contractuelles */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
              <svg className="h-5 w-5 text-ism-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            {contratActif && (
              <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-600">Actif</span>
            )}
          </div>
          <p className="text-sm text-gray-500">Heures contractuelles</p>
          <p className="mt-1 text-4xl font-bold text-gray-900">
            {volumePrevu > 0 ? `${volumePrevu} h` : '— h'}
          </p>
          {contratActif && (
            <p className="mt-1 text-xs text-gray-400">
              Taux : {contratActif.tauxHoraire ? `${contratActif.tauxHoraire.toLocaleString('fr-FR')} FCFA/h` : '—'}
            </p>
          )}
        </div>

        {/* Heures effectuées vs volume prévu */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
              <svg className="h-5 w-5 text-ism-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-ism-gold">
              {progression} %
            </span>
          </div>
          <p className="text-sm text-gray-500">Heures effectuées</p>
          <p className="mt-1 text-4xl font-bold text-gray-900">{heuresEffectuees.toFixed(1)} h</p>
          <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: `${progression}%`,
                background: progression >= 100 ? '#2E7D32' : '#C88500',
              }}
            />
          </div>
          {volumePrevu > 0 && (
            <p className="mt-1 text-xs text-gray-400">
              {heuresEffectuees.toFixed(1)} / {volumePrevu} h prévues
            </p>
          )}
        </div>

        {/* Statut dernier relevé */}
        <div
          className="rounded-2xl p-5 shadow-sm"
          style={statutInfo ? { background: statutInfo.bg, border: `2px solid ${statutInfo.color}40` } : { background: 'white' }}
        >
          <div className="mb-3 flex items-center gap-2">
            <svg className="h-5 w-5" style={{ color: statutInfo?.color ?? '#C88500' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <span className="text-sm font-bold" style={{ color: statutInfo?.color ?? '#C88500' }}>
              Dernier relevé
            </span>
          </div>
          {dernierReleve ? (
            <>
              <p className="text-sm font-semibold text-gray-800">{dernierReleve.module}</p>
              <p className="mt-1 text-xs text-gray-500">{dernierReleve.periode} — {dernierReleve.totalHeuresValidees.toFixed(1)} h</p>
              <span
                className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold"
                style={{ background: statutInfo?.color ?? '#C88500', color: 'white' }}
              >
                {statutInfo?.label ?? dernierReleve.statut}
              </span>
            </>
          ) : (
            <p className="text-sm text-gray-600">Aucun relevé soumis pour le moment.</p>
          )}
          <Link href="/vacataire/releves" className="mt-4 inline-flex items-center text-xs font-semibold text-gray-900 hover:text-ism-gold transition-colors">
            Voir mes relevés →
          </Link>
        </div>
      </div>

      {/* ── Avancement par module ── */}
      {modules.length > 0 && (
        <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Mes modules — avancement</h3>
            <Link href="/vacataire/contrat" className="text-xs text-amber-700 hover:underline">Voir détails →</Link>
          </div>
          <div className="space-y-3">
            {modules.map(m => {
              const vh = m.volumeHorairePrevisionnel ?? 0
              const done = m.heuresEffectuees ?? 0
              const pct = vh > 0 ? Math.min(100, Math.round((done / vh) * 100)) : 0
              const statutColor = m.statut === 'EN_COURS' ? '#3B82F6' : m.statut === 'TERMINE' ? '#22C55E' : '#9CA3AF'
              const statutLabel = m.statut === 'EN_COURS' ? 'En cours' : m.statut === 'TERMINE' ? 'Terminé' : 'Non commencé'
              return (
                <div key={m.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{m.nomModule}</p>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-xs font-bold" style={{ color: statutColor }}>{statutLabel}</span>
                        <span className="text-xs text-gray-500">{done}h / {vh}h</span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100">
                      <div className="h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: pct >= 100 ? '#22C55E' : '#C88500' }} />
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">{m.classes?.join(', ')} · {pct}%</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Prochaines séances ── */}
      {prochainesSeances.length > 0 && (
        <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Prochaines séances</h3>
            <Link href="/vacataire/planning" className="text-xs text-amber-700 hover:underline">Mon planning →</Link>
          </div>
          <div className="space-y-2">
            {prochainesSeances.map(s => (
              <div key={s.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div className="flex-shrink-0 w-10 text-center">
                  <p className="text-xs text-gray-400">{jourCourt(s.dateSeance)}</p>
                  <p className="text-base font-bold text-gray-900">{new Date(s.dateSeance + 'T12:00:00').getUTCDate()}</p>
                </div>
                <div className="h-8 w-px bg-gray-200" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{s.module}</p>
                  <p className="text-xs text-gray-400">{s.classe} · {s.heureDebut}–{s.heureFin}{s.salle ? ` · Salle ${s.salle}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accès rapide rémunérations */}
      <div className="mt-4 rounded-2xl border border-orange-100 bg-white p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
              <svg className="h-5 w-5 text-ism-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Mes rémunérations</p>
              <p className="text-xs text-gray-400">Fiches de paie disponibles après validation</p>
            </div>
          </div>
          <Link
            href="/vacataire/fiches-paie"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
            style={{ background: '#C88500' }}
          >
            Voir mes fiches →
          </Link>
        </div>
      </div>
    </div>
  )
}
