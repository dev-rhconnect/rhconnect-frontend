'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { releveService, type FeuilleHeureResponse, type StatutReleve } from '@/services/releve.service'
import { vacataireService } from '@/services/vacataire.service'
import { api } from '@/services/api'

/* ── Statuts ── */
const STATUT_RELEVE: Record<StatutReleve, { label: string; bg: string; text: string }> = {
  EN_COURS:       { label: 'En cours',          bg: 'bg-gray-100',   text: 'text-gray-700' },
  SOUMIS:         { label: 'Soumis',            bg: 'bg-blue-50',    text: 'text-blue-700' },
  SOUMIS_RP:      { label: 'Soumis au RP',      bg: 'bg-blue-50',    text: 'text-blue-700' },
  VALIDE_RP:      { label: 'Validé par le RP',  bg: 'bg-indigo-50',  text: 'text-indigo-700' },
  SOUMIS_FINANCE: { label: 'Transmis Finance',  bg: 'bg-amber-50',   text: 'text-amber-700' },
  VALIDE:         { label: 'Validé ✓',          bg: 'bg-green-50',   text: 'text-green-700' },
  REJETE:         { label: 'Rejeté',            bg: 'bg-red-50',     text: 'text-red-600' },
}

function periodeLabel(p: string) {
  const [y, m] = p.split('-')
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

function BadgeReleve({ statut }: { statut: StatutReleve }) {
  const s = STATUT_RELEVE[statut] ?? STATUT_RELEVE.EN_COURS
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}

/* ── Composant section "Relevés soumis au RP" ── */
function RelevesSoumisSection() {
  const queryClient = useQueryClient()
  const [actionId, setActionId] = useState<number | null>(null)
  const [actionType, setActionType] = useState<'valider' | 'soumettre' | null>(null)
  const [motifRejet, setMotifRejet] = useState('')
  const [ouvertId, setOuvertId] = useState<number | null>(null)

  const { data: soumis = [], isLoading } = useQuery({
    queryKey: ['releves-soumis-rp'],
    queryFn: releveService.soumisRP,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['releves-soumis-rp'] })

  const { mutate: validerRP, isPending: validating } = useMutation({
    mutationFn: (id: number) => releveService.validerParRP(id),
    onSuccess: () => { invalidate(); setActionId(null); setActionType(null) },
  })
  const { mutate: soumettreFinance, isPending: transmitting } = useMutation({
    mutationFn: (id: number) => releveService.soumettreAFinance(id),
    onSuccess: () => { invalidate(); setActionId(null); setActionType(null) },
  })
  const { mutate: rejeter, isPending: rejecting } = useMutation({
    mutationFn: ({ id, motif }: { id: number; motif: string }) => releveService.rejeter(id, motif),
    onSuccess: () => { invalidate(); setActionId(null); setActionType(null); setMotifRejet('') },
  })

  const enAttente = soumis.filter(r => r.statut === 'SOUMIS_RP' || r.statut === 'SOUMIS' || r.statut === 'VALIDE_RP')
  const suivi     = soumis.filter(r => r.statut === 'SOUMIS_FINANCE' || r.statut === 'VALIDE' || r.statut === 'REJETE')

  if (isLoading) return null
  if (soumis.length === 0) return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-4">
      <p className="text-sm font-semibold text-gray-700 mb-1">📋 Suivi des relevés</p>
      <p className="text-xs text-gray-400">Aucun relevé soumis.</p>
    </div>
  )

  return (
    <div className="space-y-3">
    {/* Section action */}
    {enAttente.length > 0 && (
    <div className="rounded-2xl bg-white border border-blue-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-blue-100 bg-blue-50/40">
        <div>
          <p className="text-sm font-bold text-blue-900">📋 Relevés en attente d'action</p>
          <p className="text-xs text-blue-600 mt-0.5">{enAttente.length} relevé{enAttente.length !== 1 ? 's' : ''} à traiter</p>
        </div>
      </div>
      <div className="divide-y divide-gray-50">
        {enAttente.map(r => {
          const isOpen = ouvertId === r.id
          return (
            <div key={r.id}>
              <div className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{r.module ?? '—'}</span>
                    <BadgeReleve statut={r.statut} />
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-gray-500">{r.nomVacataire}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-500">{periodeLabel(r.periode)}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-500">Soumis par l'attaché</span>
                    {r.classes && r.classes.length > 0 ? (
                      <div className="flex gap-1">
                        {r.classes.map(c => (
                          <span key={c} className="inline-flex rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">{c}</span>
                        ))}
                      </div>
                    ) : r.classe ? (
                      <span className="inline-flex rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">{r.classe}</span>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-5 flex-shrink-0 text-center">
                  <div>
                    <p className="text-base font-bold text-gray-900">{r.nombreSeances}</p>
                    <p className="text-[10px] text-gray-400">séance{r.nombreSeances !== 1 ? 's' : ''}</p>
                  </div>
                  <div>
                    <p className="text-base font-bold" style={{ color: '#C88500' }}>{r.totalHeuresValidees.toFixed(1)}h</p>
                    <p className="text-[10px] text-gray-400">effectuées</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => setOuvertId(isOpen ? null : r.id)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
                    {isOpen ? 'Masquer' : 'Voir'}
                  </button>
                  <button onClick={() => releveService.telechargerPdf(r.id)}
                    title="Télécharger fiche PDF"
                    className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-gray-500 hover:bg-gray-100 transition-colors">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </button>
                  {(r.statut === 'SOUMIS_RP' || r.statut === 'SOUMIS') && (
                    <>
                      <button onClick={() => { setActionId(r.id); setActionType('valider') }}
                        className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors">
                        ✓ Valider
                      </button>
                      <button onClick={() => rejeter({ id: r.id, motif: '' })}
                        className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors">
                        ✕
                      </button>
                    </>
                  )}
                  {r.statut === 'VALIDE_RP' && (
                    <button onClick={() => soumettreFinance(r.id)} disabled={transmitting}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                      style={{ background: '#C88500' }}>
                      {transmitting ? '…' : 'Transmettre au Finance →'}
                    </button>
                  )}
                </div>
              </div>

              {/* Confirmation valider */}
              {actionId === r.id && actionType === 'valider' && (
                <div className="border-t border-green-100 bg-green-50/30 px-6 py-4">
                  <p className="text-sm font-semibold text-gray-900 mb-3">Valider ce relevé ?</p>
                  <p className="text-xs text-gray-500 mb-4">
                    Vous validez le relevé de <strong>{r.nomVacataire}</strong> pour <strong>{periodeLabel(r.periode)}</strong>.
                    Vous pourrez ensuite le transmettre au Relais Finance.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => { setActionId(null); setActionType(null) }}
                      className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">
                      Annuler
                    </button>
                    <button onClick={() => validerRP(r.id)} disabled={validating}
                      className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                      {validating ? 'Validation…' : 'Confirmer la validation'}
                    </button>
                  </div>
                </div>
              )}

              {/* Détail séances */}
              {isOpen && (
                <div className="border-t border-blue-100 bg-blue-50/10">
                  {r.lignes.length === 0 ? (
                    <p className="px-8 py-3 text-xs text-gray-400 italic">Aucune séance.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-blue-100">
                          <th className="px-6 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Date</th>
                          <th className="px-6 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Horaire</th>
                          <th className="px-6 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-gray-400">Durée</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {r.lignes.map(l => (
                          <tr key={l.id} className="hover:bg-white">
                            <td className="px-6 py-2 text-xs text-gray-600">
                              {new Date(l.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })}
                            </td>
                            <td className="px-6 py-2 text-xs text-gray-500">
                              {String(l.heureDebut).slice(0,5)} → {String(l.heureFin).slice(0,5)}
                            </td>
                            <td className="px-6 py-2 text-right">
                              <span className="inline-flex rounded-md px-2 py-0.5 text-xs font-bold" style={{ background: '#FEF3C7', color: '#92400E' }}>
                                {l.duree.toFixed(1)}h
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
    )}

    {/* Section suivi (transmis / validés / rejetés) */}
    {suivi.length > 0 && (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
        <p className="text-sm font-bold text-gray-700">🕓 Suivi — relevés transmis au Finance</p>
        <p className="text-xs text-gray-400 mt-0.5">{suivi.length} relevé{suivi.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="divide-y divide-gray-50">
        {suivi.map(r => (
          <div key={r.id} className="flex items-center gap-4 px-5 py-3.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-800 text-sm">{r.module ?? '—'}</span>
                <BadgeReleve statut={r.statut} />
              </div>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                <span className="text-xs text-gray-500">{r.nomVacataire}</span>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-500">{periodeLabel(r.periode)}</span>
                {r.classe && <span className="inline-flex rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">{r.classe}</span>}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-gray-900">{r.totalHeuresValidees.toFixed(1)}h</p>
              <p className="text-[10px] text-gray-400">{r.nombreSeances} séance{r.nombreSeances !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={() => releveService.telechargerPdf(r.id)}
              title="Télécharger PDF"
              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-gray-400 hover:bg-gray-100 transition-colors flex-shrink-0">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
    )}
    </div>
  )
}

/* ── Helpers ── */
function moisCourant() {
  const now = new Date()
  return {
    debut: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
    fin: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
  }
}
function moisPrec() {
  const d = new Date(); d.setMonth(d.getMonth() - 1)
  return {
    debut: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`,
    fin: new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10),
  }
}
function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  CM:         { bg: '#EFF6FF', color: '#1D4ED8' },
  TD:         { bg: '#F0FDF4', color: '#15803D' },
  TP:         { bg: '#FEF3C7', color: '#92400E' },
  CONFERENCE: { bg: '#F5F3FF', color: '#6D28D9' },
}

function exportCSV(releves: FeuilleHeureResponse[], nom: string) {
  const header = ['Période','Vacataire','Module','Classe','Statut','Séances','Heures validées']
  const rows = releves.map(r => [
    r.periode, r.nomVacataire, r.module ?? '', r.classe ?? '',
    r.statut, String(r.nombreSeances), r.totalHeuresValidees.toFixed(2),
  ])
  const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(';')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url
  a.download = `releves_${nom}_${new Date().toISOString().slice(0, 10)}.csv`
  a.click(); URL.revokeObjectURL(url)
}

/* ── Page ── */
export default function RelevesPage() {
  const { debut: debutDef, fin: finDef } = moisCourant()
  const [vacataireId, setVacataireId] = useState<number | ''>('')
  const [classeNom,   setClasseNom]   = useState('')
  const [debut,       setDebut]       = useState(debutDef)
  const [fin,         setFin]         = useState(finDef)
  const [moduleOuvert, setModuleOuvert] = useState<string | null>(null)

  const { data: vacataires = [] } = useQuery({ queryKey: ['vacataires'], queryFn: vacataireService.listerTous })
  const { data: maquette = [] }   = useQuery({
    queryKey: ['maquette'],
    queryFn: () => api.get<{ classeNom: string; moduleNom: string; volumeHoraire: number }[]>('/maquette').then(r => r.data),
  })

  const classes = useMemo(() => [...new Set(maquette.map(m => m.classeNom))].sort(), [maquette])

  // Période → mois (on prend le mois de la date début)
  const periodeFiltre = useMemo(() => {
    if (!debut) return undefined
    return debut.slice(0, 7) // "2026-06"
  }, [debut])

  const { data: relevesVacataire = [], isLoading } = useQuery({
    queryKey: ['releves-vue', vacataireId, classeNom, periodeFiltre],
    enabled: vacataireId !== '',
    queryFn: () => releveService.lister({
      ...(vacataireId !== '' ? { vacataireId: vacataireId as number } : {}),
      ...(classeNom ? { classeNom } : {}),
      ...(periodeFiltre ? { periode: periodeFiltre } : {}),
    }),
  })

  const totalHeures = relevesVacataire.reduce((s, r) => s + r.totalHeuresValidees, 0)
  const totalSeances = relevesVacataire.reduce((s, r) => s + r.nombreSeances, 0)
  const vacataireSel = vacataires.find(v => v.id === vacataireId)

  const periodes = [
    { label: 'Ce mois',     ...moisCourant() },
    { label: 'Mois préc.',  ...moisPrec()    },
    { label: 'Cette année', debut: `${new Date().getFullYear()}-01-01`, fin: `${new Date().getFullYear()}-12-31` },
  ]

  return (
    <div className="space-y-5">

      {/* ── Relevés soumis par les attachés ── */}
      <RelevesSoumisSection />

      {/* ── Header reporting ── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relevés d'heures — vue détaillée</h2>
          <p className="mt-1 text-sm text-gray-500">
            {vacataireSel
              ? `${vacataireSel.prenom} ${vacataireSel.nom}${classeNom ? ` · ${classeNom}` : ''} — ${relevesVacataire.length} relevé${relevesVacataire.length !== 1 ? 's' : ''}`
              : 'Sélectionnez un vacataire pour voir ses relevés par module'}
          </p>
        </div>
        <button onClick={() => exportCSV(relevesVacataire, [vacataireSel?.nom ?? 'tous', classeNom || 'toutes', debut, fin].join('_'))}
          disabled={relevesVacataire.length === 0}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 shadow-sm">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Exporter CSV
        </button>
      </div>

      {/* ── Filtres ── */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
        <div className="grid grid-cols-4 gap-4">

          {/* Vacataire */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">Vacataire</label>
            <select value={vacataireId}
              onChange={e => { setVacataireId(e.target.value ? Number(e.target.value) : ''); setModuleOuvert(null) }}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-amber-400">
              <option value="">— Choisir —</option>
              {vacataires.map(v => <option key={v.id} value={v.id}>{v.prenom} {v.nom}</option>)}
            </select>
          </div>

          {/* Classe */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">Classe</label>
            <select value={classeNom} onChange={e => { setClasseNom(e.target.value); setModuleOuvert(null) }}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-amber-400">
              <option value="">Toutes les classes</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Du */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">Du</label>
            <input type="date" value={debut} onChange={e => setDebut(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-amber-400" />
          </div>

          {/* Au */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">Au</label>
            <input type="date" value={fin} onChange={e => setFin(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-amber-400" />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-gray-400">Période :</span>
          {periodes.map(p => (
            <button key={p.label} onClick={() => { setDebut(p.debut); setFin(p.fin) }}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all border ${
                debut === p.debut && fin === p.fin
                  ? 'border-amber-400 bg-amber-50 text-amber-800'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── État : pas de vacataire sélectionné ── */}
      {!vacataireId && (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-16 text-center border border-dashed border-gray-200">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: '#FEF3C7' }}>
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="#C88500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-900">Sélectionnez un vacataire</p>
          <p className="mt-1 text-xs text-gray-400">Ses relevés seront affichés module par module.</p>
        </div>
      )}

      {/* ── Vacataire sélectionné : KPIs + modules ── */}
      {vacataireId !== '' && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: '#F0FDF4' }}>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{relevesVacataire.length}</p>
                <p className="text-xs text-gray-400">Relevés trouvés</p>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: '#FEF3C7' }}>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="#C88500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: '#C88500' }}>{totalHeures.toFixed(1)}h</p>
                <p className="text-xs text-gray-400">Total heures validées</p>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: '#EFF6FF' }}>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{totalSeances}</p>
                <p className="text-xs text-gray-400">Séances enregistrées</p>
              </div>
            </div>
          </div>

          {/* ── Liste des relevés ── */}
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
            </div>
          ) : relevesVacataire.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-14 text-center shadow-sm border border-gray-100">
              <p className="text-sm font-semibold text-gray-900">Aucun relevé pour cette période</p>
              <p className="mt-1 text-xs text-gray-400">Essayez une autre période ou une autre classe.</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  {relevesVacataire.length} relevé{relevesVacataire.length !== 1 ? 's' : ''}
                  {classeNom ? ` · ${classeNom}` : ''}
                </p>
                <p className="text-xs text-gray-400">Cliquer sur un relevé pour voir le détail</p>
              </div>

              <div className="divide-y divide-gray-50">
                {relevesVacataire.map(r => {
                  const isOpen = moduleOuvert === String(r.id)
                  return (
                    <div key={r.id}>
                      <button onClick={() => setModuleOuvert(isOpen ? null : String(r.id))}
                        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-amber-50/30 transition-colors group">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-gray-900 truncate">{r.module ?? '—'}</span>
                            <BadgeReleve statut={r.statut} />
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-500">{periodeLabel(r.periode)}</span>
                            {r.classe && (
                              <span className="inline-flex rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">{r.classe}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="text-center">
                            <p className="text-xs text-gray-400">{r.nombreSeances} séance{r.nombreSeances !== 1 ? 's' : ''}</p>
                          </div>
                          <span className="inline-flex rounded-lg px-2.5 py-1.5 text-sm font-bold" style={{ background: '#FEF3C7', color: '#92400E' }}>
                            {r.totalHeuresValidees.toFixed(1)}h
                          </span>
                          <svg className={`h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="border-t border-amber-100 bg-amber-50/10">
                          <div className="px-5 py-2.5 border-b border-amber-100">
                            <p className="text-xs font-semibold text-amber-800">
                              {r.nombreSeances} séance{r.nombreSeances !== 1 ? 's' : ''} · {r.totalHeuresValidees.toFixed(1)}h validées
                            </p>
                          </div>
                          {r.lignes && r.lignes.length > 0 ? (
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-amber-100">
                                  <th className="px-5 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 w-32">Date</th>
                                  <th className="px-5 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Horaire</th>
                                  <th className="px-5 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Observation</th>
                                  <th className="px-5 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-gray-400 w-20">Durée</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {r.lignes.sort((a, b) => a.date.localeCompare(b.date)).map(l => (
                                    <tr key={l.id} className="hover:bg-white transition-colors">
                                      <td className="px-5 py-2.5 text-xs text-gray-600 whitespace-nowrap">{formatDate(l.date)}</td>
                                      <td className="px-5 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                                        {l.heureDebut?.slice(0, 5) ?? '—'} → {l.heureFin?.slice(0, 5) ?? '—'}
                                      </td>
                                      <td className="px-5 py-2.5 text-xs text-gray-500">{l.observation ?? '—'}</td>
                                      <td className="px-5 py-2.5 text-right">
                                        <span className="inline-flex rounded-md px-2 py-0.5 text-xs font-bold" style={{ background: '#FEF3C7', color: '#92400E' }}>
                                          {l.duree.toFixed(1)}h
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          ) : (
                            <p className="px-5 py-4 text-xs text-gray-400">Aucun détail de ligne disponible.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
