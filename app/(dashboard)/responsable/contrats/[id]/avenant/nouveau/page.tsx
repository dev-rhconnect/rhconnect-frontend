'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
import { contratService, type ContratModuleRequest, type NiveauEnseignement } from '@/services/contrat.service'
import { api } from '@/services/api'

type MaquetteEntry = { id: number; classeNom: string; classeFiliere: string; moduleNom: string; volumeHoraire: number }
type Ligne = { nomModule: string; classes: string[]; niveau: string; vhAuto: number; troncCommun: boolean }

const NIVEAUX = ['L1', 'L2', 'L3', 'MASTER_1', 'MASTER_2', 'DUT']

export default function NouvelAvenantPage() {
  const params  = useParams()
  const router  = useRouter()
  const contratParentId = Number(params.id)

  const [motif,  setMotif]  = useState('')
  const [lignes, setLignes] = useState<Ligne[]>([{ nomModule: '', classes: [], niveau: 'L1', vhAuto: 0, troncCommun: false }])
  const [error,  setError]  = useState<string | null>(null)

  const { data: contrat } = useQuery({
    queryKey: ['contrat', contratParentId],
    queryFn:  () => contratService.trouverParId(contratParentId),
  })

  const { data: maquette = [] } = useQuery({
    queryKey: ['maquette'],
    queryFn:  () => api.get<MaquetteEntry[]>('/maquette').then(r => r.data),
  })

  const { mutate: creer, isPending } = useMutation({
    mutationFn: () => {
      const modulesValides = lignes.filter(l => l.nomModule && l.classes.length > 0)
      if (modulesValides.length === 0) throw new Error('Ajoutez au moins un module avec des classes.')
      const modules: ContratModuleRequest[] = modulesValides.map(l => ({
        nomModule: l.nomModule,
        classes:   l.classes,
        niveau:    l.niveau as NiveauEnseignement,
      }))
      return contratService.creerAvenant(contratParentId, { modules })
    },
    onSuccess: (avenant) => router.push(`/responsable/contrats/${avenant.id}`),
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })
        ?.response?.data?.message ?? (err as { message?: string })?.message ?? 'Erreur lors de la création.'
      setError(msg)
    },
  })

  const modulesDispos    = [...new Set(maquette.map(m => m.moduleNom))].sort()
  const classesForModule = (nom: string) => maquette.filter(m => m.moduleNom === nom).map(m => m.classeNom)

  const updateLigne = (i: number, patch: Partial<Ligne>) => {
    setLignes(prev => prev.map((l, idx) => {
      if (idx !== i) return l
      const updated = { ...l, ...patch }
      if (patch.nomModule !== undefined || patch.classes !== undefined) {
        const nom = patch.nomModule ?? l.nomModule
        const cls = patch.classes   ?? l.classes
        const vhAuto = cls.reduce((sum, c) => {
          const entry = maquette.find(m => m.moduleNom === nom && m.classeNom === c)
          return sum + (entry?.volumeHoraire ?? 0)
        }, 0)
        return { ...updated, vhAuto }
      }
      return updated
    }))
  }

  const addLigne    = () => setLignes(p => [...p, { nomModule: '', classes: [], niveau: 'L1', vhAuto: 0, troncCommun: false }])
  const removeLigne = (i: number) => setLignes(p => p.filter((_, idx) => idx !== i))

  const numeroAvenant = `AVN-${new Date().getFullYear()}-${String(contratParentId).padStart(3, '0')}`

  return (
    <div className="mx-auto max-w-3xl space-y-6">

      {/* Fil d'ariane */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/responsable/contrats" className="hover:text-gray-800">Contrats</Link>
        <span>/</span>
        <Link href={`/responsable/contrats/${contratParentId}`} className="hover:text-gray-800">
          {contrat ? `Contrat ${contrat.anneeAcademique}` : `#${contratParentId}`}
        </Link>
        <span>/</span>
        <span className="font-medium text-gray-900">Nouvel avenant</span>
      </div>

      {/* En-tête */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Nouvel avenant</h1>
        {contrat && (
          <p className="mt-1 text-sm text-gray-500">
            Avenant au contrat {contrat.anneeAcademique} de {contrat.nomVacataire}
          </p>
        )}
        <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-gray-400 mb-1">Numéro d'avenant</p>
            <p className="font-mono font-semibold text-gray-900">{numeroAvenant}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Date</p>
            <p className="font-semibold text-gray-900">{new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        {/* Motif */}
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Motif / justification</label>
          <textarea
            value={motif}
            onChange={e => setMotif(e.target.value)}
            rows={2}
            placeholder="Ex : Ajout de modules complémentaires suite à la révision du programme…"
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400 resize-none"
          />
        </div>
      </div>

      {/* Modules à ajouter */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Modules à ajouter</h2>
          <p className="text-xs text-gray-400">Le volume horaire est calculé automatiquement depuis la maquette</p>
        </div>

        <div className="space-y-4">
          {lignes.map((ligne, i) => {
            const disponibles = classesForModule(ligne.nomModule)
            return (
              <div key={i} className="rounded-xl border border-gray-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Module {i + 1}</span>
                  {lignes.length > 1 && (
                    <button onClick={() => removeLigne(i)} className="text-xs text-red-400 hover:text-red-600">Supprimer</button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Module</label>
                    <select
                      value={ligne.nomModule}
                      onChange={e => updateLigne(i, { nomModule: e.target.value, classes: [] })}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                    >
                      <option value="">— Choisir —</option>
                      {modulesDispos.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Niveau</label>
                    <select
                      value={ligne.niveau}
                      onChange={e => updateLigne(i, { niveau: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                    >
                      {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>

                {/* Classes */}
                {ligne.nomModule && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-700">Classes concernées</label>
                    {disponibles.length === 0 ? (
                      <p className="text-xs text-gray-400">Aucune classe dans la maquette pour ce module.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {disponibles.map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              const newClasses = ligne.classes.includes(c)
                                ? ligne.classes.filter(x => x !== c)
                                : [...ligne.classes, c]
                              updateLigne(i, { classes: newClasses, troncCommun: false })
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

                {/* Option tronc commun */}
                {ligne.classes.length > 1 && (
                  <label className="flex items-center gap-2.5 cursor-pointer rounded-lg border border-orange-200 bg-orange-50 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={ligne.troncCommun}
                      onChange={e => updateLigne(i, { troncCommun: e.target.checked })}
                      className="h-4 w-4 rounded accent-amber-500"
                    />
                    <span className="text-sm text-orange-800 font-medium">Cours en tronc commun</span>
                    <span className="text-xs text-orange-600 ml-auto">→ émargement unique pour toutes les classes</span>
                  </label>
                )}

                {/* VH auto */}
                {ligne.nomModule && ligne.classes.length > 0 && (
                  <div className={`rounded-lg px-3 py-2 text-xs ${ligne.troncCommun ? 'bg-orange-50 border border-orange-200 text-orange-800' : 'bg-green-50 border border-green-200 text-green-800'}`}>
                    {ligne.troncCommun ? (
                      <>Volume horaire (tronc commun) : <strong>{Math.max(...ligne.classes.map(c => maquette.find(m => m.moduleNom === ligne.nomModule && m.classeNom === c)?.volumeHoraire ?? 0))}h</strong> — 1 émargement</>
                    ) : (
                      <>Volume horaire total : <strong>{ligne.vhAuto}h</strong> ({ligne.classes.length} classe{ligne.classes.length > 1 ? 's' : ''})</>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={addLigne}
          className="mt-4 flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:underline"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Ajouter un module
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-6">
        <Link
          href={`/responsable/contrats/${contratParentId}`}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
        >
          ← Annuler
        </Link>
        <button
          onClick={() => { setError(null); creer() }}
          disabled={isPending}
          className="rounded-xl px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
          style={{ background: '#C88500' }}
        >
          {isPending ? 'Enregistrement…' : "Enregistrer l'avenant"}
        </button>
      </div>
    </div>
  )
}
