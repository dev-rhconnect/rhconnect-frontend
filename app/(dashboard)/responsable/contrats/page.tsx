'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contratService, type ContratResponse } from '@/services/contrat.service'
import { vacataireService } from '@/services/vacataire.service'

const statutConfig: Record<string, { label: string; className: string }> = {
  ACTIF:    { label: 'Actif',    className: 'bg-green-50 text-green-700'  },
  EXPIRE:   { label: 'Expiré',   className: 'bg-gray-100 text-gray-500'   },
  RESILIE:  { label: 'Résilié',  className: 'bg-red-50 text-red-600'      },
}

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function NouveauContratModal({
  onClose,
  onConfirm,
  saving,
}: {
  onClose: () => void
  onConfirm: (data: {
    vacataireId: number
    module: string
    classe: string
    volumeHorairePrevisionnel: number
    tauxHoraire: number
    dateDebut: string
    dateFin: string
  }) => void
  saving: boolean
}) {
  const { data: vacataires = [] } = useQuery({
    queryKey: ['vacataires'],
    queryFn: vacataireService.listerTous,
  })

  const actifs = vacataires.filter((v) => v.statut === 'ACTIF')

  const [vacataireId, setVacataireId] = useState<number | ''>('')
  const [module, setModule] = useState('')
  const [classe, setClasse] = useState('')
  const [volume, setVolume] = useState('')
  const [taux, setTaux] = useState('')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')

  const valid = vacataireId !== '' && module.trim() && classe.trim() &&
    volume && taux && dateDebut && dateFin

  const montantTotal = volume && taux
    ? (parseFloat(volume) * parseFloat(taux)).toLocaleString('fr-FR')
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Nouveau contrat</h3>
            <p className="mt-0.5 text-xs text-gray-500">Associer un module et une classe à un vacataire</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-4">
          {/* Vacataire */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
              Vacataire <span className="text-red-500">*</span>
            </label>
            <select
              value={vacataireId}
              onChange={(e) => setVacataireId(e.target.value !== '' ? Number(e.target.value) : '')}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
            >
              <option value="">Sélectionner un vacataire…</option>
              {actifs.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.prenom} {v.nom} — {v.specialite}
                </option>
              ))}
            </select>
          </div>

          {/* Module + Classe */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Module <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={module}
                onChange={(e) => setModule(e.target.value)}
                placeholder="Ex : Gestion de projet"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Classe <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={classe}
                onChange={(e) => setClasse(e.target.value)}
                placeholder="Ex : L3 Info, M1 GRH"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>
          </div>

          {/* Volume + Taux */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Volume horaire prévisionnel (h) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                placeholder="Ex : 30"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Taux horaire (FCFA) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={taux}
                onChange={(e) => setTaux(e.target.value)}
                placeholder="Ex : 15000"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>
          </div>

          {montantTotal && (
            <p className="rounded-xl bg-orange-50 px-4 py-2.5 text-xs text-gray-700">
              Montant prévisionnel total :{' '}
              <span className="font-bold" style={{ color: '#C88500' }}>{montantTotal} FCFA</span>
            </p>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Date de début <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Date de fin <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dateFin}
                min={dateDebut}
                onChange={(e) => setDateFin(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
            Annuler
          </button>
          <button
            onClick={() =>
              valid &&
              onConfirm({
                vacataireId: vacataireId as number,
                module,
                classe,
                volumeHorairePrevisionnel: parseFloat(volume),
                tauxHoraire: parseFloat(taux),
                dateDebut,
                dateFin,
              })
            }
            disabled={!valid || saving}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
            style={{ background: '#C88500' }}
          >
            {saving ? (
              <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>Enregistrement…</>
            ) : (
              <><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>Créer le contrat</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ContratsPage() {
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const [filtreStatut, setFiltreStatut] = useState<string>('ACTIF')

  const { data: contrats = [], isLoading, isError } = useQuery({
    queryKey: ['contrats-tous'],
    queryFn: contratService.listerTous,
  })

  const { mutate: creer, isPending: creating } = useMutation({
    mutationFn: contratService.creer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contrats-tous'] })
      queryClient.invalidateQueries({ queryKey: ['contrats-actifs'] })
      setShowCreate(false)
    },
  })

  const filtered = contrats.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch =
      c.nomVacataire.toLowerCase().includes(q) ||
      c.module.toLowerCase().includes(q) ||
      c.classe.toLowerCase().includes(q)
    const matchStatut = filtreStatut === '' || c.statut === filtreStatut
    return matchSearch && matchStatut
  })

  const actifs  = contrats.filter((c) => c.statut === 'ACTIF').length
  const expires = contrats.filter((c) => c.statut === 'EXPIRE').length
  const resilies = contrats.filter((c) => c.statut === 'RESILIE').length

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contrats</h2>
          <p className="mt-1 text-sm text-gray-500">
            {contrats.length} contrat{contrats.length !== 1 ? 's' : ''} — {actifs} actif{actifs !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          style={{ background: '#C88500' }}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nouveau contrat
        </button>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: 'Actifs',   value: actifs,   color: 'text-green-600',  bg: 'bg-green-50'  },
          { label: 'Expirés',  value: expires,  color: 'text-gray-500',   bg: 'bg-gray-100'  },
          { label: 'Résiliés', value: resilies, color: 'text-red-600',    bg: 'bg-red-50'    },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl bg-white p-5 shadow-sm text-center cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setFiltreStatut(filtreStatut === k.label.toUpperCase() ? '' : k.label.toUpperCase())}
          >
            <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
            <p className="mt-1 text-xs text-gray-500">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres + recherche */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher vacataire, module, classe…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400"
          />
        </div>
        <select
          value={filtreStatut}
          onChange={(e) => setFiltreStatut(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-amber-400"
        >
          <option value="">Tous les statuts</option>
          <option value="ACTIF">Actifs seulement</option>
          <option value="EXPIRE">Expirés</option>
          <option value="RESILIE">Résiliés</option>
        </select>
      </div>

      {/* Tableau */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        {isLoading && <div className="flex items-center justify-center py-16 text-sm text-gray-400">Chargement…</div>}
        {isError && <div className="flex items-center justify-center py-16 text-sm text-red-500">Erreur de chargement.</div>}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="mb-3 h-10 w-10 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <p className="text-sm font-medium text-gray-900">
              {search || filtreStatut ? 'Aucun résultat' : 'Aucun contrat créé'}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {search || filtreStatut ? "Essayez d'autres critères." : 'Créez le premier contrat pour commencer à planifier des séances.'}
            </p>
            {!search && !filtreStatut && (
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 rounded-xl px-4 py-2 text-xs font-semibold text-white"
                style={{ background: '#C88500' }}
              >
                + Nouveau contrat
              </button>
            )}
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Vacataire</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Module / Classe</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Volume (h)</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Taux FCFA/h</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Période</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const cfg = statutConfig[c.statut] ?? { label: c.statut, className: 'bg-gray-100 text-gray-600' }
                const initiales = c.nomVacataire.split(' ').map((p) => p[0]).slice(0, 2).join('')
                return (
                  <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${i === filtered.length - 1 ? '' : 'border-b border-gray-50'}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white uppercase" style={{ background: '#1C0800' }}>
                          {initiales}
                        </div>
                        <p className="font-semibold text-gray-900">{c.nomVacataire}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{c.module}</p>
                      <p className="text-xs text-gray-400">{c.classe}</p>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-gray-900">
                      {c.volumeHorairePrevisionnel ?? '—'}
                    </td>
                    <td className="px-5 py-4 text-right text-gray-600">
                      {c.tauxHoraire ? c.tauxHoraire.toLocaleString('fr-FR') : '—'}
                    </td>
                    <td className="px-5 py-4 text-gray-600 text-xs">
                      {formatDate(c.dateDebut)} → {formatDate(c.dateFin)}
                    </td>
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

      {showCreate && (
        <NouveauContratModal
          saving={creating}
          onClose={() => setShowCreate(false)}
          onConfirm={(data) => creer(data)}
        />
      )}
    </div>
  )
}
