'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { seanceService, type SeanceProgrammeeResponse, type TypeSeance, type ModuleActifParClasse } from '@/services/seance.service'
import { disponibiliteService, type DisponibiliteResponse } from '@/services/disponibilite.service'
import { api } from '@/services/api'

/* ── Constantes calendrier ── */
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

const TYPE_LABELS: Record<string, string> = {
  CM: 'CM', TD: 'TD', TP: 'TP', CONFERENCE: 'Conf.',
}

/* ── Helpers ── */
function lundiDe(ref: Date): Date {
  const d = new Date(ref)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function formatSemaine(lundi: Date): string {
  const dim = addDays(lundi, 6)
  return `${lundi.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} → ${dim.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}`
}

function heureToMin(h: string): number {
  const [hh, mm] = h.split(':').map(Number)
  return hh * 60 + mm
}

/* ── Page calendrier ── */
export default function CalendrierPage() {
  const queryClient = useQueryClient()
  const [lundi, setLundi] = useState<Date>(() => lundiDe(new Date()))
  const [classeNom, setClasseNom] = useState('')
  const [seanceSelectionnee, setSeanceSelectionnee] = useState<SeanceProgrammeeResponse | null>(null)
  const [showPlanifier, setShowPlanifier] = useState<{ date: string; heure: string } | null>(null)
  const [noteValidation, setNoteValidation] = useState('')
  const [motifAnnulation, setMotifAnnulation] = useState('')
  const [actionMode, setActionMode] = useState<'valider' | 'annuler' | null>(null)

  const reference = toISO(lundi)

  const { data: seances = [], isLoading } = useQuery({
    queryKey: ['seances-semaine', reference, classeNom],
    queryFn: () => seanceService.semaine(reference, classeNom || undefined),
  })

  const { data: maquette = [] } = useQuery({
    queryKey: ['maquette'],
    queryFn: () => api.get<{ classeNom: string }[]>('/maquette').then(r => r.data),
  })

  const classes = useMemo(() =>
    [...new Set(maquette.map(m => m.classeNom))].sort(),
    [maquette]
  )

  const { mutate: valider, isPending: validating } = useMutation({
    mutationFn: (id: number) => seanceService.valider(id, noteValidation || undefined),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['seances-semaine'] })
      setSeanceSelectionnee(updated)
      setActionMode(null)
      setNoteValidation('')
    },
  })

  const { mutate: annuler, isPending: annulant } = useMutation({
    mutationFn: (id: number) => seanceService.annuler(id, motifAnnulation || undefined),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['seances-semaine'] })
      setSeanceSelectionnee(updated)
      setActionMode(null)
      setMotifAnnulation('')
    },
  })

  // Index séances par jour (0=lundi, 5=samedi)
  const seancesParJour = useMemo(() => {
    const map: Record<number, SeanceProgrammeeResponse[]> = {}
    for (let i = 0; i < 6; i++) map[i] = []
    for (const s of seances) {
      const date = new Date(s.dateSeance + 'T00:00:00')
      const day = date.getDay()
      const idx = day === 0 ? 6 : day - 1 // lundi=0, dimanche=6
      if (idx < 6) map[idx].push(s)
    }
    return map
  }, [seances])

  const stats = useMemo(() => ({
    total: seances.length,
    programmees: seances.filter(s => s.statut === 'PROGRAMMEE').length,
    realisees: seances.filter(s => s.statut === 'REALISEE').length,
  }), [seances])

  const statsSemaine = useMemo(() => ({
    annulees: seances.filter(s => s.statut === 'ANNULEE').length,
    tauxRealisation: stats.total > 0 ? Math.round((stats.realisees / stats.total) * 100) : 0,
  }), [seances, stats])

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl text-gray-900">Emploi du temps</h2>
          <p className="mt-0.5 text-sm text-gray-500">📅 {formatSemaine(lundi)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-start shrink-0">
          <select
            value={classeNom}
            onChange={e => setClasseNom(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#C88500]"
          >
            <option value="">Toutes les classes</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex items-center rounded-xl border border-gray-200 bg-white overflow-hidden">
            <button onClick={() => setLundi(addDays(lundi, -7))} className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors">←</button>
            <button onClick={() => setLundi(lundiDe(new Date()))} className="px-3 py-2 text-xs font-semibold text-[#7A4010] hover:bg-orange-50 border-x border-gray-200 transition-colors">Aujourd'hui</button>
            <button onClick={() => setLundi(addDays(lundi, 7))} className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors">→</button>
          </div>
          <button
            onClick={() => setShowPlanifier({ date: toISO(new Date()), heure: '08:00' })}
            className="rounded-xl px-4 py-2 text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
            style={{ background: '#C88500' }}
          >
            + Planifier
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total séances', value: stats.total, icon: '📋', bg: 'bg-[#FDF6ED]', val: 'text-[#7A4010]', sub: 'cette semaine' },
          { label: 'Programmées', value: stats.programmees, icon: '🗓', bg: 'bg-amber-50', val: 'text-amber-700', sub: 'à venir' },
          { label: 'Réalisées', value: stats.realisees, icon: '✅', bg: 'bg-emerald-50', val: 'text-emerald-700', sub: `taux ${statsSemaine.tauxRealisation}%` },
          { label: 'Annulées', value: statsSemaine.annulees, icon: '❌', bg: 'bg-gray-50', val: 'text-gray-500', sub: 'cette semaine' },
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

      {/* Grille calendrier */}
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
                  <div
                    key={jour}
                    className={`px-2 py-3 text-center border-r border-white/10 last:border-r-0 ${isToday ? 'bg-[#C88500]/40' : ''}`}
                  >
                    <p className="text-[10px] font-semibold text-amber-200/70 uppercase tracking-widest">{jour.slice(0,3)}</p>
                    <p className={`text-sm font-bold mt-1 ${isToday ? 'text-[#FFD700]' : 'text-white'}`}>
                      {date.getDate()}
                    </p>
                    {isToday && <div className="mx-auto mt-1 h-0.5 w-5 rounded-full bg-[#FFD700]" />}
                  </div>
                )
              })}
            </div>

            {/* Lignes horaires */}
            {HEURES.map((heure) => (
              <div key={heure} className="grid grid-cols-[56px_repeat(6,1fr)] border-b border-[#E8D8C4]/60 min-h-[72px]">
                {/* Label heure */}
                <div className="border-r border-[#E8D8C4]/60 px-2 py-2 flex items-start justify-end pt-2">
                  <span className="text-[10px] text-[#C88500] font-bold">{heure}h</span>
                </div>
                {/* Cellules jours */}
                {JOURS.map((_, jourIdx) => {
                  const dateJour = toISO(addDays(lundi, jourIdx))
                  const isToday = dateJour === toISO(new Date())
                  const seancesDuSlot = (seancesParJour[jourIdx] ?? []).filter(s => {
                    const h = heureToMin(s.heureDebut.slice(0, 5))
                    return h >= heure * 60 && h < (heure + 1) * 60
                  })

                  return (
                    <div
                      key={jourIdx}
                      className={`relative border-r border-[#E8D8C4]/60 last:border-r-0 p-1 ${isToday ? 'bg-[#C88500]/8' : ''}`}
                      style={isToday ? { backgroundColor: 'rgba(200,133,0,0.06)' } : {}}
                    >
                      {seancesDuSlot.map(s => (
                        <SeanceCard
                          key={s.id}
                          seance={s}
                          onClick={() => { setSeanceSelectionnee(s); setActionMode(null) }}
                        />
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Panel détail séance */}
      {seanceSelectionnee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ background: 'linear-gradient(135deg, #1C0800 0%, #7A4010 100%)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#C88500]/20 flex items-center justify-center text-base">
                  {seanceSelectionnee.typeSeance === 'CM' ? '📖' : seanceSelectionnee.typeSeance === 'TD' ? '✏️' : seanceSelectionnee.typeSeance === 'TP' ? '🔬' : '📋'}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm leading-tight">{seanceSelectionnee.module}</h3>
                  <p className="text-xs text-amber-200/80">{seanceSelectionnee.classe}</p>
                </div>
              </div>
              <button onClick={() => { setSeanceSelectionnee(null); setActionMode(null) }}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center text-sm transition-colors">×</button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <InfoRow label="Vacataire" value={seanceSelectionnee.nomVacataire} />
              <InfoRow label="Classe(s)" value={seanceSelectionnee.classe} />
              <InfoRow label="Date" value={new Date(seanceSelectionnee.dateSeance + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })} />
              <InfoRow label="Horaire" value={`${seanceSelectionnee.heureDebut.slice(0,5)} → ${seanceSelectionnee.heureFin.slice(0,5)} (${seanceSelectionnee.duree.toFixed(1)}h)`} />
              {seanceSelectionnee.salle && <InfoRow label="Salle" value={seanceSelectionnee.salle} />}
              {seanceSelectionnee.typeSeance && <InfoRow label="Type" value={seanceSelectionnee.typeSeance} />}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-[#C88500] uppercase tracking-wider w-20 flex-shrink-0">Statut</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold flex items-center gap-1.5 ${(STATUT_STYLES[seanceSelectionnee.statut] ?? STATUT_STYLES.ANNULEE).badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${(STATUT_STYLES[seanceSelectionnee.statut] ?? STATUT_STYLES.ANNULEE).dot}`} />
                  {seanceSelectionnee.statut === 'PROGRAMMEE' ? 'Programmée' :
                   seanceSelectionnee.statut === 'REALISEE' ? 'Réalisée' : 'Annulée'}
                </span>
              </div>
              {seanceSelectionnee.nomValidePar && (
                <InfoRow label="Validé par" value={seanceSelectionnee.nomValidePar} />
              )}
              {seanceSelectionnee.noteInterne && (
                <InfoRow label="Note" value={seanceSelectionnee.noteInterne} />
              )}
            </div>

            {/* Actions — seulement si PROGRAMMEE */}
            {seanceSelectionnee.statut === 'PROGRAMMEE' && (
              <div className="border-t border-gray-100 px-5 py-4 space-y-3">
                {actionMode === null && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActionMode('valider')}
                      className="flex-1 rounded-xl bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700"
                    >
                      ✓ Valider (réalisée)
                    </button>
                    <button
                      onClick={() => setActionMode('annuler')}
                      className="flex-1 rounded-xl border border-red-200 bg-red-50 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                    >
                      Annuler la séance
                    </button>
                  </div>
                )}

                {actionMode === 'valider' && (
                  <div className="space-y-2">
                    <textarea
                      value={noteValidation}
                      onChange={e => setNoteValidation(e.target.value)}
                      placeholder="Note interne (optionnel)…"
                      rows={2}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-400 resize-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setActionMode(null)} className="flex-1 rounded-xl border border-gray-200 py-2 text-sm text-gray-600">
                        Retour
                      </button>
                      <button
                        onClick={() => valider(seanceSelectionnee.id)}
                        disabled={validating}
                        className="flex-1 rounded-xl bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {validating ? 'Validation…' : 'Confirmer'}
                      </button>
                    </div>
                  </div>
                )}

                {actionMode === 'annuler' && (
                  <div className="space-y-2">
                    <textarea
                      value={motifAnnulation}
                      onChange={e => setMotifAnnulation(e.target.value)}
                      placeholder="Motif d'annulation (optionnel)…"
                      rows={2}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-red-400 resize-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setActionMode(null)} className="flex-1 rounded-xl border border-gray-200 py-2 text-sm text-gray-600">
                        Retour
                      </button>
                      <button
                        onClick={() => annuler(seanceSelectionnee.id)}
                        disabled={annulant}
                        className="flex-1 rounded-xl border border-red-300 bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {annulant ? 'Annulation…' : 'Confirmer annulation'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modale planifier séance */}
      {showPlanifier && (
        <PlanifierModal
          dateInitiale={showPlanifier.date}
          heureInitiale={showPlanifier.heure}
          classePreselect={classeNom}
          onClose={() => setShowPlanifier(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['seances-semaine'] })
            setShowPlanifier(null)
          }}
        />
      )}
    </div>
  )
}

/* ── Carte séance dans la grille ── */
function SeanceCard({ seance, onClick }: { seance: SeanceProgrammeeResponse; onClick: () => void }) {
  const styles = STATUT_STYLES[seance.statut] ?? STATUT_STYLES.ANNULEE
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border-l-[3px] px-2 py-1.5 mb-1 text-[11px] hover:brightness-95 transition-all shadow-sm ${styles.card}`}
    >
      <div className="flex items-center gap-1 mb-0.5">
        <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${styles.dot}`} />
        <span className="font-semibold truncate flex-1">{seance.module}</span>
      </div>
      <div className="text-[10px] opacity-80 truncate">
        {seance.heureDebut.slice(0,5)}–{seance.heureFin.slice(0,5)}
        {seance.typeSeance ? (
          <span className="ml-1 font-bold">{TYPE_LABELS[seance.typeSeance] ?? seance.typeSeance}</span>
        ) : null}
      </div>
      <div className="text-[10px] opacity-60 truncate mt-0.5">{seance.nomVacataire}</div>
    </button>
  )
}

/* ── Info row dans le panel ── */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[10px] font-bold text-[#C88500] uppercase tracking-wider w-20 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{value}</span>
    </div>
  )
}

/* ── Modale planifier séance ── */
function PlanifierModal({ dateInitiale, heureInitiale, classePreselect, onClose, onSuccess }: {
  dateInitiale: string
  heureInitiale: string
  classePreselect: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [classeNom, setClasseNom] = useState(classePreselect)
  const [moduleChoisi, setModuleChoisi] = useState<ModuleActifParClasse | null>(null)
  const [classesSupp, setClassesSupp] = useState<string[]>([]) // classes tronc commun
  const [troncCommun, setTroncCommun] = useState(false)
  const [dateSeance, setDateSeance] = useState(dateInitiale)
  const [heureDebut, setHeureDebut] = useState(heureInitiale)
  const [heureFin, setHeureFin] = useState('')
  const [typeSeance, setTypeSeance] = useState<TypeSeance | ''>('')
  const [modeEnseignement, setModeEnseignement] = useState<'PRESENTIEL' | 'EN_LIGNE'>('PRESENTIEL')
  const [salle, setSalle] = useState('')
  const [justification, setJustification] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Toutes les classes depuis la maquette
  const { data: maquette = [] } = useQuery({
    queryKey: ['maquette'],
    queryFn: () => api.get<{ classeNom: string }[]>('/maquette').then(r => r.data),
  })
  const classes = useMemo(() => [...new Set(maquette.map(m => m.classeNom))].sort(), [maquette])
  const autresClasses = classes.filter(c => c !== classeNom)

  // Modules actifs EN_COURS pour la classe sélectionnée
  const { data: modulesActifs = [], isLoading: loadingModules } = useQuery({
    queryKey: ['modules-actifs', classeNom],
    queryFn: () => seanceService.modulesActifsParClasse(classeNom),
    enabled: !!classeNom,
  })

  // Disponibilités du vacataire du module choisi pour la date sélectionnée
  const { data: dispos = [] } = useQuery<DisponibiliteResponse[]>({
    queryKey: ['dispos-vacataire', moduleChoisi?.vacataireId, dateSeance],
    queryFn: () => disponibiliteService.parVacataire(moduleChoisi!.vacataireId),
    enabled: !!moduleChoisi && !!dateSeance,
    select: (data) => data.filter(d => d.date === dateSeance),
  })

  // Vérifier si le créneau choisi est dans une dispo
  const creneauDispo = useMemo(() => {
    if (!heureDebut || dispos.length === 0) return null
    const debutMin = heureToMin(heureDebut)
    return dispos.find(d => {
      const dMin = heureToMin(d.heureDebut)
      const fMin = heureToMin(d.heureFin)
      return debutMin >= dMin && debutMin < fMin
    }) ?? null
  }, [heureDebut, dispos])

  const vhRestant = moduleChoisi
    ? moduleChoisi.volumeHorairePrevisionnel - moduleChoisi.heuresEffectuees
    : null

  const duree = useMemo(() => {
    if (!heureDebut || !heureFin) return 0
    const min = heureToMin(heureFin) - heureToMin(heureDebut)
    return min > 0 ? min / 60 : 0
  }, [heureDebut, heureFin])

  const depasse = vhRestant !== null && duree > 0 && duree > vhRestant

  const toggleClasseSupp = (c: string) =>
    setClassesSupp(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])

  const { mutate: creer, isPending } = useMutation({
    mutationFn: () => {
      if (!moduleChoisi) throw new Error('Choisissez un module.')
      if (depasse && !justification.trim()) throw new Error('Justification obligatoire car le VH est dépassé.')
      const toutesClasses = troncCommun && classesSupp.length > 0
        ? [classeNom, ...classesSupp]
        : [classeNom]
      return seanceService.creer({
        contratId: moduleChoisi.contratId,
        contratModuleId: moduleChoisi.contratModuleId,
        dateSeance,
        heureDebut,
        heureFin,
        typeSeance: typeSeance || undefined,
        salle: modeEnseignement === 'PRESENTIEL' ? (salle || undefined) : undefined,
        justificationEcart: justification || undefined,
      })
    },
    onSuccess,
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })
        ?.response?.data?.message
        ?? (err as { message?: string })?.message
        ?? 'Erreur lors de la planification.'
      setError(msg)
    },
  })

  const canSubmit = !!moduleChoisi && !!classeNom && !!dateSeance && !!heureDebut && !!heureFin

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 flex-shrink-0">
          <h3 className="font-bold text-gray-900">Planifier une séance</h3>
          <button onClick={onClose} className="text-xl text-gray-400 hover:text-gray-700 font-bold">×</button>
        </div>

        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">

          {/* ── Étape 1 : Classe principale ── */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
              Classe principale <span className="text-red-500">*</span>
            </label>
            <select
              value={classeNom}
              onChange={e => { setClasseNom(e.target.value); setModuleChoisi(null); setClassesSupp([]) }}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
            >
              <option value="">— Sélectionner une classe —</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* ── Tronc commun ── */}
          {classeNom && (
            <div className="rounded-xl border border-gray-200 p-3 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={troncCommun}
                  onChange={e => { setTroncCommun(e.target.checked); if (!e.target.checked) setClassesSupp([]) }}
                  className="h-3.5 w-3.5 accent-amber-500" />
                <span className="text-xs font-semibold text-gray-700">Tronc commun — plusieurs classes ensemble</span>
              </label>
              {troncCommun && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Cochez les autres classes qui suivent ce cours simultanément :</p>
                  <div className="flex flex-wrap gap-1.5">
                    {autresClasses.map(c => (
                      <button key={c} type="button"
                        onClick={() => toggleClasseSupp(c)}
                        className={`rounded-lg px-2.5 py-1 text-xs transition-colors border ${
                          classesSupp.includes(c)
                            ? 'border-amber-400 bg-amber-50 text-amber-800'
                            : 'border-gray-200 text-gray-600 hover:border-amber-200'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  {classesSupp.length > 0 && (
                    <p className="mt-1.5 text-xs text-amber-700 font-medium">
                      ✓ {[classeNom, ...classesSupp].join(' + ')}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Étape 2 : Module ── */}
          {classeNom && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Module <span className="text-red-500">*</span>
              </label>
              {loadingModules ? (
                <p className="text-xs text-gray-400">Chargement…</p>
              ) : modulesActifs.length === 0 ? (
                <div className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5 text-xs text-orange-700">
                  Aucun module EN COURS pour cette classe. Démarrez d'abord un module depuis le contrat du vacataire.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {modulesActifs.map(m => {
                    const restant = m.volumeHorairePrevisionnel - m.heuresEffectuees
                    const pct = m.volumeHorairePrevisionnel > 0
                      ? Math.min(100, Math.round((m.heuresEffectuees / m.volumeHorairePrevisionnel) * 100))
                      : 0
                    const selected = moduleChoisi?.contratModuleId === m.contratModuleId
                    return (
                      <button key={m.contratModuleId} type="button"
                        onClick={() => setModuleChoisi(m)}
                        className={`w-full text-left rounded-xl border px-3 py-2.5 transition-colors ${
                          selected ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-white hover:border-amber-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">{m.nomModule}</span>
                          <span className="text-xs text-gray-400">{m.heuresEffectuees}h / {m.volumeHorairePrevisionnel}h</span>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500">
                          Prof : <strong>{m.vacataireNom}</strong>
                          {restant > 0
                            ? <span className="ml-2 text-green-700">· {restant}h restantes</span>
                            : <span className="ml-2 text-orange-600">· VH atteint</span>}
                        </p>
                        <div className="mt-1.5 h-1 w-full rounded-full bg-gray-100">
                          <div className={`h-1 rounded-full ${pct >= 100 ? 'bg-orange-400' : 'bg-amber-400'}`}
                            style={{ width: `${pct}%` }} />
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Étape 3 : Date + disponibilités vacataire ── */}
          {moduleChoisi && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Date <span className="text-red-500">*</span>
                </label>
                <input type="date" value={dateSeance} onChange={e => setDateSeance(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none" />
              </div>

              {/* Créneaux disponibles du vacataire pour cette date */}
              {dateSeance && (
                <div className="rounded-xl border p-3 space-y-1.5"
                  style={{ borderColor: dispos.length > 0 ? '#86efac' : '#fca5a5', background: dispos.length > 0 ? '#f0fdf4' : '#fef2f2' }}>
                  <p className="text-xs font-semibold" style={{ color: dispos.length > 0 ? '#15803d' : '#b91c1c' }}>
                    {dispos.length > 0
                      ? `✓ ${moduleChoisi.vacataireNom} est disponible ce jour :`
                      : `⚠ Aucune disponibilité déclarée par ${moduleChoisi.vacataireNom} ce jour`}
                  </p>
                  {dispos.map(d => (
                    <button key={d.id} type="button"
                      onClick={() => { setHeureDebut(d.heureDebut.slice(0,5)); setHeureFin(d.heureFin.slice(0,5)) }}
                      className="flex items-center gap-2 rounded-lg border border-green-200 bg-white px-2.5 py-1 text-xs text-green-800 hover:bg-green-50 transition-colors"
                    >
                      <span className="font-semibold">{d.heureDebut.slice(0,5)} – {d.heureFin.slice(0,5)}</span>
                      <span className="text-green-500">← Cliquer pour pré-remplir</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Heures */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">Début <span className="text-red-500">*</span></label>
                  <input type="time" value={heureDebut} onChange={e => setHeureDebut(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none ${
                      heureDebut && dispos.length > 0
                        ? creneauDispo ? 'border-green-400 bg-green-50' : 'border-orange-300 bg-orange-50'
                        : 'border-gray-200 focus:border-amber-400'
                    }`} />
                  {heureDebut && dispos.length > 0 && (
                    <p className={`mt-0.5 text-[10px] font-medium ${creneauDispo ? 'text-green-700' : 'text-orange-600'}`}>
                      {creneauDispo ? '✓ Dans une disponibilité' : '⚠ Hors disponibilité déclarée'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">Fin <span className="text-red-500">*</span></label>
                  <input type="time" value={heureFin} onChange={e => setHeureFin(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none" />
                </div>
              </div>

              {duree > 0 && (
                <p className="text-xs text-gray-500">
                  Durée : <strong>{duree.toFixed(1)}h</strong>
                  {depasse && <span className="ml-2 text-orange-600 font-semibold">⚠ Dépasse le VH restant ({vhRestant?.toFixed(1)}h)</span>}
                </p>
              )}

              {/* ── Mode + Type + Salle ── */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">Mode</label>
                  <div className="flex gap-2">
                    {(['PRESENTIEL', 'EN_LIGNE'] as const).map(m => (
                      <button key={m} type="button"
                        onClick={() => setModeEnseignement(m)}
                        className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-colors ${
                          modeEnseignement === m
                            ? m === 'PRESENTIEL' ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-blue-400 bg-blue-50 text-blue-800'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {m === 'PRESENTIEL' ? '🏫 Présentiel' : '💻 En ligne'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">Type</label>
                  <select value={typeSeance} onChange={e => setTypeSeance(e.target.value as TypeSeance | '')}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none">
                    <option value="">Non précisé</option>
                    <option value="CM">CM</option>
                    <option value="TD">TD</option>
                    <option value="TP">TP</option>
                    <option value="CONFERENCE">Conférence</option>
                  </select>
                </div>
              </div>

              {modeEnseignement === 'PRESENTIEL' && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">Salle</label>
                  <input type="text" value={salle} onChange={e => setSalle(e.target.value)}
                    placeholder="Ex : Amphi B, Salle 203…"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none" />
                </div>
              )}

              {modeEnseignement === 'EN_LIGNE' && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs text-blue-700">
                  Le lien de connexion sera communiqué directement par le vacataire aux étudiants.
                </div>
              )}

              {/* Justification dépassement VH */}
              {depasse && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-orange-700">
                    Justification écart <span className="text-red-500">*</span>
                  </label>
                  <textarea value={justification} onChange={e => setJustification(e.target.value)}
                    placeholder="Expliquez pourquoi le volume horaire est dépassé…"
                    rows={2}
                    className="w-full rounded-xl border border-orange-300 px-3 py-2 text-sm focus:outline-none resize-none" />
                </div>
              )}
            </>
          )}
        </div>

        {error && (
          <div className="mx-6 mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 flex-shrink-0">
          <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100">
            Annuler
          </button>
          <button onClick={() => { setError(null); creer() }} disabled={!canSubmit || isPending}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: '#C88500' }}
          >
            {isPending ? 'Planification…' : 'Planifier la séance'}
          </button>
        </div>
      </div>
    </div>
  )
}
