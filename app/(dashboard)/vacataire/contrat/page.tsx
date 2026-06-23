'use client'

import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vacataireService } from '@/services/vacataire.service'
import { contratService, type ContratResponse } from '@/services/contrat.service'
import { authService } from '@/services/auth.service'

const statutContratConfig = {
  ACTIF:    { label: 'Actif',    className: 'bg-green-50 text-green-700' },
  EXPIRE:   { label: 'Expiré',  className: 'bg-gray-100 text-gray-500' },
  RESILIE:  { label: 'Résilié', className: 'bg-red-50 text-red-500' },
} as const

const niveauLabel: Record<string, string> = { LICENCE: 'Licence', MASTER: 'Master' }

const statutModuleConfig: Record<string, { label: string; className: string }> = {
  NON_COMMENCE: { label: 'Non commencé', className: 'bg-gray-100 text-gray-500' },
  EN_COURS:     { label: 'En cours',     className: 'bg-blue-50 text-blue-700'  },
  TERMINE:      { label: 'Terminé',      className: 'bg-green-50 text-green-700' },
}

export default function VacataireContratPage() {
  const queryClient = useQueryClient()
  const [editCoord, setEditCoord] = useState(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [signatureError, setSignatureError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Changement de mot de passe
  const [showPwd, setShowPwd] = useState(false)
  const [pwdForm, setPwdForm] = useState({ ancienMotDePasse: '', nouveauMotDePasse: '', confirmation: '' })
  const [pwdError, setPwdError] = useState<string | null>(null)
  const [pwdSuccess, setPwdSuccess] = useState(false)

  const { mutate: changerMdp, isPending: changingPwd } = useMutation({
    mutationFn: () => authService.changerMotDePasse({
      ancienMotDePasse: pwdForm.ancienMotDePasse,
      nouveauMotDePasse: pwdForm.nouveauMotDePasse,
    }),
    onSuccess: () => {
      setPwdSuccess(true)
      setPwdError(null)
      setPwdForm({ ancienMotDePasse: '', nouveauMotDePasse: '', confirmation: '' })
      setTimeout(() => { setShowPwd(false); setPwdSuccess(false) }, 2000)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Mot de passe actuel incorrect.'
      setPwdError(msg)
    },
  })

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

  const { mutate: uploadSignature, isPending: uploadingSignature } = useMutation({
    mutationFn: (file: File) => vacataireService.uploadMaSignature(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mon-dossier'] })
      setSignatureError(null)
    },
    onError: () => setSignatureError('Erreur lors de l\'upload. Réessayez.'),
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

  function soumettreChangementMdp() {
    setPwdError(null)
    if (pwdForm.nouveauMotDePasse.length < 8) {
      setPwdError('Le nouveau mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (pwdForm.nouveauMotDePasse !== pwdForm.confirmation) {
      setPwdError('Les mots de passe ne correspondent pas.')
      return
    }
    changerMdp()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      setSignatureError('Format accepté : PNG ou JPG uniquement.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setSignatureError('Fichier trop volumineux (max 2 Mo).')
      return
    }
    setSignatureError(null)
    uploadSignature(file)
  }

  async function telecharger(c: ContratResponse) {
    setDownloadingId(c.id)
    try { await contratService.telechargerPdf(c.id) }
    finally { setDownloadingId(null) }
  }

  const contratActif = contrats.find((c) => c.statut === 'ACTIF' && !c.estAvenant)
  const avenants = contrats.filter((c) => c.estAvenant && c.statut === 'ACTIF')
  const historique = contrats.filter((c) => c.statut !== 'ACTIF')

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Ma fiche de vacation</h2>
        <p className="mt-1 text-sm text-gray-500">Consultez vos contrats, vos modules et mettez à jour vos coordonnées</p>
      </div>

      {loadingDossier || loadingContrats ? (
        <div className="flex items-center justify-center py-16 text-sm text-gray-400">Chargement…</div>
      ) : (
        <div className="space-y-6">

          {/* ── Ligne haute : infos perso + signature ── */}
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
                  <InfoRow label="Profil" value={dossier.typeVacataire === 'PROFESSEUR_UNIVERSITAIRE' ? 'Professeur universitaire' : 'Vacataire standard'} />
                </div>
              )}
            </div>

            {/* Signature électronique */}
            <div className="rounded-2xl bg-white p-6 shadow-sm flex flex-col">
              <h3 className="mb-4 text-base font-bold text-gray-900">Signature électronique</h3>
              {dossier?.signatureUploaded ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 py-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                    <svg className="h-7 w-7 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-green-700">Signature enregistrée</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingSignature}
                    className="text-xs text-gray-400 underline hover:text-gray-600 transition-colors"
                  >
                    Remplacer ma signature
                  </button>
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 py-8 hover:border-amber-300 transition-colors">
                  <svg className="h-10 w-10 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12l7-7 7 7" />
                  </svg>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">Uploadez votre signature</p>
                    <p className="mt-0.5 text-xs text-gray-400">PNG ou JPG · max 2 Mo</p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingSignature}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
                    style={{ background: '#C88500' }}
                  >
                    {uploadingSignature ? 'Upload en cours…' : 'Choisir un fichier'}
                  </button>
                </div>
              )}
              {signatureError && <p className="mt-2 text-xs text-red-600">{signatureError}</p>}
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleFileChange} />
            </div>
          </div>

          {/* ── Contrat principal actif ── */}
          {contratActif && (
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Contrat en cours — {contratActif.anneeAcademique}</h3>
                  <p className="mt-0.5 text-xs text-gray-400">
                    Du {new Date(contratActif.dateDebut).toLocaleDateString('fr-FR')} au {new Date(contratActif.dateFin).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <button
                  onClick={() => telecharger(contratActif)}
                  disabled={downloadingId === contratActif.id}
                  className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
                  style={{ background: '#C88500' }}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {downloadingId === contratActif.id ? 'Génération…' : 'PDF'}
                </button>
              </div>

              <ModulesTable modules={contratActif.modules ?? []} />
            </div>
          )}

          {/* ── Avenants actifs ── */}
          {avenants.length > 0 && (
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-bold text-gray-900">
                Avenant{avenants.length > 1 ? 's' : ''} en cours
              </h3>
              <div className="space-y-4">
                {avenants.map((av) => (
                  <div key={av.id} className="rounded-xl border border-purple-100 bg-purple-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="inline-flex rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                        Avenant #{av.id}
                      </span>
                      <button
                        onClick={() => telecharger(av)}
                        disabled={downloadingId === av.id}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                        style={{ background: '#C88500' }}
                      >
                        {downloadingId === av.id ? '…' : 'PDF'}
                      </button>
                    </div>
                    <ModulesTable modules={av.modules ?? []} compact />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Coordonnées bancaires ── */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Coordonnées bancaires</h3>
              {!editCoord && (
                <button onClick={ouvrirEdit} className="rounded-xl px-4 py-2 text-xs font-semibold text-white" style={{ background: '#C88500' }}>
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
                {([
                  { label: 'Téléphone', key: 'telephone', type: 'tel' },
                  { label: 'Adresse', key: 'adresse', type: 'text' },
                  { label: 'Nom de la banque', key: 'nomBanque', type: 'text' },
                  { label: 'Code banque', key: 'codeBanque', type: 'text' },
                  { label: 'Code guichet', key: 'codeGuichet', type: 'text' },
                  { label: 'Numéro de compte', key: 'numeroCompte', type: 'text' },
                  { label: 'RIB', key: 'rib', type: 'text' },
                ] as const).map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <input
                      type={type}
                      value={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>
                ))}
                <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
                  <button onClick={() => setEditCoord(false)} className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100">
                    Annuler
                  </button>
                  <button onClick={() => sauvegarder()} disabled={isPending}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: '#C88500' }}>
                    {isPending ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Historique ── */}
          {/* ── Mot de passe ── */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Mot de passe</h3>
              {!showPwd && (
                <button onClick={() => { setShowPwd(true); setPwdError(null); setPwdSuccess(false) }}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-white"
                  style={{ background: '#C88500' }}>
                  Changer
                </button>
              )}
            </div>

            {!showPwd && (
              <p className="text-sm text-gray-400">Cliquez sur "Changer" pour modifier votre mot de passe.</p>
            )}

            {showPwd && (
              <div className="space-y-3">
                {pwdSuccess && (
                  <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                    Mot de passe modifié avec succès !
                  </div>
                )}
                {pwdError && (
                  <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{pwdError}</div>
                )}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">Mot de passe actuel</label>
                  <input type="password" value={pwdForm.ancienMotDePasse}
                    onChange={(e) => setPwdForm((f) => ({ ...f, ancienMotDePasse: e.target.value }))}
                    placeholder="Votre mot de passe actuel"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">Nouveau mot de passe</label>
                  <input type="password" value={pwdForm.nouveauMotDePasse}
                    onChange={(e) => setPwdForm((f) => ({ ...f, nouveauMotDePasse: e.target.value }))}
                    placeholder="Minimum 8 caractères"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">Confirmer le nouveau mot de passe</label>
                  <input type="password" value={pwdForm.confirmation}
                    onChange={(e) => setPwdForm((f) => ({ ...f, confirmation: e.target.value }))}
                    placeholder="Répétez le nouveau mot de passe"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
                </div>
                <div className="flex items-center justify-end gap-3 pt-1">
                  <button onClick={() => setShowPwd(false)}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100">
                    Annuler
                  </button>
                  <button onClick={soumettreChangementMdp} disabled={changingPwd}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: '#C88500' }}>
                    {changingPwd ? 'Modification…' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {historique.length > 0 && (
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-bold text-gray-900">Historique des contrats</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Année</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Modules</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Statut</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {historique.map((c, i) => {
                    const cfg = statutContratConfig[c.statut]
                    return (
                      <tr key={c.id} className={`hover:bg-gray-50 ${i === historique.length - 1 ? '' : 'border-b border-gray-50'}`}>
                        <td className="px-3 py-3 font-medium text-gray-900">{c.anneeAcademique}</td>
                        <td className="px-3 py-3 text-gray-500 text-xs">
                          {(c.modules ?? []).map((m) => m.nomModule).join(', ') || '—'}
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button onClick={() => telecharger(c)} disabled={downloadingId === c.id}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                            style={{ background: '#C88500' }}>
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

/* ── Tableau des modules ── */
function ModulesTable({ modules, compact = false }: {
  modules: { id: number; nomModule: string; niveau: string; classes: string[]; volumeHorairePrevisionnel?: number; heuresEffectuees?: number; heuresRestantes?: number; statut: string }[]
  compact?: boolean
}) {
  if (modules.length === 0) {
    return <p className="text-xs text-gray-400">Aucun module associé.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Module</th>
            <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Classes</th>
            {!compact && <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Volume</th>}
            {!compact && <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Effectuées</th>}
            {!compact && <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Restantes</th>}
            <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 pl-3">Statut</th>
          </tr>
        </thead>
        <tbody>
          {modules.map((m, i) => {
            const pct = m.volumeHorairePrevisionnel && m.heuresEffectuees != null
              ? Math.min(100, Math.round((m.heuresEffectuees / m.volumeHorairePrevisionnel) * 100))
              : 0
            const sc = statutModuleConfig[m.statut] ?? { label: m.statut, className: 'bg-gray-100 text-gray-500' }
            return (
              <tr key={m.id} className={`${i === modules.length - 1 ? '' : 'border-b border-gray-50'}`}>
                <td className="py-3 pr-3">
                  <p className="font-medium text-gray-900">{m.nomModule}</p>
                  <p className="text-xs text-gray-400">{niveauLabel[m.niveau] ?? m.niveau}</p>
                  {!compact && m.volumeHorairePrevisionnel != null && (
                    <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#C88500' }} />
                    </div>
                  )}
                </td>
                <td className="py-3 pr-3 text-xs text-gray-500">{m.classes.join(', ')}</td>
                {!compact && <td className="py-3 pr-3 text-right text-gray-700">{m.volumeHorairePrevisionnel ?? '—'} h</td>}
                {!compact && <td className="py-3 pr-3 text-right text-gray-700">{m.heuresEffectuees ?? 0} h</td>}
                {!compact && <td className="py-3 pr-3 text-right text-gray-700">{m.heuresRestantes ?? '—'} h</td>}
                <td className="py-3 pl-3">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${sc.className}`}>{sc.label}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
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
