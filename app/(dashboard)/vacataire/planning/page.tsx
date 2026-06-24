'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { seanceService, type SeanceProgrammeeResponse } from '@/services/seance.service'

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MOIS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const STATUT_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
  PROGRAMMEE: { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  REALISEE:   { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
  ANNULEE:    { bg: '#FEF2F2', text: '#B91C1C', dot: '#EF4444' },
}

export default function PlanningVacatairePage() {
  const today = new Date()
  const [moisCourant, setMoisCourant] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState<SeanceProgrammeeResponse[] | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const { data: seances = [], isLoading } = useQuery({
    queryKey: ['mes-seances'],
    queryFn: seanceService.mesSeances,
    staleTime: 2 * 60 * 1000,
  })

  // Indexer les séances par date YYYY-MM-DD
  const seancesParJour = useMemo(() => {
    const map = new Map<string, SeanceProgrammeeResponse[]>()
    for (const s of seances) {
      const key = s.dateSeance.slice(0, 10)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(s)
    }
    return map
  }, [seances])

  // Grille calendrier
  const cellules = useMemo(() => {
    const annee = moisCourant.getFullYear()
    const mois = moisCourant.getMonth()
    const premierJour = new Date(annee, mois, 1)
    const dernierJour = new Date(annee, mois + 1, 0)
    // Lundi = 0
    const offsetDebut = (premierJour.getDay() + 6) % 7
    const cells: (Date | null)[] = []
    for (let i = 0; i < offsetDebut; i++) cells.push(null)
    for (let d = 1; d <= dernierJour.getDate(); d++) cells.push(new Date(annee, mois, d))
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [moisCourant])

  const moisPrecedent = () => setMoisCourant(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  const moisSuivant  = () => setMoisCourant(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))

  function handleJourClick(date: Date) {
    const key = toKey(date)
    const s = seancesParJour.get(key) ?? []
    setSelected(s.length > 0 ? s : null)
    setSelectedDate(key)
  }

  const todayKey = toKey(today)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold sm:text-2xl text-gray-900">Mon planning</h2>
        <p className="mt-1 text-sm text-gray-500">Consultez vos séances programmées, réalisées et annulées.</p>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        {Object.entries({ PROGRAMMEE: 'Programmée', REALISEE: 'Réalisée', ANNULEE: 'Annulée' }).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUT_COLOR[k].dot }} />
            {v}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Calendrier ── */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-5 shadow-sm">
          {/* Navigation mois */}
          <div className="mb-4 flex items-center justify-between">
            <button onClick={moisPrecedent}
              className="rounded-lg border border-gray-200 p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <h3 className="text-base font-bold text-gray-900">
              {MOIS_FR[moisCourant.getMonth()]} {moisCourant.getFullYear()}
            </h3>
            <button onClick={moisSuivant}
              className="rounded-lg border border-gray-200 p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* En-têtes jours */}
          <div className="grid grid-cols-7 mb-1">
            {JOURS.map(j => (
              <div key={j} className="py-1 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">{j}</div>
            ))}
          </div>

          {/* Grille */}
          {isLoading ? (
            <div className="py-12 text-center text-sm text-gray-400">Chargement…</div>
          ) : (
            <div className="grid grid-cols-7 gap-0.5">
              {cellules.map((date, i) => {
                if (!date) return <div key={i} />
                const key = toKey(date)
                const seancesJour = seancesParJour.get(key) ?? []
                const isToday = key === todayKey
                const isSelected = key === selectedDate
                const statutsPresents = [...new Set(seancesJour.map(s => s.statut))]

                return (
                  <button key={i} onClick={() => handleJourClick(date)}
                    className={`relative flex flex-col items-center rounded-xl p-1.5 min-h-[52px] transition-all ${
                      isSelected
                        ? 'bg-amber-50 ring-2 ring-amber-400'
                        : isToday
                        ? 'bg-amber-500 text-white'
                        : seancesJour.length > 0
                        ? 'bg-gray-50 hover:bg-amber-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className={`text-sm font-semibold ${
                      isToday ? 'text-white' : isSelected ? 'text-amber-800' : 'text-gray-700'
                    }`}>
                      {date.getDate()}
                    </span>
                    {statutsPresents.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {statutsPresents.map(s => (
                          <span key={s} className="h-1.5 w-1.5 rounded-full" style={{ background: isToday ? 'white' : STATUT_COLOR[s]?.dot ?? '#C88500' }} />
                        ))}
                      </div>
                    )}
                    {seancesJour.length > 1 && (
                      <span className={`text-[10px] font-bold ${isToday ? 'text-white/80' : 'text-gray-400'}`}>
                        {seancesJour.length}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Détail du jour sélectionné ── */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          {selected && selected.length > 0 ? (
            <>
              <h3 className="mb-3 text-sm font-bold text-gray-900">
                {formatDateFR(selectedDate!)}
              </h3>
              <div className="space-y-3">
                {selected.map(s => {
                  const c = STATUT_COLOR[s.statut] ?? STATUT_COLOR.PROGRAMMEE
                  return (
                    <div key={s.id} className="rounded-xl border p-3" style={{ borderColor: c.dot + '40', background: c.bg }}>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <p className="text-sm font-semibold text-gray-900 leading-snug">{s.module ?? '—'}</p>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: c.dot, color: 'white' }}>
                          {s.statut === 'PROGRAMMEE' ? 'Prévu' : s.statut === 'REALISEE' ? 'Réalisé' : 'Annulé'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {s.classes && s.classes.length > 0 ? s.classes.join(', ') : s.classe}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {typeof s.heureDebut === 'string' ? s.heureDebut.slice(0,5) : String(s.heureDebut)} – {typeof s.heureFin === 'string' ? s.heureFin.slice(0,5) : String(s.heureFin)}
                        {s.salle && <span className="ml-2">· Salle {s.salle}</span>}
                        {s.typeSeance && <span className="ml-2">· {s.typeSeance}</span>}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs font-semibold text-gray-700">{s.duree}h</p>
                        {s.feuillePresenceUploaded && (
                          <span className="text-[10px] text-green-700 font-medium">✓ Feuille uploadée</span>
                        )}
                      </div>
                      {s.noteInterne && (
                        <p className="text-xs text-gray-400 italic mt-1">Note : {s.noteInterne}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          ) : selectedDate ? (
            <div className="flex h-full flex-col items-center justify-center py-8 text-center">
              <svg className="h-10 w-10 text-gray-200 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <p className="text-sm text-gray-400">Aucune séance ce jour.</p>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center py-8 text-center">
              <svg className="h-10 w-10 text-gray-200 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <p className="text-sm text-gray-400">Cliquez sur un jour<br />pour voir vos séances.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Liste de toutes les séances du mois ── */}
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-gray-900">
          Séances de {MOIS_FR[moisCourant.getMonth()]} {moisCourant.getFullYear()}
        </h3>
        {(() => {
          const debut = toKey(new Date(moisCourant.getFullYear(), moisCourant.getMonth(), 1))
          const fin   = toKey(new Date(moisCourant.getFullYear(), moisCourant.getMonth() + 1, 0))
          const seancesMois = seances
            .filter(s => s.dateSeance >= debut && s.dateSeance <= fin)
            .sort((a, b) => a.dateSeance.localeCompare(b.dateSeance))

          if (seancesMois.length === 0)
            return <p className="text-sm text-gray-400">Aucune séance ce mois-ci.</p>

          return (
            <div className="space-y-2">
              {seancesMois.map(s => {
                const c = STATUT_COLOR[s.statut] ?? STATUT_COLOR.PROGRAMMEE
                return (
                  <div key={s.id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
                    <div className="flex-shrink-0 w-10 text-center">
                      <p className="text-xs text-gray-400">{jourCourt(s.dateSeance)}</p>
                      <p className="text-base font-bold text-gray-900">{new Date(s.dateSeance).getUTCDate()}</p>
                    </div>
                    <div className="h-8 w-px bg-gray-100" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{s.module ?? '—'}</p>
                      <p className="text-xs text-gray-400">
                        {s.classes && s.classes.length > 0 ? s.classes.join(', ') : s.classe} · {typeof s.heureDebut === 'string' ? s.heureDebut.slice(0,5) : s.heureDebut}–{typeof s.heureFin === 'string' ? s.heureFin.slice(0,5) : s.heureFin} · {s.duree}h{s.salle ? ` · Salle ${s.salle}` : ''}
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: c.dot, color: 'white' }}>
                      {s.statut === 'PROGRAMMEE' ? 'Prévu' : s.statut === 'REALISEE' ? 'Réalisé' : 'Annulé'}
                    </span>
                  </div>
                )
              })}
            </div>
          )
        })()}
      </div>
    </div>
  )
}

function toKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function formatDateFR(key: string): string {
  const d = new Date(key + 'T12:00:00')
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function jourCourt(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][d.getDay()]
}
