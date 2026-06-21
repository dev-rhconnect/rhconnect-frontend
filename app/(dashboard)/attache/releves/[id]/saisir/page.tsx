'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { releveService, type LigneHeureResponse } from '@/services/releve.service'
import { seanceService, type SeanceProgrammeeResponse } from '@/services/seance.service'

const statutLigneConfig = {
  SAISIE:   { label: 'Saisie',   className: 'bg-gray-100 text-gray-600' },
  VALIDEE:  { label: 'Validée',  className: 'bg-green-50 text-green-700' },
  REJETEE:  { label: 'Absence',  className: 'bg-red-50 text-red-500' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })
}

function formatHeure(t: string) {
  return t.slice(0, 5)
}

export default function SaisirSeancePage() {
  const { id } = useParams<{ id: string }>()
  const feuilleId = Number(id)
  const queryClient = useQueryClient()

  // État saisie manuelle
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [heureDebut, setHeureDebut] = useState('08:00')
  const [heureFin, setHeureFin] = useState('10:00')
  const [observation, setObservation] = useState('')
  const [absence, setAbsence] = useState(false)
  const [erreurManuelle, setErreurManuelle] = useState('')

  // État import séances
  const [selection, setSelection] = useState<Set<number>>(new Set())
  const [erreurImport, setErreurImport] = useState('')

  const { data: releve, isLoading } = useQuery({
    queryKey: ['releve', feuilleId],
    queryFn: () => releveService.trouverParId(feuilleId),
  })

  const { data: seancesDisponibles = [] } = useQuery({
    queryKey: ['seances-realisees', releve?.contratId, releve?.periode],
    queryFn: () => seanceService.realiseesPourPeriode(releve!.contratId, releve!.periode),
    enabled: !!releve?.contratId && !!releve?.periode,
  })

  const { mutate: importer, isPending: importing } = useMutation({
    mutationFn: () => releveService.importerSeances(feuilleId, Array.from(selection)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['releve', feuilleId] })
      queryClient.invalidateQueries({ queryKey: ['mes-releves'] })
      setSelection(new Set())
      setErreurImport('')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setErreurImport(msg ?? 'Erreur lors de l\'import.')
    },
  })

  const { mutate: ajouterLigne, isPending } = useMutation({
    mutationFn: () =>
      releveService.ajouterLigne(feuilleId, {
        feuilleHeureId: feuilleId,
        date,
        heureDebut: heureDebut + ':00',
        heureFin: heureFin + ':00',
        observation: observation || undefined,
        absence,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['releve', feuilleId] })
      queryClient.invalidateQueries({ queryKey: ['mes-releves'] })
      setObservation('')
      setAbsence(false)
      setErreurManuelle('')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setErreurManuelle(msg ?? 'Erreur lors de la saisie.')
    },
  })

  function toggleSelection(id: number) {
    setSelection((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selection.size === seancesDisponibles.length) {
      setSelection(new Set())
    } else {
      setSelection(new Set(seancesDisponibles.map((s) => s.id)))
    }
  }

  function handleSubmitManuel(e: React.FormEvent) {
    e.preventDefault()
    setErreurManuelle('')
    if (!absence && heureDebut >= heureFin) {
      setErreurManuelle("L'heure de fin doit être après l'heure de début.")
      return
    }
    ajouterLigne()
  }

  const lignes = releve?.lignes ?? []
  const totalSaisies = lignes.filter((l) => l.statut !== 'REJETEE').reduce((acc, l) => acc + (l.duree ?? 0), 0)
  const estSoumissible = releve?.statut === 'EN_COURS' && lignes.length > 0

  // Séances déjà présentes (par date+heureDebut pour éviter les doublons visuels)
  const dejaSaisies = new Set(lignes.map((l) => `${l.date}_${l.heureDebut?.slice(0, 5)}`))
  const seancesNonImportees = seancesDisponibles.filter(
    (s) => !dejaSaisies.has(`${s.dateSeance}_${formatHeure(s.heureDebut)}`)
  )

  if (isLoading) {
    return <div className="flex items-center justify-center py-24 text-sm text-gray-400">Chargement…</div>
  }

  if (!releve) {
    return <div className="flex items-center justify-center py-24 text-sm text-red-500">Relevé introuvable.</div>
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* En-tête */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link
            href="/attache/releves"
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Mes relevés
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">{releve.nomVacataire}</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {releve.module} — {releve.classe} — {releve.periode}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Heures saisies</p>
          <p className="text-2xl font-bold text-gray-900">{totalSaisies.toFixed(1)} h</p>
          {releve.volumeHorairePrevisionnel && (
            <p className="text-xs text-gray-400">sur {releve.volumeHorairePrevisionnel} h prévues</p>
          )}
        </div>
      </div>

      {releve.statut === 'EN_COURS' && (
        <div className="space-y-5 mb-6">

          {/* ── Import depuis séances validées ── */}
          {seancesNonImportees.length > 0 && (
            <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Séances réalisées du mois</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Cochez les séances à inclure dans ce relevé</p>
                </div>
                <button
                  onClick={toggleAll}
                  className="text-xs font-semibold text-amber-600 hover:underline"
                >
                  {selection.size === seancesNonImportees.length ? 'Tout décocher' : 'Tout cocher'}
                </button>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="w-10 px-4 py-3" />
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Horaires</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Durée</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Salle</th>
                  </tr>
                </thead>
                <tbody>
                  {seancesNonImportees.map((s: SeanceProgrammeeResponse, i) => {
                    const checked = selection.has(s.id)
                    return (
                      <tr
                        key={s.id}
                        onClick={() => toggleSelection(s.id)}
                        className={`cursor-pointer transition-colors ${i < seancesNonImportees.length - 1 ? 'border-b border-gray-50' : ''} ${checked ? 'bg-amber-50' : 'hover:bg-gray-50'}`}
                      >
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSelection(s.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 rounded border-gray-300 accent-amber-500"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{formatDate(s.dateSeance)}</td>
                        <td className="px-4 py-3 text-gray-600">{formatHeure(s.heureDebut)} – {formatHeure(s.heureFin)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">{s.duree.toFixed(1)} h</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{s.typeSeance ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{s.salle ?? '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              <div className="border-t border-gray-100 px-5 py-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {selection.size > 0
                    ? `${selection.size} séance${selection.size > 1 ? 's' : ''} sélectionnée${selection.size > 1 ? 's' : ''} — ${
                        Array.from(selection).reduce((acc, sid) => {
                          const s = seancesNonImportees.find((x) => x.id === sid)
                          return acc + (s?.duree ?? 0)
                        }, 0).toFixed(1)
                      } h`
                    : 'Aucune séance sélectionnée'}
                </p>
                {erreurImport && <p className="text-xs text-red-500">{erreurImport}</p>}
                <button
                  onClick={() => importer()}
                  disabled={selection.size === 0 || importing}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-40"
                  style={{ background: '#C88500' }}
                >
                  {importing ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  )}
                  Importer les séances cochées
                </button>
              </div>
            </div>
          )}

          {/* ── Saisie manuelle ── */}
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-5 py-4">
              <h3 className="text-base font-bold text-gray-900">Saisie manuelle</h3>
              <p className="text-xs text-gray-400 mt-0.5">Pour les séances non planifiées dans l'emploi du temps</p>
            </div>
            <form onSubmit={handleSubmitManuel} className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-amber-400"
                  />
                </div>
                {!absence && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Heure début</label>
                      <input
                        type="time"
                        value={heureDebut}
                        onChange={(e) => setHeureDebut(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Heure fin</label>
                      <input
                        type="time"
                        value={heureFin}
                        onChange={(e) => setHeureFin(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </>
                )}
              </div>

              {!absence && heureDebut < heureFin && (
                <div className="rounded-xl bg-orange-50 px-4 py-2 text-sm">
                  <span className="text-gray-500">Durée calculée : </span>
                  <span className="font-bold text-gray-900">
                    {(() => {
                      const [dh, dm] = heureDebut.split(':').map(Number)
                      const [fh, fm] = heureFin.split(':').map(Number)
                      const min = (fh * 60 + fm) - (dh * 60 + dm)
                      return `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}`
                    })()}
                  </span>
                </div>
              )}

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observation</label>
                  <input
                    type="text"
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    placeholder="Ex: Cours de rattrapage…"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer rounded-xl border border-gray-200 px-4 py-2.5 hover:bg-gray-50 transition-colors mt-6">
                  <input
                    type="checkbox"
                    checked={absence}
                    onChange={(e) => setAbsence(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 accent-amber-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Absence</span>
                </label>
              </div>

              {erreurManuelle && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{erreurManuelle}</div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-50"
                style={{ background: absence ? '#DC2626' : '#C88500' }}
              >
                {isPending ? 'Enregistrement…' : absence ? "Signaler l'absence" : 'Enregistrer la séance'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Séances enregistrées ── */}
      <div className={releve.statut !== 'EN_COURS' ? '' : ''}>
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h3 className="text-base font-bold text-gray-900">
              Séances enregistrées
              <span className="ml-2 text-sm font-normal text-gray-400">({lignes.length})</span>
            </h3>
            {estSoumissible && (
              <Link href="/attache/releves" className="text-xs font-semibold text-amber-600 hover:underline">
                Soumettre depuis la liste →
              </Link>
            )}
          </div>

          {lignes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-gray-400">Aucune séance enregistrée pour ce relevé.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Horaires</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Durée</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Statut</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Note</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l: LigneHeureResponse, i) => {
                  const cfg = statutLigneConfig[l.statut]
                  return (
                    <tr key={l.id} className={`hover:bg-gray-50 transition-colors ${i === lignes.length - 1 ? '' : 'border-b border-gray-50'}`}>
                      <td className="px-5 py-3 font-medium text-gray-900">
                        {new Date(l.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })}
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {l.statut === 'REJETEE' ? '—' : `${l.heureDebut?.slice(0, 5)} – ${l.heureFin?.slice(0, 5)}`}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900">
                        {l.statut === 'REJETEE' ? '—' : `${l.duree?.toFixed(1) ?? 0} h`}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.className}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs max-w-xs truncate">
                        {l.observation ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
