'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { releveService, type StatutReleve, type FeuilleHeureResponse } from '@/services/releve.service'
import { vacataireService } from '@/services/vacataire.service'
import { api } from '@/services/api'

/* ── Statuts ── */
const STATUT: Record<StatutReleve, { label: string; bg: string; text: string; dot: string }> = {
  EN_COURS:       { label: 'En cours',          bg: 'bg-gray-100',   text: 'text-gray-700',   dot: 'bg-gray-400' },
  SOUMIS:         { label: 'Soumis (legacy)',    bg: 'bg-blue-50',    text: 'text-blue-700',   dot: 'bg-blue-400' },
  SOUMIS_RP:      { label: 'Soumis au RP',       bg: 'bg-blue-50',    text: 'text-blue-700',   dot: 'bg-blue-500' },
  VALIDE_RP:      { label: 'Validé par le RP',   bg: 'bg-indigo-50',  text: 'text-indigo-700', dot: 'bg-indigo-500' },
  SOUMIS_FINANCE: { label: 'Transmis au Finance',bg: 'bg-amber-50',   text: 'text-amber-700',  dot: 'bg-amber-500' },
  VALIDE:         { label: 'Validé ✓',           bg: 'bg-green-50',   text: 'text-green-700',  dot: 'bg-green-500' },
  REJETE:         { label: 'Rejeté',             bg: 'bg-red-50',     text: 'text-red-600',    dot: 'bg-red-500'  },
}

function periodeLabel(p: string) {
  const [y, m] = p.split('-')
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

function derniersMois(n = 6): string[] {
  const mois: string[] = []
  const now = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    mois.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return mois
}

function Badge({ statut }: { statut: StatutReleve }) {
  const s = STATUT[statut] ?? STATUT.EN_COURS
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

/* ── Helpers ── */
function moisFr(periode: string) {
  const [y, m] = periode.split('-')
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase()
}

function anneeAcad(periode: string) {
  const [y, m] = periode.split('-')
  const year = Number(y); const month = Number(m)
  return month >= 9 ? `${year} / ${year + 1}` : `${year - 1} / ${year}`
}

function formatDuree(h: number) {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return mm > 0 ? `${String(hh).padStart(2, '0')}H${String(mm).padStart(2, '0')}` : `${String(hh).padStart(2, '0')}H`
}

function FichePreview({ releve: r, onClose }: { releve: FeuilleHeureResponse; onClose: () => void }) {
  const BLEU = '#14329A'
  const lignes = r.lignes ?? []
  const totalH = r.totalHeuresValidees
  const classesTxt = (r.classes && r.classes.length > 0 ? r.classes : r.classe ? [r.classe] : []).join(', ')
  const nomParts = (r.nomVacataire ?? '').split(' ')
  const nom = nomParts.slice(-1)[0]?.toUpperCase() ?? '—'
  const prenom = nomParts.slice(0, -1).join(' ') || '—'

  // Cadre d'intervention : Digital Campus si classe contient "DIGITAL" ou "DC"
  const isDigital = classesTxt.toLowerCase().includes('digital') || (r.module ?? '').toLowerCase().includes('digital')

  const visaAssistant = ['SOUMIS_RP','VALIDE_RP','SOUMIS_FINANCE','VALIDE'].includes(r.statut) ? '✓ Soumis' : ''
  const visaCoord     = ['VALIDE_RP','SOUMIS_FINANCE','VALIDE'].includes(r.statut) ? '✓ Validé RP' : ''
  const visaDirecteur = r.statut === 'VALIDE' ? '✓ Validé' : ''

  const MIN_ROWS = 14
  const rows = [...lignes]
  while (rows.length < MIN_ROWS) rows.push(null as unknown as typeof lignes[0])

  const td  = 'border border-gray-600 px-2 py-1'
  const tdC = 'border border-gray-600 px-1 py-1 text-center text-[11px]'
  const lbl = `${td} font-semibold text-[11px]`
  const val = `${td} text-[11px]`

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8 px-4">
      <div className="relative w-full max-w-3xl bg-white shadow-2xl rounded-2xl border border-gray-200 font-sans">

        {/* Bouton fermer */}
        <button onClick={onClose}
          className="absolute top-3 right-3 z-10 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="p-6 pt-5">

        {/* ── Bandeau titre ── */}
        <table className="w-full border-collapse mb-0" style={{ border: '1.5px solid #333' }}>
          <tbody>
            <tr>
              {/* ISM box */}
              <td style={{ width: '15%', border: '1px solid #555', padding: '8px', textAlign: 'center', verticalAlign: 'middle' }}>
                <div style={{ border: '1.5px solid #333', display: 'inline-block', padding: '4px 10px', fontWeight: 800, fontSize: 15 }}>ISM</div>
              </td>
              {/* Titre */}
              <td style={{ width: '50%', border: '1px solid #555', padding: '8px', textAlign: 'center', verticalAlign: 'middle' }}>
                <div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.3 }}>FICHE DE DÉCOMPTE<br/>HORAIRE</div>
              </td>
              {/* Réf */}
              <td style={{ width: '35%', border: '1px solid #555', padding: 0, verticalAlign: 'top', fontSize: 11 }}>
                <div style={{ borderBottom: '1px solid #555', padding: '3px 6px' }}>Réf : E22. Anim &nbsp;&nbsp; <span style={{ float: 'right' }}>Motif : Modification</span></div>
                <div style={{ borderBottom: '1px solid #555', padding: '3px 6px' }}>Version N° : 02</div>
                <div style={{ padding: '3px 6px' }}>Page : 1/1</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── Nom / Prénoms / Statut / Téléphone ── */}
        <table className="w-full border-collapse" style={{ border: '1px solid #555', borderTop: 'none' }}>
          <tbody>
            <tr>
              <td className={lbl} style={{ width: '12%' }}>Nom :</td>
              <td className={val} style={{ color: BLEU, fontStyle: 'italic', width: '36%' }}>{nom}</td>
              <td className={lbl} style={{ width: '12%' }}>Prénoms :</td>
              <td className={val} style={{ color: BLEU, fontStyle: 'italic', width: '40%' }}>{prenom}</td>
            </tr>
            <tr>
              <td className={lbl}>Statut :</td>
              <td className={val} colSpan={3}>
                Externe <span style={{ border: '1px solid #555', padding: '0 3px', marginLeft: 4 }}>✓</span>
              </td>
            </tr>
            <tr>
              <td className={lbl}>Téléphone :</td>
              <td className={val} style={{ color: BLEU, fontStyle: 'italic' }} colSpan={3}>—</td>
            </tr>
          </tbody>
        </table>

        {/* ── Cadre d'intervention ── */}
        <table className="w-full border-collapse" style={{ border: '1px solid #555', borderTop: 'none' }}>
          <tbody>
            <tr>
              <td className={lbl} style={{ width: '20%', verticalAlign: 'middle' }}>Cadre<br/>d'Intervention</td>
              <td className={val} colSpan={3}>
                <span style={{ fontWeight: 700 }}>ÉCOLE D'INGÉNIEURS</span>{' '}
                <span style={{ border: '1px solid #555', padding: '0 3px', marginLeft: 4, marginRight: 16 }}>
                  {isDigital ? '' : '✓'}
                </span>
                <span style={{ fontWeight: 700, marginLeft: 8 }}>DIGITAL CAMPUS</span>{' '}
                <span style={{ border: '1px solid #555', padding: '0 3px', marginLeft: 4 }}>
                  {isDigital ? '✓' : ''}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── Classe / Spécialisation ── */}
        <table className="w-full border-collapse" style={{ border: '1px solid #555', borderTop: 'none' }}>
          <tbody>
            <tr>
              <td className={lbl} style={{ width: '28%' }}>Classe(s) bénéficiaire(s) :</td>
              <td className={val} style={{ color: BLEU, fontStyle: 'italic', width: '22%' }}>{classesTxt || '—'}</td>
              <td className={lbl} style={{ width: '18%' }}>Spécialisation :</td>
              <td className={val} style={{ color: BLEU, fontStyle: 'italic' }}>{r.module ?? '—'}</td>
            </tr>
          </tbody>
        </table>

        {/* ── Année Académique / Module ── */}
        <table className="w-full border-collapse" style={{ border: '1px solid #555', borderTop: 'none' }}>
          <tbody>
            <tr>
              <td className={lbl} style={{ width: '28%' }}>Année Académique :</td>
              <td className={val} style={{ width: '22%' }}>{anneeAcad(r.periode)}</td>
              <td className={lbl} style={{ width: '18%' }}>Module(s)<br/>enseigné(s) :</td>
              <td className={val} style={{ color: BLEU, fontStyle: 'italic' }}>{r.module ?? '—'}</td>
            </tr>
          </tbody>
        </table>

        {/* ── Mois ── */}
        <table className="w-full border-collapse" style={{ border: '1px solid #555', borderTop: 'none' }}>
          <tbody>
            <tr>
              <td className={lbl} style={{ width: '12%' }}>Mois :</td>
              <td className={val} style={{ color: BLEU, fontStyle: 'italic', fontWeight: 700 }}>{moisFr(r.periode)}</td>
            </tr>
          </tbody>
        </table>

        {/* ── Tableau séances ── */}
        <table className="w-full border-collapse mt-0" style={{ border: '1px solid #555', borderTop: 'none', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#e5e7eb' }}>
              <th className={tdC} rowSpan={2} style={{ width: '22%' }}>Date</th>
              <th className={tdC} colSpan={2}>Début</th>
              <th className={tdC} colSpan={2}>Fin</th>
              <th className={tdC} rowSpan={2} style={{ width: '10%' }}>Durée</th>
              <th className={tdC} rowSpan={2} style={{ width: '18%' }}>Signature</th>
            </tr>
            <tr style={{ background: '#e5e7eb' }}>
              <th className={tdC} style={{ width: '8%' }}>h</th>
              <th className={tdC} style={{ width: '8%' }}>mn</th>
              <th className={tdC} style={{ width: '8%' }}>h</th>
              <th className={tdC} style={{ width: '8%' }}>mn</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l, i) => {
              if (!l) return (
                <tr key={i} style={{ height: 20 }}>
                  <td className={tdC}></td>
                  <td className={tdC}></td><td className={tdC}></td>
                  <td className={tdC}></td><td className={tdC}></td>
                  <td className={tdC}></td><td className={tdC}></td>
                </tr>
              )
              const d = new Date(l.date + 'T00:00:00')
              const dateStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
              const [dh, dm] = String(l.heureDebut).slice(0, 5).split(':')
              const [fh, fm] = String(l.heureFin).slice(0, 5).split(':')
              const nomCourt = nomParts.slice(-1)[0] ?? ''
              return (
                <tr key={l.id}>
                  <td className={tdC} style={{ color: BLEU, fontStyle: 'italic' }}>{dateStr}</td>
                  <td className={tdC} style={{ color: BLEU, fontStyle: 'italic' }}>{dh}</td>
                  <td className={tdC} style={{ color: BLEU, fontStyle: 'italic' }}>{dm}</td>
                  <td className={tdC} style={{ color: BLEU, fontStyle: 'italic' }}>{fh}</td>
                  <td className={tdC} style={{ color: BLEU, fontStyle: 'italic' }}>{fm}</td>
                  <td className={tdC} style={{ color: BLEU, fontWeight: 700 }}>{formatDuree(l.duree)}</td>
                  <td className={tdC} style={{ color: BLEU, fontStyle: 'italic', fontSize: 9 }}>M. {nomCourt}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* ── Totaux ── */}
        <table className="w-full border-collapse" style={{ border: '1px solid #555', borderTop: 'none' }}>
          <tbody>
            <tr>
              <td className={lbl} style={{ width: '28%' }}>Durée Totale :</td>
              <td className={val} style={{ color: BLEU, fontWeight: 700, width: '22%' }}>{formatDuree(totalH)}</td>
              <td className={lbl} style={{ width: '24%' }}>Taux horaire brut :</td>
              <td className={val} style={{ color: BLEU, fontStyle: 'italic' }}>
                {r.tauxHoraire ? `${r.tauxHoraire.toLocaleString('fr-FR')} FCFA` : '—'}
              </td>
            </tr>
            <tr>
              <td className={lbl} colSpan={2} style={{ fontWeight: 700 }}>Montant brut :</td>
              <td className={val} style={{ color: BLEU, fontWeight: 700, fontSize: 13 }} colSpan={2}>
                {r.tauxHoraire ? `${(totalH * r.tauxHoraire).toLocaleString('fr-FR')} FCFA` : '—'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── Visas ── */}
        <table className="w-full border-collapse" style={{ border: '1px solid #555', borderTop: 'none' }}>
          <tbody>
            <tr style={{ background: '#e5e7eb' }}>
              <td className={tdC} style={{ fontWeight: 700, width: '33%' }}>Visa de l'Assistant de Prog.</td>
              <td className={tdC} style={{ fontWeight: 700, width: '33%' }}>Visa du Coordonnateur</td>
              <td className={tdC} style={{ fontWeight: 700, width: '34%' }}>Visa du Directeur</td>
            </tr>
            <tr style={{ height: 52 }}>
              <td className={tdC} style={{ color: '#16A04A', fontWeight: 700 }}>{visaAssistant}</td>
              <td className={tdC} style={{ color: '#16A04A', fontWeight: 700 }}>{visaCoord}</td>
              <td className={tdC} style={{ color: '#16A04A', fontWeight: 700 }}>{visaDirecteur}</td>
            </tr>
          </tbody>
        </table>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between">
          <button onClick={onClose}
            className="rounded-lg px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200">
            Fermer
          </button>
          <button onClick={() => releveService.telechargerPdf(r.id)}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Télécharger PDF
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}

export default function AttacheRelevesPage() {
  const queryClient = useQueryClient()

  const [periode,     setPeriode]     = useState('')
  const [classeNom,   setClasseNom]   = useState('')
  const [vacataireId, setVacataireId] = useState<number | ''>('')
  const [confirmId,   setConfirmId]   = useState<number | null>(null)
  const [ouvertId,    setOuvertId]    = useState<number | null>(null)

  /* ── Données de référence ── */
  const { data: vacataires = [] } = useQuery({
    queryKey: ['vacataires'],
    queryFn: vacataireService.listerTous,
  })
  const { data: maquette = [] } = useQuery({
    queryKey: ['maquette'],
    queryFn: () => api.get<{ classeNom: string }[]>('/maquette').then(r => r.data),
  })
  const classes = useMemo(() => [...new Set(maquette.map(m => m.classeNom))].sort(), [maquette])

  /* ── Relevés ── */
  const { data: releves = [], isLoading } = useQuery({
    queryKey: ['releves-attache', periode, classeNom, vacataireId],
    queryFn: () => releveService.lister({
      ...(periode ? { periode } : {}),
      ...(classeNom ? { classeNom } : {}),
      ...(vacataireId !== '' ? { vacataireId: vacataireId as number } : {}),
    }),
  })

  const [erreurSoumission, setErreurSoumission] = useState<string | null>(null)

  /* ── Mutation soumettre au RP ── */
  const { mutate: soumettre, isPending } = useMutation({
    mutationFn: (id: number) => releveService.soumettre(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['releves-attache'] })
      setConfirmId(null)
      setErreurSoumission(null)
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } | string } }
      const data = e?.response?.data
      const msg = typeof data === 'string' ? data : data?.message
      setErreurSoumission(msg ?? 'Erreur lors de la soumission.')
    },
  })

  /* ── KPIs ── */
  const kpis = useMemo(() => ({
    total:    releves.length,
    enCours:  releves.filter(r => r.statut === 'EN_COURS').length,
    soumis:   releves.filter(r => ['SOUMIS_RP', 'SOUMIS', 'VALIDE_RP', 'SOUMIS_FINANCE'].includes(r.statut)).length,
    valides:  releves.filter(r => r.statut === 'VALIDE').length,
    heures:   releves.reduce((s, r) => s + r.totalHeuresValidees, 0),
  }), [releves])

  const moisOptions = derniersMois(8)

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Relevés d'heures</h2>
        <p className="mt-1 text-sm text-gray-500">
          Générés automatiquement lors de la validation des séances · Un relevé par module par mois
        </p>
      </div>

      {/* ── Bandeau info ── */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
        <span className="text-lg mt-0.5">ℹ️</span>
        <p className="text-sm text-amber-800">
          Les relevés sont <strong>créés automatiquement</strong> dès que vous validez une séance comme réalisée.
          En fin de mois, soumettez chaque relevé au Responsable de Programme via le bouton <em>"Soumettre au RP"</em>.
        </p>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total relevés',  value: kpis.total,          color: 'text-gray-900',   bg: 'bg-white' },
          { label: 'En cours',       value: kpis.enCours,        color: 'text-[#7A4010]',  bg: 'bg-[#FDF6ED]' },
          { label: 'En validation',  value: kpis.soumis,         color: 'text-blue-700',   bg: 'bg-blue-50' },
          { label: 'Validés',        value: kpis.valides,        color: 'text-green-700',  bg: 'bg-green-50' },
        ].map(k => (
          <div key={k.label} className={`rounded-2xl ${k.bg} border border-white p-4 shadow-sm`}>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* ── Filtres ── */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">Mois</label>
            <select value={periode} onChange={e => setPeriode(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#C88500]">
              <option value="">Tous les mois</option>
              {moisOptions.map(m => (
                <option key={m} value={m}>{periodeLabel(m)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">Classe</label>
            <select value={classeNom} onChange={e => setClasseNom(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#C88500]">
              <option value="">Toutes les classes</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">Vacataire</label>
            <select value={vacataireId} onChange={e => setVacataireId(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#C88500]">
              <option value="">Tous les vacataires</option>
              {vacataires.map(v => <option key={v.id} value={v.id}>{v.prenom} {v.nom}</option>)}
            </select>
          </div>
        </div>
        {(periode || classeNom || vacataireId !== '') && (
          <button onClick={() => { setPeriode(''); setClasseNom(''); setVacataireId('') }}
            className="mt-3 text-xs font-semibold text-[#C88500] hover:underline">
            × Réinitialiser les filtres
          </button>
        )}
      </div>

      {/* ── Liste des relevés ── */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400 gap-2">
            <span className="inline-block w-4 h-4 border-2 border-[#C88500] border-t-transparent rounded-full animate-spin" />
            Chargement…
          </div>
        ) : releves.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FDF6ED]">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="#C88500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-900">Aucun relevé pour ces critères</p>
            <p className="mt-1 text-xs text-gray-400">Les relevés apparaissent dès qu'une séance est validée.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {releves.map(r => {
              const estOuvert = ouvertId === r.id
              const peutSoumettre = r.statut === 'EN_COURS' && r.nombreSeances > 0

              return (
                <div key={r.id}>
                  {/* Ligne principale */}
                  <div className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${estOuvert ? 'bg-amber-50/30' : ''}`}>

                    {/* Info module / vacataire */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm">{r.module ?? '—'}</span>
                        <Badge statut={r.statut} />
                        {r.motifRejet && (
                          <span className="text-xs text-red-500 truncate max-w-xs" title={r.motifRejet}>⚠ {r.motifRejet}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500">{r.nomVacataire}</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs text-gray-500">{periodeLabel(r.periode)}</span>
                        {r.classes && r.classes.length > 0 ? (
                          <div className="flex gap-1 flex-wrap">
                            {r.classes.map(c => (
                              <span key={c} className="inline-flex rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">{c}</span>
                            ))}
                          </div>
                        ) : r.classe ? (
                          <span className="inline-flex rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">{r.classe}</span>
                        ) : null}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-5 flex-shrink-0 text-center">
                      <div>
                        <p className="text-lg font-bold text-gray-900">{r.nombreSeances}</p>
                        <p className="text-[10px] text-gray-400">séance{r.nombreSeances !== 1 ? 's' : ''}</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold" style={{ color: '#C88500' }}>{r.totalHeuresValidees.toFixed(1)}h</p>
                        <p className="text-[10px] text-gray-400">effectuées</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setOuvertId(r.id)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        Voir relevé
                      </button>
                      {peutSoumettre && (
                        <button
                          onClick={() => setConfirmId(r.id)}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                          style={{ background: '#C88500' }}
                        >
                          Soumettre au RP →
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Prévisualisation fiche de décompte (modal) */}
                  {estOuvert && <FichePreview releve={r} onClose={() => setOuvertId(null)} />}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Modal confirmation soumission ── */}
      {confirmId !== null && (() => {
        const id = confirmId
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-gray-900">Soumettre au Responsable de Programme ?</h3>
              <p className="mt-2 text-sm text-gray-500">
                Une fois soumis, vous ne pourrez plus modifier ce relevé.
                Le RP le validera avant transmission au Relais Finance.
              </p>
              {erreurSoumission && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{erreurSoumission}</p>
              )}
              <div className="mt-6 flex items-center justify-end gap-3">
                <button onClick={() => { setConfirmId(null); setErreurSoumission(null) }}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
                  Annuler
                </button>
                <button onClick={() => soumettre(id)} disabled={isPending}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50"
                  style={{ background: '#C88500' }}>
                  {isPending ? 'Envoi…' : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
