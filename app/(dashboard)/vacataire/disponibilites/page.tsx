'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { disponibiliteService, type DisponibiliteResponse } from '@/services/disponibilite.service'

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

function formatHeure(t: string) {
  return t.slice(0, 5)
}

export default function VacataireDisponibilitesPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [date, setDate] = useState('')
  const [heureDebut, setHeureDebut] = useState('')
  const [heureFin, setHeureFin] = useState('')

  const { data: disponibilites = [], isLoading, isError } = useQuery({
    queryKey: ['mes-disponibilites'],
    queryFn: disponibiliteService.mesDisponibilites,
  })

  const { mutate: declarer, isPending: declaring } = useMutation({
    mutationFn: () => disponibiliteService.declarer({ date, heureDebut, heureFin }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mes-disponibilites'] })
      setShowForm(false)
      setDate('')
      setHeureDebut('')
      setHeureFin('')
    },
  })

  const canSubmit = date && heureDebut && heureFin

  // Calcul durée preview
  let dureePreview = ''
  if (heureDebut && heureFin) {
    const [h1, m1] = heureDebut.split(':').map(Number)
    const [h2, m2] = heureFin.split(':').map(Number)
    const minutes = (h2 * 60 + m2) - (h1 * 60 + m1)
    if (minutes > 0) dureePreview = `${(minutes / 60).toFixed(1)} h`
  }

  const proposees = disponibilites.filter((d) => d.statut === 'PROPOSEE').length
  const confirmees = disponibilites.filter((d) => d.statut === 'CONFIRMEE').length

  return (
    <div>
      {/* En-tête */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mes disponibilités</h2>
          <p className="mt-1 text-sm text-gray-500">
            Déclarez vos créneaux disponibles pour que le Responsable de Programme puisse planifier vos séances.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          style={{ background: '#C88500' }}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Déclarer un créneau
        </button>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: 'Total déclarés', value: disponibilites.length, color: 'text-gray-900' },
          { label: 'En attente', value: proposees, color: 'text-amber-600' },
          { label: 'Confirmés', value: confirmees, color: 'text-green-600' },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl bg-white p-5 shadow-sm text-center">
            <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
            <p className="mt-1 text-xs text-gray-500">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
        <p className="text-xs text-amber-700">
          Déclarez vos créneaux de disponibilité. Le Responsable de Programme les confirmera et créera les séances définitives dans l'emploi du temps.
        </p>
      </div>

      {/* Liste */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">Chargement…</div>
        )}
        {isError && (
          <div className="flex items-center justify-center py-16 text-sm text-red-500">Erreur de chargement.</div>
        )}
        {!isLoading && !isError && disponibilites.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="mb-3 h-12 w-12 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
            </svg>
            <p className="text-sm font-medium text-gray-900">Aucun créneau déclaré</p>
            <p className="mt-1 text-xs text-gray-500 max-w-xs">
              Déclarez vos disponibilités pour permettre au RP de planifier vos séances.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 rounded-xl px-4 py-2 text-xs font-semibold text-white"
              style={{ background: '#C88500' }}
            >
              Déclarer un créneau
            </button>
          </div>
        )}

        {!isLoading && !isError && disponibilites.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Date</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Créneau</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Durée</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Statut</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Déclaré le</th>
              </tr>
            </thead>
            <tbody>
              {disponibilites.map((d, i) => {
                const [h1, m1] = d.heureDebut.split(':').map(Number)
                const [h2, m2] = d.heureFin.split(':').map(Number)
                const duree = ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60

                return (
                  <tr key={d.id} className={`hover:bg-gray-50 transition-colors ${i === disponibilites.length - 1 ? '' : 'border-b border-gray-50'}`}>
                    <td className="px-5 py-4 font-medium text-gray-900">{formatDate(d.date)}</td>
                    <td className="px-5 py-4 text-gray-700">
                      {formatHeure(d.heureDebut)} → {formatHeure(d.heureFin)}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-gray-800">
                      {duree > 0 ? `${duree.toFixed(1)} h` : '—'}
                    </td>
                    <td className="px-5 py-4">
                      {d.statut === 'CONFIRMEE' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          Confirmé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                          En attente
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500">
                      {new Date(d.dateCreation).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal déclaration */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-base font-bold text-gray-900">Déclarer un créneau</h3>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </div>

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
                  Durée : <span className="font-semibold text-gray-800">{dureePreview}</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                Annuler
              </button>
              <button
                onClick={() => declarer()}
                disabled={!canSubmit || declaring}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: '#C88500' }}
              >
                {declaring ? 'Envoi…' : 'Déclarer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
