'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vacataireService } from '@/services/vacataire.service'
import { contratService, type ContratModuleRequest, type ContratModuleResponse, type NiveauEnseignement } from '@/services/contrat.service'
import { api } from '@/services/api'

/* ── Types locaux ── */
type MaquetteEntry = { id: number; classeNom: string; classeFiliere: string; moduleNom: string; volumeHoraire: number }
type NouveauModuleLigne = { nomModule: string; classes: string[]; niveau: string; vhAuto: number; troncCommun: boolean }

const NIVEAUX = ['L1', 'L2', 'L3', 'MASTER', 'MASTER_1', 'MASTER_2', 'DUT']

function deriveNiveauFromNom(classeNom: string): string {
  const u = classeNom.toUpperCase()
  if (u.includes('MASTER_2') || u.includes('MASTER2') || u.includes('M2')) return 'MASTER_2'
  if (u.includes('MASTER_1') || u.includes('MASTER1') || u.includes('M1')) return 'MASTER_1'
  if (u.includes('MASTER')) return 'MASTER'
  if (u.includes('L3')) return 'L3'
  if (u.includes('L2')) return 'L2'
  if (u.includes('L1')) return 'L1'
  if (u.includes('DUT')) return 'DUT'
  return ''
}

/* ── Page principale ── */
export default function DossierVacatairePage() {
  const params = useParams()
  const vacataireId = Number(params.id)
  const queryClient = useQueryClient()
  const router = useRouter()
  const [showContratModal, setShowContratModal] = useState(false)
  const [showDemarrerModal, setShowDemarrerModal] = useState<{ contratId: number; moduleId: number; nomModule: string } | null>(null)

  const { data: vacataire, isLoading: loadingVac, isError: errVac } = useQuery({
    queryKey: ['vacataire', vacataireId],
    queryFn: () => vacataireService.trouverParId(vacataireId),
  })

  const { data: contrats = [] } = useQuery({
    queryKey: ['contrats-vacataire', vacataireId],
    queryFn: () => contratService.listerParVacataire(vacataireId),
    enabled: !!vacataireId,
  })

  const { data: maquette = [], isLoading: loadingMaquette } = useQuery({
    queryKey: ['maquette'],
    queryFn: () => api.get<MaquetteEntry[]>('/maquette').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })

  const anneeEnCours = computeAnneeAcademique(new Date())
  const contratEnCours = contrats.find(c => c.anneeAcademique === anneeEnCours && c.statut === 'ACTIF')

  const { mutate: demarrerModule, isPending: demarrantModule } = useMutation({
    mutationFn: ({ contratId, moduleId, date }: { contratId: number; moduleId: number; date: string }) =>
      contratService.demarrerModule(contratId, moduleId, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contrats-vacataire', vacataireId] })
      setShowDemarrerModal(null)
    },
  })

  if (loadingVac) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Chargement…</div>
  }
  if (errVac || !vacataire) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-sm text-center">
        <p className="text-red-600 font-semibold mb-2">Impossible de charger ce dossier.</p>
        <p className="text-sm text-gray-400">Vérifiez que le backend est démarré et que ce vacataire existe (ID {vacataireId}).</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Fil d'ariane */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/responsable/vacataires" className="hover:text-gray-800 transition-colors">
          Dossiers vacataires
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{vacataire.prenom} {vacataire.nom}</span>
      </div>

      {/* Header profil */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-2xl font-bold text-amber-700">
              {vacataire.prenom[0]}{vacataire.nom[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{vacataire.prenom} {vacataire.nom}</h1>
              <p className="text-sm text-gray-500">{vacataire.email}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  vacataire.statut === 'ACTIF' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {vacataire.statut}
                </span>
                {vacataire.typeVacataire && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                    {vacataire.typeVacataire === 'PROFESSEUR_UNIVERSITAIRE' ? 'Prof. universitaire' : 'Standard'}
                  </span>
                )}
                {vacataire.signatureUploaded && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">Signature ✓</span>
                )}
              </div>
            </div>
          </div>

          {/* Bouton contrat */}
          <div className="flex-shrink-0">
            {contratEnCours ? (
              <Link
                href={`/responsable/contrats/${contratEnCours.id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
              >
                Contrat {anneeEnCours} →
              </Link>
            ) : (
              <button
                onClick={() => setShowContratModal(true)}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: '#C88500' }}
              >
                + Créer contrat {anneeEnCours}
              </button>
            )}
          </div>
        </div>

        {/* Spécialités & niveaux */}
        {(vacataire.specialites && vacataire.specialites.length > 0) && (
          <div className="mt-4 border-t pt-4">
            <p className="mb-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Spécialités</p>
            <div className="flex flex-wrap gap-1.5">
              {vacataire.specialites.map(s => (
                <span key={s} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700">{s}</span>
              ))}
            </div>
          </div>
        )}
        {(vacataire.niveaux && vacataire.niveaux.length > 0) && (
          <div className="mt-3">
            <p className="mb-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Niveaux habilités</p>
            <div className="flex flex-wrap gap-1.5">
              {vacataire.niveaux.map(n => (
                <span key={n} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs text-indigo-700">{n}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contrats */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-gray-900">Contrats</h2>
        {contrats.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun contrat pour ce vacataire.</p>
        ) : (
          <div className="space-y-4">
            {contrats.map(contrat => (
              <div key={contrat.id} className={`rounded-xl border p-4 ${
                contrat.statut === 'ACTIF' ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">
                      Contrat {contrat.anneeAcademique}
                      {contrat.estAvenant && <span className="ml-2 text-xs text-gray-500">(avenant)</span>}
                    </p>
                    <p className="text-xs text-gray-500">{contrat.dateDebut} → {contrat.dateFin}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      contrat.statut === 'ACTIF' ? 'bg-green-100 text-green-700' :
                      contrat.statut === 'RESILIE' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                    }`}>{contrat.statut}</span>
                    <Link
                      href={`/responsable/contrats/${contrat.id}`}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Détails →
                    </Link>
                  </div>
                </div>

                {/* Modules du contrat */}
                {contrat.modules.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {contrat.modules.map(mod => (
                      <ModuleRow
                        key={mod.id}
                        mod={mod}
                        contratId={contrat.id}
                        contratStatut={contrat.statut}
                        onDemarrer={() => setShowDemarrerModal({ contratId: contrat.id, moduleId: mod.id, nomModule: mod.nomModule })}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modale création contrat */}
      {showContratModal && (
        <NouveauContratModal
          vacataireId={vacataireId}
          vacataire={vacataire}
          maquette={maquette}
          loadingMaquette={loadingMaquette}
          anneeEnCours={anneeEnCours}
          onClose={() => setShowContratModal(false)}
          onSuccess={() => {
            setShowContratModal(false)
            queryClient.invalidateQueries({ queryKey: ['contrats-vacataire', vacataireId] })
            queryClient.invalidateQueries({ queryKey: ['vacataire', vacataireId] })
            queryClient.invalidateQueries({ queryKey: ['contrats-tous'] })
          }}
        />
      )}

      {/* Modale démarrer module */}
      {showDemarrerModal && (
        <DemarrerModuleModal
          nomModule={showDemarrerModal.nomModule}
          isPending={demarrantModule}
          onClose={() => setShowDemarrerModal(null)}
          onConfirm={(date) => demarrerModule({ ...showDemarrerModal, date })}
        />
      )}
    </div>
  )
}

/* ── Ligne module dans la liste ── */
function ModuleRow({ mod, contratId, contratStatut, onDemarrer }: {
  mod: ContratModuleResponse
  contratId: number
  contratStatut: string
  onDemarrer: () => void
}) {
  const vh = mod.volumeHorairePrevisionnel ?? 0
  const done = mod.heuresEffectuees ?? 0
  const pct = vh > 0 ? Math.min(100, Math.round((done / vh) * 100)) : 0

  return (
    <div className="rounded-lg border border-white bg-white px-3 py-2.5 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 truncate">{mod.nomModule}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs ${
            mod.statut === 'EN_COURS' ? 'bg-blue-100 text-blue-700' :
            mod.statut === 'TERMINE' ? 'bg-green-100 text-green-700' :
            'bg-gray-100 text-gray-500'
          }`}>{mod.statut === 'NON_COMMENCE' ? 'Non commencé' : mod.statut === 'EN_COURS' ? 'En cours' : 'Terminé'}</span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          {mod.classes?.join(', ')} · {vh}h prév. · {done}h effectuées
          {mod.dateDemarrage && <span> · Démarré le {mod.dateDemarrage}</span>}
        </p>
        {vh > 0 && (
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100">
            <div className="h-1.5 rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
      {contratStatut === 'ACTIF' && mod.statut === 'NON_COMMENCE' && (
        <button
          onClick={onDemarrer}
          className="flex-shrink-0 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
        >
          Démarrer
        </button>
      )}
    </div>
  )
}

/* ── Modale création contrat ── */
function NouveauContratModal({ vacataireId, vacataire, maquette, loadingMaquette, anneeEnCours, onClose, onSuccess }: {
  vacataireId: number
  vacataire: any
  maquette: MaquetteEntry[]
  loadingMaquette: boolean
  anneeEnCours: string
  onClose: () => void
  onSuccess: () => void
}) {
  const anneeDeb = anneeEnCours.split('-')[0]
  const [dateDebut, setDateDebut] = useState(`${anneeDeb}-10-01`)
  const [dateFin, setDateFin] = useState(`${Number(anneeDeb) + 1}-06-30`)
  const [tauxHoraire, setTauxHoraire] = useState(
    vacataire?.typeVacataire === 'PROFESSEUR_UNIVERSITAIRE' ? 25000 : 10000
  )
  const [lignes, setLignes] = useState<NouveauModuleLigne[]>([{ nomModule: '', classes: [], niveau: '', vhAuto: 0, troncCommun: false }])
  const [error, setError] = useState<string | null>(null)

  // Modules enregistrés dans le dossier vacataire (pré-filtrés)
  const modulesVacataire: string[] = vacataire?.modules ?? []
  // Si le dossier n'a pas de modules, on prend toute la maquette en fallback
  const modulesDispos = modulesVacataire.length > 0
    ? [...new Set(maquette.filter(m => modulesVacataire.includes(m.moduleNom)).map(m => m.moduleNom))].sort()
    : [...new Set(maquette.map(m => m.moduleNom))].sort()

  // Classes disponibles pour un module donné, filtrées par niveau si sélectionné
  const classesForModule = (nomModule: string, niveauFiltre?: string) => {
    const all = [...new Set(maquette.filter(m => m.moduleNom === nomModule).map(m => m.classeNom))]
    if (!niveauFiltre) return all
    return all.filter(c => deriveNiveauFromNom(c) === niveauFiltre)
  }

  const updateLigne = (i: number, patch: Partial<NouveauModuleLigne>) => {
    setLignes(prev => prev.map((l, idx) => {
      if (idx !== i) return l
      const updated = { ...l, ...patch }
      if (patch.nomModule !== undefined || patch.classes !== undefined) {
        const nom = patch.nomModule ?? l.nomModule
        const cls = patch.classes ?? l.classes
        const vhAuto = cls.reduce((sum, c) => {
          const entry = maquette.find(m => m.moduleNom === nom && m.classeNom === c)
          return sum + (entry?.volumeHoraire ?? 0)
        }, 0)
        // Auto-dériver le niveau depuis la première classe sélectionnée
        const niveauDerive = cls.length > 0 ? (deriveNiveauFromNom(cls[0]) || updated.niveau) : updated.niveau
        const troncCommun = cls.length > 1 ? updated.troncCommun : false
        return { ...updated, vhAuto, troncCommun, niveau: niveauDerive }
      }
      return updated
    }))
  }

  const addLigne = () => setLignes(prev => [...prev, { nomModule: '', classes: [], niveau: '', vhAuto: 0, troncCommun: false }])
  const removeLigne = (i: number) => setLignes(prev => prev.filter((_, idx) => idx !== i))

  const { mutate: creer, isPending } = useMutation({
    mutationFn: () => {
      const modulesValides = lignes.filter(l => l.nomModule && l.classes.length > 0)
      if (modulesValides.length === 0) throw new Error('Veuillez sélectionner au moins un module et au moins une classe.')
      const modules: ContratModuleRequest[] = modulesValides.map(l => ({
        nomModule: l.nomModule,
        classes: l.classes,
        niveau: (l.niveau || 'L1') as NiveauEnseignement,
        estTroncCommun: l.troncCommun,
      }))
      return contratService.creer({ vacataireId, modules, dateDebut, dateFin, tauxHoraire })
    },
    onSuccess,
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: { errors?: Record<string, string>; message?: string } } })?.response?.data
      if (data?.errors) { setError(Object.values(data.errors).join(' • ')); return }
      setError(data?.message ?? (err as { message?: string })?.message ?? 'Erreur lors de la création du contrat.')
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Nouveau contrat {anneeEnCours}</h3>
            <p className="text-xs text-gray-400 mt-0.5">Les modules proposés sont ceux du dossier vacataire. Le VH est calculé depuis la maquette.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none">×</button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {/* ── Période & Taux ── */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Date début</label>
              <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Date fin</label>
              <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Taux horaire (FCFA)</label>
              <input type="number" value={tauxHoraire} onChange={e => setTauxHoraire(Number(e.target.value))}
                step={500} min={0}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
            </div>
          </div>

          {/* ── Avertissement maquette vide ── */}
          {loadingMaquette && (
            <div className="py-4 text-center text-sm text-gray-400">Chargement de la maquette…</div>
          )}
          {!loadingMaquette && maquette.length === 0 && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
              Aucun module dans la maquette. Ajoutez d'abord des modules dans <strong>Maquette pédagogique</strong>.
            </div>
          )}
          {!loadingMaquette && modulesVacataire.length === 0 && maquette.length > 0 && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              Ce vacataire n'a pas de modules renseignés dans son dossier — tous les modules de la maquette sont disponibles.
            </div>
          )}

          {/* ── Lignes modules ── */}
          <div className="space-y-3">
            {lignes.map((ligne, i) => {
              const disponibles = classesForModule(ligne.nomModule, ligne.niveau)
              return (
                <div key={i} className="rounded-xl border border-gray-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Module {i + 1}</span>
                    {lignes.length > 1 && (
                      <button onClick={() => removeLigne(i)} className="text-xs text-red-400 hover:text-red-600">Supprimer</button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">Module</label>
                      <select
                        value={ligne.nomModule}
                        onChange={e => updateLigne(i, { nomModule: e.target.value, classes: [], troncCommun: false })}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                      >
                        <option value="">— Choisir —</option>
                        {modulesDispos.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">Filtre niveau</label>
                      <select
                        value={ligne.niveau}
                        onChange={e => updateLigne(i, { niveau: e.target.value, classes: [] })}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                      >
                        <option value="">Tous les niveaux</option>
                        {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Classes */}
                  {ligne.nomModule && (
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700">Classes concernées</label>
                      {disponibles.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Aucune classe dans la maquette pour ce module.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {disponibles.map(c => (
                            <button key={c} type="button"
                              onClick={() => {
                                const newClasses = ligne.classes.includes(c)
                                  ? ligne.classes.filter(x => x !== c)
                                  : [...ligne.classes, c]
                                updateLigne(i, { classes: newClasses })
                              }}
                              className={`rounded-lg px-2.5 py-1 text-xs transition-colors border ${
                                ligne.classes.includes(c)
                                  ? 'border-amber-400 bg-amber-50 text-amber-800'
                                  : 'border-gray-200 bg-white text-gray-600 hover:border-amber-200'
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tronc commun — visible seulement si 2+ classes cochées */}
                  {ligne.classes.length >= 2 && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={ligne.troncCommun}
                        onChange={e => updateLigne(i, { troncCommun: e.target.checked })}
                        className="h-3.5 w-3.5 accent-amber-500"
                      />
                      <span className="text-xs text-gray-700">
                        Tronc commun — un seul émargement pour toutes les classes cochées
                      </span>
                    </label>
                  )}

                  {/* VH calculé */}
                  {ligne.vhAuto > 0 && (
                    <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-1.5 text-xs text-green-800">
                      Volume horaire (maquette) : <strong>{ligne.vhAuto}h</strong>
                      {ligne.troncCommun && <span className="ml-2 text-green-600">· Tronc commun</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <button type="button" onClick={addLigne} className="text-sm text-amber-700 hover:underline">
            + Ajouter un module
          </button>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">
            Annuler
          </button>
          <button
            onClick={() => { setError(null); creer() }}
            disabled={isPending}
            className="rounded-xl px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: '#C88500' }}
          >
            {isPending ? 'Création…' : 'Créer le contrat'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Modale démarrer module ── */
function DemarrerModuleModal({ nomModule, isPending, onClose, onConfirm }: {
  nomModule: string
  isPending: boolean
  onClose: () => void
  onConfirm: (date: string) => void
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-1 text-base font-bold text-gray-900">Démarrer le module</h3>
        <p className="mb-4 text-sm text-gray-500">{nomModule}</p>
        <label className="mb-1 block text-sm font-medium text-gray-700">Date de démarrage</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-400"
        />
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">Annuler</button>
          <button
            onClick={() => onConfirm(date)}
            disabled={isPending || !date}
            className="rounded-xl px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: '#C88500' }}
          >
            {isPending ? 'En cours…' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Utilitaires ── */
function computeAnneeAcademique(date: Date): string {
  const month = date.getMonth() + 1 // 1-indexed
  const year = date.getFullYear()
  return month >= 10 ? `${year}-${year + 1}` : `${year - 1}-${year}`
}
