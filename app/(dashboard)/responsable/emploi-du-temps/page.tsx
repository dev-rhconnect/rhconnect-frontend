'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contratService } from '@/services/contrat.service'
import { seanceService, type SeanceProgrammeeResponse, type TypeSeance, type StatutSeance } from '@/services/seance.service'
import { disponibiliteService } from '@/services/disponibilite.service'

const typeOptions: { value: TypeSeance; label: string }[] = [
  { value: 'CM', label: 'Cours Magistral (CM)' },
  { value: 'TD', label: 'Travaux Dirigés (TD)' },
  { value: 'TP', label: 'Travaux Pratiques (TP)' },
  { value: 'CONFERENCE', label: 'Conférence' },
]

const statutConfig: Record<StatutSeance, { label: string; className: string }> = {
  PROGRAMMEE: { label: 'Programmée', className: 'bg-blue-50 text-blue-700' },
  REALISEE:   { label: 'Réalisée',   className: 'bg-green-50 text-green-700' },
  ANNULEE:    { label: 'Annulée',    className: 'bg-gray-100 text-gray-500' },
}

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  })
}

export default function EmploiDuTempsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [lastAdded, setLastAdded] = useState<string | null>(null)

  const [contratId, setContratId] = useState<number | ''>('')
  const [disponibiliteId, setDisponibiliteId] = useState<number | ''>('')
  const [dateSeance, setDateSeance] = useState('')
  const [heureDebut, setHeureDebut] = useState('')
  const [heureFin, setHeureFin] = useState('')
  const [typeSeance, setTypeSeance] = useState<TypeSeance | ''>('')
  const [salle, setSalle] = useState('')

  const { data: contrats = [] } = useQuery({
    queryKey: ['contrats-actifs'],
    queryFn: contratService.listerActifs,
  })

  const { data: seances = [], isLoading } = useQuery({
    queryKey: ['seances-toutes'],
    queryFn: seanceService.listerTous,
  })

  const { data: disponibilites = [] } = useQuery({
    queryKey: ['disponibilites-toutes'],
    queryFn: disponibiliteService.listerTous,
    enabled: showForm,
  })

  const { mutate: creer, isPending: creating } = useMutation({
    mutationFn: () => seanceService.creer({
      contratId: contratId as number,
      disponibiliteId: disponibiliteId !== '' ? (disponibiliteId as number) : undefined,
      dateSeance,
      heureDebut,
      heureFin,
      typeSeance: typeSeance !== '' ? typeSeance : undefined,
      salle: salle || undefined,
    }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['seances-toutes'] })
      queryClient.invalidateQueries({ queryKey: ['seances-semaine'] })
      // Garde le contrat sélectionné, réinitialise seulement date/heure
      setLastAdded(`${created.dateSeance} ${created.heureDebut.slice(0, 5)}–${created.heureFin.slice(0, 5)}`)
      setDisponibiliteId('')
      setDateSeance('')
      setHeureDebut('')
      setHeureFin('')
      setTypeSeance('')
      setSalle('')
    },
  })

  function resetForm() {
    setShowForm(false)
    setLastAdded(null)
    setContratId('')
    setDisponibiliteId('')
    setDateSeance('')
    setHeureDebut('')
    setHeureFin('')
    setTypeSeance('')
    setSalle('')
  }

  const contratSelectionne = contratId !== '' ? contrats.find((c) => c.id === contratId) ?? null : null

  const disposFiltrees = contratSelectionne
    ? disponibilites.filter((d) => d.vacataireId === contratSelectionne.vacataireId)
    : disponibilites

  const dateHorsPeriode = dateSeance && contratSelectionne
    ? dateSeance < contratSelectionne.dateDebut || dateSeance > contratSelectionne.dateFin
    : false

  const canSubmit = contratId !== '' && dateSeance && heureDebut && heureFin && !dateHorsPeriode

  // Calcul durée preview
  let dureePreview = ''
  if (heureDebut && heureFin) {
    const [h1, m1] = heureDebut.split(':').map(Number)
    const [h2, m2] = heureFin.split(':').map(Number)
    const minutes = (h2 * 60 + m2) - (h1 * 60 + m1)
    if (minutes > 0) dureePreview = `${(minutes / 60).toFixed(1)} h`
  }

  // Stats
  const total = seances.length
  const programmees = seances.filter((s) => s.statut === 'PROGRAMMEE').length
  const realisees = seances.filter((s) => s.statut === 'REALISEE').length

  return (
    <div>
      {/* En-tête */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Emploi du temps</h2>
          <p className="mt-1 text-sm text-gray-500">
            Planifiez les séances des vacataires à partir des contrats actifs et disponibilités.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          style={{ background: '#C88500' }}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Planifier une séance
        </button>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: 'Total séances', value: total, color: 'text-gray-900' },
          { label: 'Programmées', value: programmees, color: 'text-blue-600' },
          { label: 'Réalisées', value: realisees, color: 'text-green-600' },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl bg-white p-5 shadow-sm text-center">
            <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
            <p className="mt-1 text-xs text-gray-500">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Tableau des séances */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">Chargement…</div>
        )}
        {!isLoading && seances.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <svg className="mb-3 h-10 w-10 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            <p className="text-sm font-medium text-gray-700">Aucune séance planifiée</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 rounded-xl px-4 py-2 text-xs font-semibold text-white"
              style={{ background: '#C88500' }}
            >
              Planifier la première séance
            </button>
          </div>
        )}

        {!isLoading && seances.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Date & Heure</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Vacataire</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Module / Classe</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Type</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Salle</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Durée</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Statut</th>
              </tr>
            </thead>
            <tbody>
              {seances.map((s, i) => {
                const cfg = statutConfig[s.statut]
                return (
                  <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${i === seances.length - 1 ? '' : 'border-b border-gray-50'}`}>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{formatDate(s.dateSeance)}</p>
                      <p className="text-xs text-gray-400">{s.heureDebut.slice(0, 5)} – {s.heureFin.slice(0, 5)}</p>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-900">{s.nomVacataire}</td>
                    <td className="px-5 py-4 text-gray-600">
                      <p>{s.module}</p>
                      <p className="text-xs text-gray-400">{s.classe}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{s.typeSeance ?? '—'}</td>
                    <td className="px-5 py-4 text-gray-600">{s.salle ?? '—'}</td>
                    <td className="px-5 py-4 text-right font-semibold text-gray-900">{s.duree.toFixed(1)} h</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal création séance */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-base font-bold text-gray-900">Planifier une séance</h3>
              <button onClick={resetForm} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            {lastAdded && (
              <div className="flex items-center gap-2 border-b border-green-100 bg-green-50 px-6 py-3 text-sm text-green-800">
                <svg className="h-4 w-4 text-green-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                Séance ajoutée — <span className="font-semibold">{lastAdded}</span>. Planifiez-en une autre ou fermez.
              </div>
            )}

            <div className="px-6 py-5 space-y-4">
              {/* Contrat */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Contrat (Vacataire / Module) <span className="text-red-500">*</span>
                </label>
                <select
                  value={contratId}
                  onChange={(e) => { setContratId(Number(e.target.value)); setDisponibiliteId('') }}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                >
                  <option value="">Sélectionner un contrat actif…</option>
                  {contrats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nomVacataire} — {c.module} ({c.classe})
                    </option>
                  ))}
                </select>
              </div>

              {/* Disponibilité (optionnel) */}
              {contratId !== '' && disposFiltrees.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Basé sur une disponibilité déclarée (optionnel)
                  </label>
                  <select
                    value={disponibiliteId}
                    onChange={(e) => {
                      const val = e.target.value
                      setDisponibiliteId(val !== '' ? Number(val) : '')
                      if (val !== '') {
                        const d = disposFiltrees.find((x) => x.id === Number(val))
                        if (d) {
                          setDateSeance(d.date)
                          setHeureDebut(d.heureDebut.slice(0, 5))
                          setHeureFin(d.heureFin.slice(0, 5))
                        }
                      }
                    }}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="">Aucune (saisir manuellement)</option>
                    {disposFiltrees.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.date} — {d.heureDebut.slice(0, 5)} à {d.heureFin.slice(0, 5)} ({d.nomVacataire})
                        {d.statut === 'CONFIRMEE' ? ' ✓' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Date de la séance <span className="text-red-500">*</span>
                </label>
                {contratSelectionne && (
                  <p className="mb-1.5 text-xs text-gray-500">
                    Période du contrat :{' '}
                    <span className="font-semibold text-gray-700">
                      {new Date(contratSelectionne.dateDebut + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {' → '}
                      {new Date(contratSelectionne.dateFin + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </p>
                )}
                <input
                  type="date"
                  value={dateSeance}
                  min={contratSelectionne?.dateDebut}
                  max={contratSelectionne?.dateFin}
                  onChange={(e) => setDateSeance(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                    dateHorsPeriode
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                      : 'border-gray-200 focus:border-orange-400 focus:ring-orange-100'
                  }`}
                />
                {dateHorsPeriode && (
                  <p className="mt-1 text-xs text-red-600">
                    Cette date est hors de la période du contrat.
                  </p>
                )}
              </div>

              {/* Heures */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Heure début <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={heureDebut}
                    onChange={(e) => setHeureDebut(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Heure fin <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={heureFin}
                    onChange={(e) => setHeureFin(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>

              {dureePreview && (
                <p className="text-xs text-gray-500">
                  Durée calculée : <span className="font-semibold text-gray-800">{dureePreview}</span>
                </p>
              )}

              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Type de séance</label>
                <select
                  value={typeSeance}
                  onChange={(e) => setTypeSeance(e.target.value as TypeSeance | '')}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                >
                  <option value="">Non précisé</option>
                  {typeOptions.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Salle */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Salle</label>
                <input
                  type="text"
                  value={salle}
                  onChange={(e) => setSalle(e.target.value)}
                  placeholder="Ex: Amphi B, Salle 104…"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-6 py-4">
              <button
                onClick={resetForm}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                {lastAdded ? 'Fermer' : 'Annuler'}
              </button>
              <button
                onClick={() => creer()}
                disabled={!canSubmit || creating}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-colors"
                style={{ background: '#C88500' }}
              >
                {creating ? (
                  <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>Planification…</>
                ) : lastAdded ? (
                  '+ Planifier une autre séance'
                ) : (
                  'Planifier la séance'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
