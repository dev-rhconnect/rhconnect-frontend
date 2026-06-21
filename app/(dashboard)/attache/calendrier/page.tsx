'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { seanceService, type SeanceProgrammeeResponse } from '@/services/seance.service'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/auth.store'

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const HEURES = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]

/* Palette marron/doré ISM — toutes teintes chaudes */
const STATUT_STYLES: Record<string, { card: string; badge: string; dot: string }> = {
  PROGRAMMEE: {
    card:  'bg-[#FDF6ED] border-[#C88500] text-[#7A4010]',
    badge: 'bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]',
    dot:   'bg-[#C88500]',
  },
  REALISEE: {
    card:  'bg-[#F0FBF4] border-[#2D9B5A] text-[#1A5C33]',
    badge: 'bg-[#DCFCE7] text-[#166534] border border-[#86EFAC]',
    dot:   'bg-[#2D9B5A]',
  },
  ANNULEE: {
    card:  'bg-[#F5F0EB] border-[#C4A882] text-[#8C6A42] opacity-60',
    badge: 'bg-[#F5F0EB] text-[#8C6A42] border border-[#C4A882]',
    dot:   'bg-[#C4A882]',
  },
}
const STATUT_COLORS = {
  PROGRAMMEE: STATUT_STYLES.PROGRAMMEE.badge,
  REALISEE:   STATUT_STYLES.REALISEE.badge,
  ANNULEE:    STATUT_STYLES.ANNULEE.badge,
}

function lundiDe(ref: Date): Date {
  const d = new Date(ref)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
}
function toISO(d: Date): string { return d.toISOString().slice(0, 10) }
function formatSemaine(lundi: Date): string {
  const dim = addDays(lundi, 6)
  return `${lundi.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} → ${dim.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}`
}
function heureToMin(h: string): number {
  const [hh, mm] = h.split(':').map(Number)
  return hh * 60 + mm
}

export default function AttacheCalendrierPage() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const niveauDefaut = user?.niveauGere ?? ''
  const [niveauFiltre, setNiveauFiltre] = useState(niveauDefaut)

  const [lundi, setLundi] = useState<Date>(() => lundiDe(new Date()))
  const [classeNom, setClasseNom] = useState('')
  const [seanceSelectionnee, setSeanceSelectionnee] = useState<SeanceProgrammeeResponse | null>(null)
  const [noteValidation, setNoteValidation] = useState('')
  const [motifAnnulation, setMotifAnnulation] = useState('')
  const [actionMode, setActionMode] = useState<'valider' | 'annuler' | null>(null)

  const reference = toISO(lundi)

  const { data: seances = [], isLoading } = useQuery({
    queryKey: ['seances-semaine-attache', reference, classeNom],
    queryFn: () => seanceService.semaine(reference, classeNom || undefined),
  })

  const { data: maquette = [] } = useQuery({
    queryKey: ['maquette'],
    queryFn: () => api.get<{ classeNom: string }[]>('/maquette').then(r => r.data),
  })

  const niveauxDisponibles = useMemo(() => {
    const all = [...new Set(maquette.map(m => {
      const match = m.classeNom.match(/^(L\d|M\d|BTS|DUT)/i)
      return match ? match[1].toUpperCase() : 'Autre'
    }))]
    return all.sort()
  }, [maquette])

  const classes = useMemo(() => {
    const all = [...new Set(maquette.map(m => m.classeNom))].sort()
    if (!niveauFiltre) return all
    return all.filter(c => c.toUpperCase().startsWith(niveauFiltre.toUpperCase()))
  }, [maquette, niveauFiltre])

  const { mutate: valider, isPending: validating } = useMutation({
    mutationFn: (id: number) => seanceService.valider(id, noteValidation || undefined),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['seances-semaine-attache'] })
      setSeanceSelectionnee(updated); setActionMode(null); setNoteValidation('')
    },
  })

  const { mutate: annuler, isPending: annulant } = useMutation({
    mutationFn: (id: number) => seanceService.annuler(id, motifAnnulation || undefined),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['seances-semaine-attache'] })
      setSeanceSelectionnee(updated); setActionMode(null); setMotifAnnulation('')
    },
  })

  const seancesParJour = useMemo(() => {
    const map: Record<number, SeanceProgrammeeResponse[]> = {}
    for (let i = 0; i < 6; i++) map[i] = []
    for (const s of seances) {
      const date = new Date(s.dateSeance + 'T00:00:00')
      const day = date.getDay()
      const idx = day === 0 ? 6 : day - 1
      if (idx < 6) map[idx].push(s)
    }
    return map
  }, [seances])

  const programmees = seances.filter(s => s.statut === 'PROGRAMMEE').length
  const realisees = seances.filter(s => s.statut === 'REALISEE').length

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Calendrier des séances</h2>
          <p className="mt-0.5 text-sm text-gray-500">📅 {formatSemaine(lundi)} · Validez les séances réalisées</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <button onClick={() => { setNiveauFiltre(''); setClasseNom('') }}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${!niveauFiltre ? 'bg-[#C88500] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >Tous</button>
            {niveauxDisponibles.map(niv => (
              <button key={niv}
                onClick={() => { setNiveauFiltre(niv === niveauFiltre ? '' : niv); setClasseNom('') }}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${niveauFiltre === niv ? 'bg-[#C88500] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >{niv}</button>
            ))}
          </div>
          <select value={classeNom} onChange={e => setClasseNom(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#C88500]">
            <option value="">Toutes les classes</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex items-center rounded-xl border border-gray-200 bg-white overflow-hidden">
            <button onClick={() => setLundi(addDays(lundi, -7))} className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors">←</button>
            <button onClick={() => setLundi(lundiDe(new Date()))} className="px-3 py-2 text-xs font-semibold text-[#7A4010] hover:bg-orange-50 border-x border-gray-200 transition-colors">Aujourd'hui</button>
            <button onClick={() => setLundi(addDays(lundi, 7))} className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors">→</button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Séances cette semaine', value: seances.length, icon: '📋', bg: 'bg-[#FDF6ED]', val: 'text-[#7A4010]', sub: 'total' },
          { label: 'À valider', value: programmees, icon: '⏳', bg: 'bg-amber-50', val: 'text-amber-700', sub: 'en attente' },
          { label: 'Validées', value: realisees, icon: '✅', bg: 'bg-emerald-50', val: 'text-emerald-700', sub: 'réalisées' },
        ].map(k => (
          <div key={k.label} className={`rounded-2xl ${k.bg} p-4 shadow-sm border border-white`}>
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-2xl font-bold ${k.val}`}>{k.value}</p>
                <p className="text-xs font-medium text-gray-600 mt-0.5">{k.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{k.sub}</p>
              </div>
              <span className="text-xl">{k.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Grille */}
      <div className="flex-1 rounded-2xl overflow-auto border border-[#E8D8C4]" style={{ background: '#FBF7F2' }}>
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-[#7A4010] text-sm gap-2">
            <span className="inline-block w-4 h-4 border-2 border-[#C88500] border-t-transparent rounded-full animate-spin" />
            Chargement…
          </div>
        ) : (
          <div className="min-w-[800px]">
            {/* En-têtes jours */}
            <div className="grid grid-cols-[56px_repeat(6,1fr)] sticky top-0 z-10 border-b border-[#E8D8C4]"
              style={{ background: 'linear-gradient(180deg, #7A4010 0%, #9B5520 100%)' }}
            >
              <div className="border-r border-white/10 py-3" />
              {JOURS.map((jour, i) => {
                const date = addDays(lundi, i)
                const isToday = toISO(date) === toISO(new Date())
                return (
                  <div key={jour} className={`px-2 py-3 text-center border-r border-white/10 last:border-r-0 ${isToday ? 'bg-[#C88500]/40' : ''}`}>
                    <p className="text-[10px] font-semibold text-amber-200/70 uppercase tracking-widest">{jour.slice(0,3)}</p>
                    <p className={`text-sm font-bold mt-1 ${isToday ? 'text-[#FFD700]' : 'text-white'}`}>{date.getDate()}</p>
                    {isToday && <div className="mx-auto mt-1 h-0.5 w-5 rounded-full bg-[#FFD700]" />}
                  </div>
                )
              })}
            </div>

            {/* Lignes horaires */}
            {HEURES.map((heure) => (
              <div key={heure} className="grid grid-cols-[56px_repeat(6,1fr)] border-b border-[#E8D8C4]/60 min-h-[72px]">
                <div className="border-r border-[#E8D8C4]/60 px-2 py-2 flex items-start justify-end pt-2">
                  <span className="text-[10px] text-[#C88500] font-bold">{heure}h</span>
                </div>
                {JOURS.map((_, jourIdx) => {
                  const dateJour = toISO(addDays(lundi, jourIdx))
                  const isToday = dateJour === toISO(new Date())
                  const seancesDuSlot = (seancesParJour[jourIdx] ?? []).filter(s => {
                    const h = parseInt(s.heureDebut.slice(0, 2))
                    return h === heure
                  })
                  const styles = STATUT_STYLES
                  return (
                    <div key={jourIdx}
                      className="relative border-r border-[#E8D8C4]/60 last:border-r-0 p-1"
                      style={isToday ? { backgroundColor: 'rgba(200,133,0,0.06)' } : {}}
                    >
                      {seancesDuSlot.map(s => (
                        <button key={s.id}
                          onClick={e => { e.stopPropagation(); setSeanceSelectionnee(s); setActionMode(null) }}
                          className={`w-full text-left rounded-lg border-l-[3px] px-2 py-1.5 mb-1 text-[11px] hover:brightness-95 transition-all shadow-sm ${(styles[s.statut] ?? styles.ANNULEE).card}`}
                        >
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${(styles[s.statut] ?? styles.ANNULEE).dot}`} />
                            <span className="font-semibold truncate flex-1">{s.module}</span>
                          </div>
                          <div className="text-[10px] opacity-80 truncate">{s.heureDebut.slice(0,5)}–{s.heureFin.slice(0,5)}</div>
                          <div className="text-[10px] opacity-60 truncate mt-0.5">{s.classe}</div>
                          {s.statut === 'PROGRAMMEE' && (
                            <div className="text-[10px] font-bold text-[#C88500] mt-0.5">→ À valider</div>
                          )}
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Panel détail + actions */}
      {seanceSelectionnee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ background: 'linear-gradient(135deg, #1C0800 0%, #7A4010 100%)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#C88500]/20 flex items-center justify-center text-base">📋</div>
                <div>
                  <h3 className="font-bold text-white text-sm leading-tight">{seanceSelectionnee.module}</h3>
                  <p className="text-xs text-amber-200/80">{seanceSelectionnee.classe}</p>
                </div>
              </div>
              <button onClick={() => { setSeanceSelectionnee(null); setActionMode(null) }}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center text-sm transition-colors">×</button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <Row label="Vacataire" value={seanceSelectionnee.nomVacataire} />
              <Row label="Classe(s)" value={seanceSelectionnee.classe} />
              <Row label="Date" value={new Date(seanceSelectionnee.dateSeance + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })} />
              <Row label="Horaire" value={`${seanceSelectionnee.heureDebut.slice(0,5)} → ${seanceSelectionnee.heureFin.slice(0,5)} (${seanceSelectionnee.duree.toFixed(1)}h)`} />
              {seanceSelectionnee.salle && <Row label="Salle" value={seanceSelectionnee.salle} />}
              {seanceSelectionnee.typeSeance && <Row label="Type" value={seanceSelectionnee.typeSeance} />}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-[#C88500] uppercase tracking-wider w-20 flex-shrink-0">Statut</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold flex items-center gap-1.5 ${(STATUT_STYLES[seanceSelectionnee.statut] ?? STATUT_STYLES.ANNULEE).badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${(STATUT_STYLES[seanceSelectionnee.statut] ?? STATUT_STYLES.ANNULEE).dot}`} />
                  {seanceSelectionnee.statut === 'PROGRAMMEE' ? 'Programmée' :
                   seanceSelectionnee.statut === 'REALISEE' ? 'Réalisée ✓' : 'Annulée'}
                </span>
              </div>
              {seanceSelectionnee.nomValidePar && <Row label="Validé par" value={seanceSelectionnee.nomValidePar} />}
              {seanceSelectionnee.noteInterne && <Row label="Note" value={seanceSelectionnee.noteInterne} />}
            </div>

            {seanceSelectionnee.statut === 'PROGRAMMEE' && (
              <div className="border-t border-gray-100 px-5 py-4 space-y-3">
                {actionMode === null && (
                  <div className="flex gap-2">
                    <button onClick={() => setActionMode('valider')}
                      className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700">
                      ✓ Séance réalisée
                    </button>
                    <button onClick={() => setActionMode('annuler')}
                      className="flex-1 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100">
                      Annuler
                    </button>
                  </div>
                )}

                {actionMode === 'valider' && (
                  <div className="space-y-2">
                    <textarea value={noteValidation} onChange={e => setNoteValidation(e.target.value)}
                      placeholder="Note interne (optionnel)…" rows={2}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-green-400 resize-none" />
                    <div className="flex gap-2">
                      <button onClick={() => setActionMode(null)} className="flex-1 rounded-xl border border-gray-200 py-2 text-sm text-gray-600">Retour</button>
                      <button onClick={() => valider(seanceSelectionnee.id)} disabled={validating}
                        className="flex-1 rounded-xl bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                        {validating ? 'En cours…' : 'Confirmer réalisée'}
                      </button>
                    </div>
                  </div>
                )}

                {actionMode === 'annuler' && (
                  <div className="space-y-2">
                    <textarea value={motifAnnulation} onChange={e => setMotifAnnulation(e.target.value)}
                      placeholder="Motif d'annulation…" rows={2}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-red-400 resize-none" />
                    <div className="flex gap-2">
                      <button onClick={() => setActionMode(null)} className="flex-1 rounded-xl border border-gray-200 py-2 text-sm text-gray-600">Retour</button>
                      <button onClick={() => annuler(seanceSelectionnee.id)} disabled={annulant}
                        className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                        {annulant ? 'En cours…' : 'Confirmer annulation'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[10px] font-bold text-[#C88500] uppercase tracking-wider w-20 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{value}</span>
    </div>
  )
}
