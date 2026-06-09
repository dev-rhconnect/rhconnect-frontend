'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vacataireService } from '@/services/vacataire.service'
import { contratService, type ContratResponse } from '@/services/contrat.service'

const statutContratConfig = {
  ACTIF:    { label: 'Actif',    className: 'bg-green-50 text-green-700' },
  EXPIRE:   { label: 'Expiré',  className: 'bg-gray-100 text-gray-500' },
  RESILIE:  { label: 'Résilié', className: 'bg-red-50 text-red-500' },
} as const

export default function VacataireContratPage() {
  const queryClient = useQueryClient()
  const [editCoord, setEditCoord] = useState(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  const { data: dossier, isLoading: loadingDossier } = useQuery({
    queryKey: ['mon-dossier'],
    queryFn: vacataireService.monDossier,
  })

  const { data: contrats = [], isLoading: loadingContrats } = useQuery({
    queryKey: ['mes-contrats'],
    queryFn: contratService.monContrat,
  })

  const [form, setForm] = useState({
    telephone: '', adresse: '', nomBanque: '',
    codeBanque: '', codeGuichet: '', numeroCompte: '', rib: '',
  })

  const { mutate: sauvegarder, isPending } = useMutation({
    mutationFn: () => vacataireService.mettreAJourCoordonnees(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mon-dossier'] })
      setEditCoord(false)
    },
  })

  function ouvrirEdit() {
    if (dossier) {
      setForm({
        telephone: dossier.telephone ?? '',
        adresse: dossier.adresse ?? '',
        nomBanque: dossier.nomBanque ?? '',
        codeBanque: '',
        codeGuichet: '',
        numeroCompte: '',
        rib: dossier.rib ?? '',
      })
    }
    setEditCoord(true)
  }

  async function telecharger(c: ContratResponse) {
    setDownloadingId(c.id)
    try { await contratService.telechargerPdf(c.id) }
    finally { setDownloadingId(null) }
  }

  const contratActif = contrats.find((c) => c.statut === 'ACTIF')

  return (
    <div>
      {/* En-tête */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Ma fiche de vacation</h2>
        <p className="mt-1 text-sm text-gray-500">Consultez vos contrats et mettez à jour vos coordonnées</p>
      </div>

      {loadingDossier || loadingContrats ? (
        <div className="flex items-center justify-center py-16 text-sm text-gray-400">Chargement…</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Infos personnelles */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-bold text-gray-900">Informations personnelles</h3>
            {dossier && (
              <div className="space-y-3 text-sm">
                <InfoRow label="Nom complet" value={`${dossier.prenom} ${dossier.nom}`} />
                <InfoRow label="Email" value={dossier.email} />
                <InfoRow label="Spécialité" value={dossier.specialite} />
                <InfoRow label="Téléphone" value={dossier.telephone} />
                <InfoRow label="Adresse" value={dossier.adresse} />
                <div className="flex items-center justify-between pt-2">
                  <span className="text-gray-500">Signature électronique</span>
                  {dossier.signatureUploaded ? (
                    <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">Uploadée</span>
                  ) : (
                    <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-600">En attente</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Contrat actif */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-bold text-gray-900">Contrat en cours</h3>
            {contratActif ? (
              <div className="space-y-3 text-sm">
                <InfoRow label="Module" value={contratActif.module} />
                <InfoRow label="Classe" value={contratActif.classe} />
                <InfoRow label="Volume horaire" value={`${contratActif.volumeHorairePrevisionnel ?? '—'} h`} />
                <InfoRow label="Taux horaire" value={contratActif.tauxHoraire ? `${contratActif.tauxHoraire.toLocaleString('fr-FR')} FCFA` : '—'} />
                <InfoRow label="Du" value={new Date(contratActif.dateDebut).toLocaleDateString('fr-FR')} />
                <InfoRow label="Au" value={new Date(contratActif.dateFin).toLocaleDateString('fr-FR')} />
                <div className="pt-2">
                  <button
                    onClick={() => telecharger(contratActif)}
                    disabled={downloadingId === contratActif.id}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-colors"
                    style={{ background: '#C88500' }}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    {downloadingId === contratActif.id ? 'Génération…' : 'Télécharger mon contrat PDF'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-gray-400">Aucun contrat actif pour le moment.</p>
              </div>
            )}
          </div>

          {/* Coordonnées bancaires */}
          <div className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Coordonnées bancaires</h3>
              {!editCoord && (
                <button
                  onClick={ouvrirEdit}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-white transition-colors"
                  style={{ background: '#C88500' }}
                >
                  Modifier
                </button>
              )}
            </div>

            {!editCoord && dossier && (
              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <InfoRow label="Banque" value={dossier.nomBanque} />
                <InfoRow label="RIB" value={dossier.rib} />
              </div>
            )}

            {editCoord && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  { label: 'Téléphone', key: 'telephone', type: 'tel' },
                  { label: 'Adresse', key: 'adresse', type: 'text' },
                  { label: 'Nom de la banque', key: 'nomBanque', type: 'text' },
                  { label: 'Code banque', key: 'codeBanque', type: 'text' },
                  { label: 'Code guichet', key: 'codeGuichet', type: 'text' },
                  { label: 'Numéro de compte', key: 'numeroCompte', type: 'text' },
                  { label: 'RIB', key: 'rib', type: 'text' },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <input
                      type={type}
                      value={form[key as keyof typeof form]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>
                ))}
                <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setEditCoord(false)}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => sauvegarder()}
                    disabled={isPending}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: '#C88500' }}
                  >
                    {isPending ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Historique contrats */}
          {contrats.length > 1 && (
            <div className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
              <h3 className="mb-4 text-base font-bold text-gray-900">Historique des contrats</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Module</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Période</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Statut</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {contrats.map((c, i) => {
                    const cfg = statutContratConfig[c.statut]
                    return (
                      <tr key={c.id} className={`hover:bg-gray-50 ${i === contrats.length - 1 ? '' : 'border-b border-gray-50'}`}>
                        <td className="px-3 py-3 font-medium text-gray-900">{c.module} — {c.classe}</td>
                        <td className="px-3 py-3 text-gray-600">
                          {new Date(c.dateDebut).toLocaleDateString('fr-FR')} → {new Date(c.dateFin).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            onClick={() => telecharger(c)}
                            disabled={downloadingId === c.id}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                            style={{ background: '#C88500' }}
                          >
                            {downloadingId === c.id ? '…' : 'PDF'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value ?? '—'}</span>
    </div>
  )
}
