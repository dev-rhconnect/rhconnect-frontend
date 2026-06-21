'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { referenceService } from '@/services/reference.service'
import type { ContratModuleRequest, NiveauEnseignement } from '@/services/contrat.service'

/* ── Types internes du formulaire ── */
export type ModuleLigne = {
  nomModule: string
  niveau: NiveauEnseignement
  volumeHorairePrevisionnel: string
  classes: string[]
  dateDebutPrevue: string
}

export const moduleLigneVide = (): ModuleLigne => ({
  nomModule: '',
  niveau: 'LICENCE',
  volumeHorairePrevisionnel: '',
  classes: [],
  dateDebutPrevue: '',
})

export function buildModules(lignes: ModuleLigne[]): ContratModuleRequest[] {
  return lignes
    .filter((m) => m.nomModule && m.classes.length > 0 && m.volumeHorairePrevisionnel)
    .map((m) => ({
      nomModule: m.nomModule,
      niveau: m.niveau,
      volumeHorairePrevisionnel: parseFloat(m.volumeHorairePrevisionnel),
      classes: m.classes,
      ...(m.dateDebutPrevue ? { dateDebutPrevue: m.dateDebutPrevue } : {}),
    }))
}

/* ── Composant principal ── */
export function ModulesForm({
  modules,
  onChange,
}: {
  modules: ModuleLigne[]
  onChange: (m: ModuleLigne[]) => void
}) {
  const { data: modulesRef = [] } = useQuery({
    queryKey: ['modules-ref'],
    queryFn: referenceService.getModules,
    staleTime: 5 * 60 * 1000,
  })

  const { data: classesRef = [] } = useQuery({
    queryKey: ['classes-ref'],
    queryFn: () => referenceService.getClasses(),
    staleTime: 5 * 60 * 1000,
  })

  const classesLicence = classesRef.filter((c) => c.niveau === 'LICENCE')
  const classesMaster  = classesRef.filter((c) => c.niveau === 'MASTER')

  function update(index: number, field: keyof ModuleLigne, value: ModuleLigne[keyof ModuleLigne]) {
    onChange(modules.map((m, i) => (i === index ? { ...m, [field]: value } : m)))
  }

  function toggleClasse(index: number, nomClasse: string) {
    const mod = modules[index]
    const classes = mod.classes.includes(nomClasse)
      ? mod.classes.filter((c) => c !== nomClasse)
      : [...mod.classes, nomClasse]
    update(index, 'classes', classes)
  }

  return (
    <div className="space-y-4">
      {modules.map((mod, index) => (
        <ModuleLigneForm
          key={index}
          mod={mod}
          index={index}
          modulesRef={modulesRef.map((m) => m.nom)}
          classesLicence={classesLicence.map((c) => c.nom)}
          classesMaster={classesMaster.map((c) => c.nom)}
          canDelete={modules.length > 1}
          onDelete={() => onChange(modules.filter((_, i) => i !== index))}
          onUpdate={(field, val) => update(index, field, val)}
          onToggleClasse={(nom) => toggleClasse(index, nom)}
        />
      ))}

      <button
        type="button"
        onClick={() => onChange([...modules, moduleLigneVide()])}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-amber-300 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Ajouter un module
      </button>
    </div>
  )
}

/* ── Formulaire d'une ligne module ── */
function ModuleLigneForm({
  mod, index, modulesRef, classesLicence, classesMaster,
  canDelete, onDelete, onUpdate, onToggleClasse,
}: {
  mod: ModuleLigne
  index: number
  modulesRef: string[]
  classesLicence: string[]
  classesMaster: string[]
  canDelete: boolean
  onDelete: () => void
  onUpdate: (field: keyof ModuleLigne, val: ModuleLigne[keyof ModuleLigne]) => void
  onToggleClasse: (nom: string) => void
}) {
  const [showClasses, setShowClasses] = useState(false)

  const classesDisponibles = mod.niveau === 'LICENCE' ? classesLicence : classesMaster
  const nbSelected = mod.classes.length

  const tauxLabel = mod.niveau === 'LICENCE'
    ? '10 000 FCFA/h'
    : '15 000 FCFA/h (prof. univ. : 25 000)'

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      {/* En-tête */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Module {index + 1}
        </span>
        {canDelete && (
          <button type="button" onClick={onDelete} className="text-xs text-red-500 hover:text-red-700 transition-colors">
            Supprimer
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Module (select) + Niveau (select) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Module <span className="text-red-500">*</span>
            </label>
            {modulesRef.length > 0 ? (
              <select
                value={mod.nomModule}
                onChange={(e) => onUpdate('nomModule', e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
              >
                <option value="">— Choisir un module —</option>
                {modulesRef.map((nom) => (
                  <option key={nom} value={nom}>{nom}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={mod.nomModule}
                onChange={(e) => onUpdate('nomModule', e.target.value)}
                placeholder="Nom du module"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm placeholder-gray-400 focus:border-amber-400 focus:outline-none"
              />
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Niveau <span className="text-red-500">*</span>
              <span className="ml-1 font-normal text-gray-400">({tauxLabel})</span>
            </label>
            <select
              value={mod.niveau}
              onChange={(e) => {
                onUpdate('niveau', e.target.value as NiveauEnseignement)
                // réinitialiser les classes si le niveau change
                onUpdate('classes', [])
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
            >
              <option value="LICENCE">Licence</option>
              <option value="MASTER">Master</option>
            </select>
          </div>
        </div>

        {/* Volume horaire + date début */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Volume horaire (h) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={mod.volumeHorairePrevisionnel}
              onChange={(e) => onUpdate('volumeHorairePrevisionnel', e.target.value)}
              placeholder="Ex : 30"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm placeholder-gray-400 focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">Date de début prévue</label>
            <input
              type="date"
              value={mod.dateDebutPrevue}
              onChange={(e) => onUpdate('dateDebutPrevue', e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Classes (multi-select avec checkboxes) */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            Classes <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setShowClasses(!showClasses)}
            className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none transition-colors hover:border-amber-300"
          >
            <span className={nbSelected === 0 ? 'text-gray-400' : 'text-gray-900'}>
              {nbSelected === 0
                ? '— Sélectionner des classes —'
                : `${nbSelected} classe${nbSelected > 1 ? 's' : ''} sélectionnée${nbSelected > 1 ? 's' : ''}`}
            </span>
            <svg
              className={`h-4 w-4 text-gray-400 transition-transform ${showClasses ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showClasses && (
            <div className="mt-1 rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
              {classesDisponibles.length === 0 ? (
                <div className="space-y-2 px-2 py-3 text-xs text-gray-400">
                  <p>Aucune classe disponible pour ce niveau.</p>
                  <p>Entrez un ou plusieurs noms de classes manuellement ci-dessous, séparés par des virgules.</p>
                  <input
                    type="text"
                    value={mod.classes.join(', ')}
                    onChange={(e) => onUpdate('classes', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                    placeholder="Ex : L1 TC2, L1 TC3"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              ) : (
                <div className="max-h-44 overflow-y-auto grid grid-cols-2 gap-1">
                  {classesDisponibles.map((nom) => {
                    const checked = mod.classes.includes(nom)
                    return (
                      <label key={nom}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                          checked ? 'bg-amber-50 text-amber-800' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggleClasse(nom)}
                          className="h-3.5 w-3.5 rounded accent-amber-500"
                        />
                        {nom}
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tags classes sélectionnées */}
          {nbSelected > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {mod.classes.map((nom) => (
                <span key={nom}
                  className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800"
                >
                  {nom}
                  <button type="button" onClick={() => onToggleClasse(nom)} className="hover:text-red-600">×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
