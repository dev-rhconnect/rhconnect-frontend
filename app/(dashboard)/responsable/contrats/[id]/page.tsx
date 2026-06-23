'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contratService, type ContratModuleResponse } from '@/services/contrat.service'

const niveauLabel: Record<string, string> = {
  L1: 'L1', L2: 'L2', L3: 'L3',
  MASTER: 'Master', MASTER_1: 'M1', MASTER_2: 'M2', DUT: 'DUT', LICENCE: 'Licence',
}

export default function DetailContratPage() {
  const params = useParams()
  const router = useRouter()
  const contratId = Number(params.id)
  const queryClient = useQueryClient()

  const [showDemarrer, setShowDemarrer] = useState<{ moduleId: number; nomModule: string } | null>(null)
  const [dateDemarrage, setDateDemarrage] = useState(new Date().toISOString().slice(0, 10))
  const [pdfLoading, setPdfLoading] = useState(false)

  const { data: contrat, isLoading, isError } = useQuery({
    queryKey: ['contrat', contratId],
    queryFn: () => contratService.trouverParId(contratId),
  })

  const { mutate: demarrer, isPending: demarrantModule } = useMutation({
    mutationFn: ({ moduleId, date }: { moduleId: number; date: string }) =>
      contratService.demarrerModule(contratId, moduleId, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contrat', contratId] })
      setShowDemarrer(null)
    },
  })

  if (isLoading) return <div className="flex h-64 items-center justify-center text-gray-400">Chargement…</div>
  if (isError || !contrat) return (
    <div className="rounded-2xl bg-white p-8 shadow-sm text-center">
      <p className="font-semibold text-red-600 mb-1">Contrat introuvable.</p>
      <Link href="/responsable/contrats" className="text-sm text-amber-700 underline">← Retour aux contrats</Link>
    </div>
  )

  const modules = contrat.modules ?? []

  const modulesByStatut = {
    NON_COMMENCE: modules.filter(m => m.statut === 'NON_COMMENCE'),
    EN_COURS:     modules.filter(m => m.statut === 'EN_COURS'),
    TERMINE:      modules.filter(m => m.statut === 'TERMINE'),
  }

  const totalVH        = modules.reduce((s, m) => s + (m.volumeHorairePrevisionnel ?? 0), 0)
  const totalEffectuees = modules.reduce((s, m) => s + (m.heuresEffectuees ?? 0), 0)
  const progression    = totalVH > 0 ? Math.min(100, Math.round((totalEffectuees / totalVH) * 100)) : 0
  const depassement    = totalEffectuees > totalVH && totalVH > 0

  const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className="mx-auto max-w-4xl space-y-6">

      {/* Fil d'ariane */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/responsable/contrats" className="hover:text-gray-800 transition-colors">Contrats</Link>
        <span>/</span>
        <Link href={`/responsable/vacataires/${contrat.vacataireId}`} className="hover:text-gray-800 transition-colors">
          {contrat.nomVacataire}
        </Link>
        <span>/</span>
        <span className="font-medium text-gray-900">Contrat {contrat.anneeAcademique}</span>
      </div>

      {/* ── SECTION 1 — En-tête ── */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

          {/* Identité du contrat */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">
                Contrat {contrat.anneeAcademique}
                {contrat.estAvenant && <span className="ml-2 text-sm font-normal text-gray-400">(avenant)</span>}
              </h1>
              <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
                contrat.statut === 'ACTIF'    ? 'bg-green-100 text-green-700' :
                contrat.statut === 'RESILIE'  ? 'bg-red-100 text-red-700'    : 'bg-gray-100 text-gray-500'
              }`}>{contrat.statut}</span>
            </div>
            <p className="mt-1.5 text-base font-semibold text-gray-800">{contrat.nomVacataire}</p>
            <p className="text-sm text-gray-400">{contrat.emailVacataire}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
              <span><span className="text-gray-400 text-xs">Période</span><br />{fmt(contrat.dateDebut)} → {fmt(contrat.dateFin)}</span>
              <span><span className="text-gray-400 text-xs">Taux horaire</span><br />{contrat.tauxHoraire ? `${contrat.tauxHoraire.toLocaleString('fr-FR')} FCFA/h` : '—'}</span>
              <span><span className="text-gray-400 text-xs">Numéro</span><br />RHC-{String(contrat.id).padStart(5, '0')}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 sm:items-end">
            <button
              onClick={async () => { setPdfLoading(true); try { await contratService.telechargerPdf(contratId) } finally { setPdfLoading(false) } }}
              disabled={pdfLoading}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {pdfLoading ? 'Génération…' : 'Télécharger le contrat'}
            </button>
            {contrat.statut === 'ACTIF' && !contrat.estAvenant && (
              <Link
                href={`/responsable/contrats/${contratId}/avenant/nouveau`}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: '#C88500' }}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Ajouter un avenant
              </Link>
            )}
          </div>
        </div>

        {/* Progression globale */}
        <div className={`mt-5 rounded-xl p-4 ${depassement ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progression globale</span>
            <span className={`text-sm font-bold ${depassement ? 'text-red-700' : 'text-gray-900'}`}>
              {totalEffectuees}h / {totalVH}h
              {depassement && <span className="ml-2 text-xs font-normal">⚠ dépassement</span>}
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-gray-200 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all ${depassement ? 'bg-red-500' : 'bg-amber-400'}`}
              style={{ width: `${progression}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
            <span>{modulesByStatut.NON_COMMENCE.length} non commencé(s)</span>
            <span className="text-blue-600">{modulesByStatut.EN_COURS.length} en cours</span>
            <span className="text-green-600">{modulesByStatut.TERMINE.length} terminé(s)</span>
          </div>
        </div>
      </div>

      {/* ── SECTION 2 — Modules NON COMMENCÉS ── */}
      {modulesByStatut.NON_COMMENCE.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">Modules à démarrer</h2>
          <div className="space-y-2">
            {modulesByStatut.NON_COMMENCE.map(mod => (
              <div key={mod.id} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{mod.nomModule}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600">{niveauLabel[mod.niveau] ?? mod.niveau}</span>
                    {mod.classes?.map(c => (
                      <span key={c} className="rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-xs text-amber-800">{c}</span>
                    ))}
                    <span className="text-xs text-gray-400 ml-1">{mod.volumeHorairePrevisionnel ?? 0}h prévues</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">Non commencé</span>
                  {contrat.statut === 'ACTIF' && (
                    <button
                      onClick={() => { setShowDemarrer({ moduleId: mod.id, nomModule: mod.nomModule }); setDateDemarrage(new Date().toISOString().slice(0, 10)) }}
                      className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors whitespace-nowrap"
                    >
                      Démarrer le module
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION 3 — Modules EN COURS ── */}
      {modulesByStatut.EN_COURS.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-blue-600">Modules en cours</h2>
          <div className="space-y-3">
            {modulesByStatut.EN_COURS.map(mod => <ModuleEnCours key={mod.id} mod={mod} contratId={contratId} />)}
          </div>
        </div>
      )}

      {/* ── SECTION 4 (si terminés) ── */}
      {modulesByStatut.TERMINE.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-green-600">Modules terminés</h2>
          <div className="space-y-2">
            {modulesByStatut.TERMINE.map(mod => (
              <div key={mod.id} className="flex items-center gap-4 rounded-xl border border-green-100 bg-green-50 px-4 py-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-4 w-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{mod.nomModule}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {mod.classes?.join(', ')} · {mod.heuresEffectuees ?? 0}h effectuées / {mod.volumeHorairePrevisionnel ?? 0}h prévues
                  </p>
                </div>
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">Terminé</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bouton télécharger en bas ── */}
      <div className="flex justify-center pb-4">
        <button
          onClick={async () => { setPdfLoading(true); try { await contratService.telechargerPdf(contratId) } finally { setPdfLoading(false) } }}
          disabled={pdfLoading}
          className="flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90 shadow-sm"
          style={{ background: '#1C0800' }}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          {pdfLoading ? 'Génération PDF…' : 'Télécharger le contrat (PDF)'}
        </button>
      </div>

      {/* ── Modale Démarrer ── */}
      {showDemarrer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-1 text-base font-bold text-gray-900">Démarrer le module</h3>
            <p className="mb-4 text-sm text-gray-500">{showDemarrer.nomModule}</p>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Date de démarrage</label>
            <input
              type="date"
              value={dateDemarrage}
              onChange={e => setDateDemarrage(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-400"
            />
            <p className="mt-2 text-xs text-gray-400">
              Une fois démarré, les relevés d'heures seront débloqués pour ce module.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setShowDemarrer(null)} className="rounded-xl px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">
                Annuler
              </button>
              <button
                onClick={() => demarrer({ moduleId: showDemarrer.moduleId, date: dateDemarrage })}
                disabled={demarrantModule || !dateDemarrage}
                className="rounded-xl px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: '#C88500' }}
              >
                {demarrantModule ? 'Démarrage…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Module EN COURS avec barre de progression et heures ── */
function ModuleEnCours({ mod, contratId }: { mod: ContratModuleResponse; contratId: number }) {
  const vh       = mod.volumeHorairePrevisionnel ?? 0
  const done     = mod.heuresEffectuees ?? 0
  const restant  = mod.heuresRestantes ?? Math.max(0, vh - done)
  const pct      = vh > 0 ? Math.round((done / vh) * 100) : 0
  const depasse  = done > vh && vh > 0

  const niveauLabel: Record<string, string> = {
    L1: 'L1', L2: 'L2', L3: 'L3',
    MASTER: 'Master', MASTER_1: 'M1', MASTER_2: 'M2', DUT: 'DUT', LICENCE: 'Licence',
  }

  return (
    <div className={`rounded-xl border p-4 ${depasse ? 'border-red-200 bg-red-50' : 'border-blue-100 bg-blue-50'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 text-sm">{mod.nomModule}</p>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${depasse ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
              {depasse ? '⚠ Dépassement' : 'En cours'}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600">{niveauLabel[mod.niveau] ?? mod.niveau}</span>
            {mod.classes?.map(c => (
              <span key={c} className="rounded bg-white border border-blue-200 px-1.5 py-0.5 text-xs text-blue-800">{c}</span>
            ))}
          </div>
          {mod.dateDemarrage && (
            <p className="mt-1 text-xs text-gray-400">
              Démarré le {new Date(mod.dateDemarrage).toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>

        {/* Compteurs */}
        <div className="flex-shrink-0 text-right text-xs">
          <p className={`text-lg font-bold ${depasse ? 'text-red-700' : 'text-blue-700'}`}>{done}h</p>
          <p className="text-gray-400">/ {vh}h prévues</p>
          <p className={`mt-0.5 font-medium ${depasse ? 'text-red-600' : 'text-gray-500'}`}>
            {depasse ? `${done - vh}h de trop` : `${restant}h restantes`}
          </p>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="mt-3 h-2 w-full rounded-full bg-white/60 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all ${depasse ? 'bg-red-500' : 'bg-blue-500'}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-gray-400">
        <span>{pct}% effectué</span>
        {depasse && <span className="text-red-600 font-medium">Planification bloquée</span>}
      </div>

      {/* Lien vers le relevé */}
      <div className="mt-3 pt-3 border-t border-white/40">
        <Link
          href={`/responsable/releves?module=${encodeURIComponent(mod.nomModule)}`}
          className="text-xs font-medium text-blue-700 hover:underline"
        >
          Voir les relevés d'heures →
        </Link>
      </div>
    </div>
  )
}
