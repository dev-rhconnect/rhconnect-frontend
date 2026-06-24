'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { releveService } from '@/services/releve.service'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })
}

function formatTime(t?: string) {
  return t?.toString().slice(0, 5) ?? '—'
}

export default function ReleveDetailFinancePage() {
  const { id } = useParams<{ id: string }>()
  const releveId = Number(id)
  const router = useRouter()
  const queryClient = useQueryClient()

  const [showRejet, setShowRejet] = useState(false)
  const [motif, setMotif] = useState('')

  const { data: releve, isLoading } = useQuery({
    queryKey: ['releve', releveId],
    queryFn: () => releveService.trouverParId(releveId),
  })

  const { mutate: valider, isPending: validating } = useMutation({
    mutationFn: () => releveService.valider(releveId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['releves-soumis'] })
      router.push('/finance/validations')
    },
  })

  const { mutate: rejeter, isPending: rejecting } = useMutation({
    mutationFn: () => releveService.rejeter(releveId, motif),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['releves-soumis'] })
      router.push('/finance/validations')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <p className="text-sm text-gray-400">Chargement du relevé…</p>
        </div>
      </div>
    )
  }

  if (!releve) {
    return (
      <div className="flex items-center justify-center py-32 text-sm text-red-500">
        Relevé introuvable.
      </div>
    )
  }

  const lignesValides = releve.lignes.filter((l) => l.statut !== 'REJETEE')
  const heuresSoumises = lignesValides.reduce((acc, l) => acc + (l.duree ?? 0), 0)
  const taux = releve.tauxHoraire ?? 0
  const montantBrut = heuresSoumises * taux
  const retenue = montantBrut * 0.05
  const netAPayer = montantBrut - retenue
  const tauxOccupation = releve.volumeHorairePrevisionnel
    ? Math.round((heuresSoumises / releve.volumeHorairePrevisionnel) * 100)
    : null

  return (
    <div className="space-y-5 pb-10">

      {/* Navigation */}
      <div>
        <Link
          href="/finance/validations"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Retour aux validations
        </Link>
      </div>

      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl text-white shadow-lg" style={{ background: '#C88500' }}>
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="absolute -bottom-8 right-8 h-32 w-32 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />

        {/* Infos principales */}
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between px-6 pt-6 pb-5">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-wide" style={{ background: 'rgba(28,8,0,0.25)', color: '#fff' }}>
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              En attente de validation
            </div>
            <h1 className="text-3xl font-bold">{releve.nomVacataire}</h1>
            <p className="mt-1 text-sm text-white/80">{releve.module} · {releve.classe} · {releve.periode}</p>
          </div>
          {taux > 0 && (
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-white/70">Net à payer</p>
              <p className="text-3xl font-bold">{netAPayer.toLocaleString('fr-FR')}</p>
              <p className="text-sm text-white/70">FCFA</p>
            </div>
          )}
        </div>

        {/* Métriques — bandeau plein largeur sans gap */}
        <div className="relative grid grid-cols-1 sm:grid-cols-3 divide-x border-t" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
          {[
            { label: 'Heures soumises', value: `${heuresSoumises.toFixed(1)} h` },
            { label: 'Séances', value: String(lignesValides.length) },
            { label: "Taux d'avancement", value: tauxOccupation != null ? `${tauxOccupation}%` : '—' },
          ].map(({ label, value }, i) => (
            <div key={i} className="px-6 py-4" style={{ borderColor: 'rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.12)' }}>
              <p className="text-xs text-white/70">{label}</p>
              <p className="mt-1 text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Récapitulatif contrat */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3.5">
          <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <h3 className="text-sm font-bold text-gray-900">Informations du contrat</h3>
        </div>
        <div className="grid grid-cols-1 gap-px bg-gray-50 sm:grid-cols-2">
          {[
            { label: 'Vacataire', value: releve.nomVacataire },
            { label: 'Module', value: releve.module },
            { label: 'Classe', value: releve.classe },
            { label: 'Période', value: releve.periode },
            { label: 'Volume horaire prévu', value: releve.volumeHorairePrevisionnel != null ? `${releve.volumeHorairePrevisionnel.toFixed(1)} h` : '—' },
            { label: 'Taux horaire', value: taux > 0 ? `${taux.toLocaleString('fr-FR')} FCFA / h` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white px-5 py-3.5">
              <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
              <p className="mt-0.5 text-sm font-semibold text-gray-900">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Calcul financier */}
      {taux > 0 ? (
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3.5">
            <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <h3 className="text-sm font-bold text-gray-900">Calcul de rémunération</h3>
          </div>
          <div className="p-5">
            <div className="space-y-0 divide-y divide-gray-50">
              {/* Ligne brut */}
              <div className="flex items-center justify-between py-3.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">Montant brut</p>
                  <p className="text-xs text-gray-400 mt-0.5">{heuresSoumises.toFixed(1)} h × {taux.toLocaleString('fr-FR')} FCFA</p>
                </div>
                <span className="text-base font-bold text-gray-900">{montantBrut.toLocaleString('fr-FR')} FCFA</span>
              </div>

              {/* Retenue */}
              <div className="flex items-center justify-between py-3.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">Retenue CGI</p>
                  <p className="text-xs text-gray-400 mt-0.5">5% du montant brut</p>
                </div>
                <span className="text-base font-semibold text-red-500">− {retenue.toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>

            {/* Net à payer — mis en évidence */}
            <div className="mt-3 flex items-center justify-between rounded-xl bg-green-50 border border-green-100 px-5 py-4">
              <div>
                <p className="text-sm font-bold text-green-900">Net à payer</p>
                <p className="text-xs text-green-600 mt-0.5">Après retenue CGI (5%)</p>
              </div>
              <span className="text-2xl font-bold text-green-700">{netAPayer.toLocaleString('fr-FR')} FCFA</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700">
          <span className="font-semibold">Taux horaire non défini</span> — le calcul de rémunération ne peut pas être effectué pour ce contrat.
        </div>
      )}

      {/* Détail des séances */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <h3 className="text-sm font-bold text-gray-900">Séances déclarées</h3>
          </div>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
            {releve.lignes.length} séance{releve.lignes.length !== 1 ? 's' : ''}
          </span>
        </div>

        {releve.lignes.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-gray-400">
            Aucune séance saisie.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {releve.lignes.map((l) => (
              <div key={l.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/70 transition-colors">
                {/* Indicateur statut */}
                <div className={`h-2 w-2 flex-shrink-0 rounded-full ${l.statut === 'REJETEE' ? 'bg-red-400' : 'bg-emerald-400'}`} />

                {/* Date */}
                <div className="w-28 flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-900 capitalize">{formatDate(String(l.date))}</p>
                </div>

                {/* Horaires */}
                <div className="flex-1">
                  {l.statut === 'REJETEE' ? (
                    <span className="text-sm text-gray-400">Absence</span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-mono font-medium text-gray-700">{formatTime(l.heureDebut)}</span>
                      <svg className="h-3 w-3 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-mono font-medium text-gray-700">{formatTime(l.heureFin)}</span>
                    </div>
                  )}
                </div>

                {/* Durée */}
                <div className="text-right">
                  {l.statut === 'REJETEE' ? (
                    <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-500">
                      Absence
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-gray-900">{l.duree?.toFixed(1)} h</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total footer */}
        {releve.lignes.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-5 py-3.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total</span>
            <span className="text-sm font-bold text-gray-900">{heuresSoumises.toFixed(1)} h</span>
          </div>
        )}
      </div>

      {/* Actions */}
      {releve.statut === 'SOUMIS' && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Vérifiez les informations avant de valider ou rejeter ce relevé.
          </p>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              onClick={() => setShowRejet(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              Rejeter
            </button>
            <button
              onClick={() => valider()}
              disabled={validating}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm shadow-green-200"
            >
              {validating ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {validating ? 'Validation…' : 'Valider le relevé'}
            </button>
          </div>
        </div>
      )}

      {/* Modal rejet */}
      {showRejet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl mx-4 mb-4 sm:mb-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <svg className="h-5 w-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Rejeter le relevé</h3>
                <p className="text-xs text-gray-400">{releve.nomVacataire} · {releve.module} · {releve.periode}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Motif du rejet <span className="text-red-500">*</span>
              </label>
              <textarea
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                rows={3}
                placeholder="Expliquez la raison du rejet…"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-50 resize-none transition-all"
              />
              <p className="mt-1 text-xs text-gray-400">Ce motif sera visible par le vacataire.</p>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => { setShowRejet(false); setMotif('') }}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => rejeter()}
                disabled={!motif.trim() || rejecting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {rejecting && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                {rejecting ? 'Envoi…' : 'Confirmer le rejet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
