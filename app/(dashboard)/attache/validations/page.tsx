'use client'

import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { seanceService, type SeanceProgrammeeResponse, type StatutSeance } from '@/services/seance.service'

const typeLabel: Record<string, string> = {
  CM: 'Cours Magistral (CM)',
  TD: 'Travaux Dirigés (TD)',
  TP: 'Travaux Pratiques (TP)',
  CONFERENCE: 'Conférence',
}

const statutConfig: Record<StatutSeance, { label: string; className: string }> = {
  PROGRAMMEE: { label: 'Programmée', className: 'bg-blue-50 text-blue-700' },
  REALISEE:   { label: 'Réalisée',   className: 'bg-green-50 text-green-700' },
  ANNULEE:    { label: 'Annulée',    className: 'bg-gray-100 text-gray-500' },
}

function initiales(nom: string) {
  return nom.split(' ').slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatHeure(t: string) {
  return t.slice(0, 5)
}

export default function AttacheValidationsPage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selected, setSelected] = useState<SeanceProgrammeeResponse | null>(null)
  const [note, setNote] = useState('')
  const [motifAnnulation, setMotifAnnulation] = useState('')
  const [showAnnulerModal, setShowAnnulerModal] = useState(false)

  const { data: seances = [], isLoading, isError } = useQuery({
    queryKey: ['seances-semaine'],
    queryFn: () => seanceService.semaine(),
  })

  const { mutate: valider, isPending: validating } = useMutation({
    mutationFn: (id: number) => seanceService.valider(id, note || undefined),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['seances-semaine'] })
      setSelected(updated)
      setNote('')
    },
  })

  const { mutate: annuler, isPending: annuling } = useMutation({
    mutationFn: ({ id, motif }: { id: number; motif: string }) =>
      seanceService.annuler(id, motif || undefined),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['seances-semaine'] })
      setSelected(updated)
      setShowAnnulerModal(false)
      setMotifAnnulation('')
    },
  })

  const { mutate: uploadPresence, isPending: uploading } = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      seanceService.uploadFeuillePresence(id, file),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['seances-semaine'] })
      setSelected(updated)
    },
  })

  const programmees = seances.filter((s) => s.statut === 'PROGRAMMEE')
  const count = programmees.length

  return (
    <div className="flex flex-col gap-0">
      {/* En-tête */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Validations des Séances</h2>
        <p className="mt-1 text-sm text-gray-500">
          {isLoading ? 'Chargement…' : `${count} séance${count !== 1 ? 's' : ''} en attente de traitement administratif.`}
        </p>
      </div>

      {isError && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          Erreur de chargement des séances.
        </div>
      )}

      {/* Split view */}
      <div className="flex gap-4 min-h-[520px]">
        {/* Liste — gauche */}
        <div className="w-[420px] flex-shrink-0 rounded-2xl bg-white shadow-sm overflow-hidden">
          {!isLoading && seances.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <svg className="mb-3 h-10 w-10 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /></svg>
              <p className="text-sm font-medium text-gray-700">Aucune séance cette semaine</p>
              <p className="mt-1 text-xs text-gray-400">Le RP n'a pas encore planifié de séances.</p>
            </div>
          )}

          {seances.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="w-8 px-3 py-3" />
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Date & Heure</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Intervenant</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Module</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Durée</th>
                </tr>
              </thead>
              <tbody>
                {seances.map((s) => {
                  const isActive = selected?.id === s.id
                  const cfg = statutConfig[s.statut]
                  return (
                    <tr
                      key={s.id}
                      onClick={() => { setSelected(s); setNote('') }}
                      className={`cursor-pointer border-b border-gray-50 transition-colors ${
                        isActive ? 'bg-orange-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-3 py-3 text-center">
                        {s.statut === 'REALISEE' && (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-green-500">
                            <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                          </span>
                        )}
                        {s.statut === 'PROGRAMMEE' && (
                          <span className="inline-block h-5 w-5 rounded border-2 border-gray-300" />
                        )}
                        {s.statut === 'ANNULEE' && (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-gray-300">
                            <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-gray-700">
                        <p className="font-medium">{formatDate(s.dateSeance)}</p>
                        <p className="text-xs text-gray-400">{formatHeure(s.heureDebut)} – {formatHeure(s.heureFin)}</p>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                            {initiales(s.nomVacataire)}
                          </span>
                          <div>
                            <p className="font-medium text-gray-900 text-xs">{s.nomVacataire}</p>
                            <p className="text-xs text-gray-400">Vacataire Externe</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-xs font-semibold text-gray-800">{s.module}</p>
                        <p className="text-xs text-gray-400">{s.classe}</p>
                      </td>
                      <td className="px-3 py-3 text-right text-xs font-semibold text-gray-700">
                        {s.duree.toFixed(1)} h
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Détail — droite */}
        <div className="flex-1 rounded-2xl bg-white shadow-sm">
          {!selected && (
            <div className="flex h-full flex-col items-center justify-center py-20 text-center px-8">
              <svg className="mb-3 h-10 w-10 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              <p className="text-sm font-medium text-gray-500">Sélectionnez une séance</p>
              <p className="mt-1 text-xs text-gray-400">Le détail s'affichera ici.</p>
            </div>
          )}

          {selected && (
            <div className="flex h-full flex-col">
              {/* Header détail */}
              <div className="border-b border-gray-100 px-6 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-400">ID : #SNC-{String(selected.id).padStart(4, '0')}</p>
                    <div className="mt-1">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statutConfig[selected.statut].className}`}>
                        {statutConfig[selected.statut].label}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                {/* Vacataire */}
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-700">
                    {initiales(selected.nomVacataire)}
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">{selected.nomVacataire}</p>
                    <p className="text-xs text-gray-500">
                      Vacataire Externe • {selected.specialiteVacataire ?? 'Intervenant'}
                    </p>
                  </div>
                </div>

                {/* Date / Horaires */}
                <div className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Date</p>
                    <p className="mt-0.5 font-semibold text-gray-800">{formatDate(selected.dateSeance)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Horaires (Déclarés)</p>
                    <p className="mt-0.5 font-semibold text-gray-800">
                      {formatHeure(selected.heureDebut)} – {formatHeure(selected.heureFin)}
                    </p>
                  </div>
                </div>

                {/* Module */}
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Module enseigné</p>
                  <span className="inline-flex rounded-lg bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-800">
                    {selected.module}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">{selected.classe}</span>
                </div>

                {/* Type / Volume */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Type de cours</p>
                    <p className="mt-0.5 font-medium text-gray-800">
                      {selected.typeSeance ? typeLabel[selected.typeSeance] : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Volume Horaire</p>
                    <p className="mt-0.5 font-semibold text-gray-800">{selected.duree.toFixed(2)} heures</p>
                  </div>
                </div>

                {/* Salle */}
                {selected.salle && (
                  <div className="text-sm">
                    <p className="text-xs text-gray-400">Salle</p>
                    <p className="mt-0.5 font-medium text-gray-800">{selected.salle}</p>
                  </div>
                )}

                {/* Feuille de présence */}
                <div className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
                  <div className="flex items-center gap-2.5">
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                    <div>
                      {selected.feuillePresenceUploaded ? (
                        <>
                          <p className="text-xs font-medium text-gray-800">Feuille de présence</p>
                          <p className="text-xs text-green-600">Uploadée</p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs font-medium text-gray-800">Feuille de présence</p>
                          <p className="text-xs text-gray-400">Non uploadée</p>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || selected.statut !== 'PROGRAMMEE'}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                  >
                    {uploading ? (
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                    )}
                    {selected.feuillePresenceUploaded ? 'Remplacer' : 'Ajouter'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) uploadPresence({ id: selected.id, file: f })
                      e.target.value = ''
                    }}
                  />
                </div>

                {/* Note interne */}
                {selected.statut === 'PROGRAMMEE' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Note interne (optionnelle)
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      placeholder="Ajouter une remarque pour le service RH ou la paie…"
                      className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                )}

                {selected.noteInterne && selected.statut !== 'PROGRAMMEE' && (
                  <div className="rounded-xl bg-amber-50 p-3">
                    <p className="text-xs font-semibold text-amber-800">Note interne</p>
                    <p className="mt-1 text-xs text-amber-700">{selected.noteInterne}</p>
                  </div>
                )}

                {selected.nomValidePar && (
                  <p className="text-xs text-gray-400">
                    Validée par <span className="font-medium text-gray-600">{selected.nomValidePar}</span>
                    {selected.dateValidation && ` le ${formatDate(selected.dateValidation)}`}
                  </p>
                )}
              </div>

              {/* Actions */}
              {selected.statut === 'PROGRAMMEE' && (
                <div className="border-t border-gray-100 px-6 py-4 flex flex-col gap-2.5">
                  <button
                    onClick={() => valider(selected.id)}
                    disabled={validating}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50"
                    style={{ background: '#16a34a' }}
                  >
                    {validating ? (
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    )}
                    Valider la séance
                  </button>
                  <button
                    onClick={() => setShowAnnulerModal(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                    Rejeter
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal annulation */}
      {showAnnulerModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-gray-900">Rejeter la séance ?</h3>
            <p className="mt-1 text-sm text-gray-500">
              La séance sera marquée comme annulée.
            </p>
            <textarea
              value={motifAnnulation}
              onChange={(e) => setMotifAnnulation(e.target.value)}
              rows={3}
              placeholder="Motif (optionnel)"
              className="mt-3 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAnnulerModal(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                Annuler
              </button>
              <button
                onClick={() => annuler({ id: selected.id, motif: motifAnnulation })}
                disabled={annuling}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {annuling ? 'Traitement…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
