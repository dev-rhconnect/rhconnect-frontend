'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'

/* ── Types ── */
interface MaquetteEntry {
  id: number
  classeNom: string
  classeFiliere: string
  moduleNom: string
  volumeHoraire: number
  actif: boolean
}
interface FormState { classeNom: string; moduleNom: string; volumeHoraire: string }
const FORM_VIDE: FormState = { classeNom: '', moduleNom: '', volumeHoraire: '' }

type SeedEntry = { classeNom: string; moduleNom: string; volumeHoraire: number }

const GLRS_DATA: SeedEntry[] = [
  // L1 — Semestre 1
  { classeNom: 'GLRS L1', moduleNom: 'Business English 1', volumeHoraire: 20 },
  { classeNom: 'GLRS L1', moduleNom: 'Leadership - Dév. Personnel - Techniques d\'enquête - ARE', volumeHoraire: 24 },
  { classeNom: 'GLRS L1', moduleNom: 'Statistiques Descriptives', volumeHoraire: 32 },
  { classeNom: 'GLRS L1', moduleNom: 'CISCO IT Essentials 1: PC Hardware & Software', volumeHoraire: 30 },
  { classeNom: 'GLRS L1', moduleNom: 'Théories des Systèmes d\'Exploitation', volumeHoraire: 20 },
  { classeNom: 'GLRS L1', moduleNom: 'Électricité et Électromagnétisme 1', volumeHoraire: 30 },
  { classeNom: 'GLRS L1', moduleNom: 'Conception Graphique et Multimédia 1', volumeHoraire: 30 },
  { classeNom: 'GLRS L1', moduleNom: 'Algorithmique et Langages de Programmation', volumeHoraire: 30 },
  { classeNom: 'GLRS L1', moduleNom: 'Technologies Web 1: HTML5 - CSS3', volumeHoraire: 24 },
  { classeNom: 'GLRS L1', moduleNom: 'Informatique Appliquée', volumeHoraire: 35 },
  { classeNom: 'GLRS L1', moduleNom: 'Fondamentaux du Management', volumeHoraire: 20 },
  { classeNom: 'GLRS L1', moduleNom: 'Droit du Numérique', volumeHoraire: 20 },
  // L1 — Semestre 2
  { classeNom: 'GLRS L1', moduleNom: 'Business English 2', volumeHoraire: 20 },
  { classeNom: 'GLRS L1', moduleNom: 'AGORA - Soft Skills & Grands Projets', volumeHoraire: 24 },
  { classeNom: 'GLRS L1', moduleNom: 'Mathématiques Appliquées: Analyse 1 & Algèbre 1', volumeHoraire: 40 },
  { classeNom: 'GLRS L1', moduleNom: 'Réseaux Informatiques - Certification CISCO CCNA 1', volumeHoraire: 30 },
  { classeNom: 'GLRS L1', moduleNom: 'Pratiques des Systèmes d\'Exploitation', volumeHoraire: 20 },
  { classeNom: 'GLRS L1', moduleNom: 'Électricité et Électromagnétisme 2', volumeHoraire: 30 },
  { classeNom: 'GLRS L1', moduleNom: 'Programmation Objet 1: Python', volumeHoraire: 24 },
  { classeNom: 'GLRS L1', moduleNom: 'Algorithmique et Structures de Données 1', volumeHoraire: 30 },
  { classeNom: 'GLRS L1', moduleNom: 'Conception Graphique et Multimédia 2', volumeHoraire: 30 },
  { classeNom: 'GLRS L1', moduleNom: 'Technologies Web 2: HTML5 - CSS3', volumeHoraire: 24 },
  { classeNom: 'GLRS L1', moduleNom: 'CMS WordPress', volumeHoraire: 30 },
  { classeNom: 'GLRS L1', moduleNom: 'Économie d\'Entreprise', volumeHoraire: 24 },
  // L2 — Semestre 3
  { classeNom: 'GLRS L2', moduleNom: 'Business English 3', volumeHoraire: 20 },
  { classeNom: 'GLRS L2', moduleNom: 'Entrepreneurship: Atelier Build Your Business (BYB)', volumeHoraire: 20 },
  { classeNom: 'GLRS L2', moduleNom: 'Analyse Combinatoire et Lois de Probabilité', volumeHoraire: 30 },
  { classeNom: 'GLRS L2', moduleNom: 'Architecture des Réseaux Informatiques: CISCO CCNA 1-2', volumeHoraire: 48 },
  { classeNom: 'GLRS L2', moduleNom: 'Électronique Digitale 1', volumeHoraire: 20 },
  { classeNom: 'GLRS L2', moduleNom: 'Administration Système Windows', volumeHoraire: 20 },
  { classeNom: 'GLRS L2', moduleNom: 'Algo Avancée & Structures de Données 1', volumeHoraire: 30 },
  { classeNom: 'GLRS L2', moduleNom: 'Programmation Objet 2: Python', volumeHoraire: 30 },
  { classeNom: 'GLRS L2', moduleNom: 'Programmation C', volumeHoraire: 30 },
  { classeNom: 'GLRS L2', moduleNom: 'Programmation Web 1: PHP', volumeHoraire: 24 },
  { classeNom: 'GLRS L2', moduleNom: 'Analyse et Conception 1 (UML)', volumeHoraire: 20 },
  { classeNom: 'GLRS L2', moduleNom: 'Systèmes de Gestion de Bases de Données', volumeHoraire: 30 },
  // L2 — Semestre 4
  { classeNom: 'GLRS L2', moduleNom: 'Business English 4', volumeHoraire: 20 },
  { classeNom: 'GLRS L2', moduleNom: 'AGORA - Soft Skills & Grands Projets', volumeHoraire: 24 },
  { classeNom: 'GLRS L2', moduleNom: 'Mathématiques Appliquées: Analyse 2 - Algèbre 2', volumeHoraire: 40 },
  { classeNom: 'GLRS L2', moduleNom: 'Recherche Opérationnelle', volumeHoraire: 24 },
  { classeNom: 'GLRS L2', moduleNom: 'Administration Systèmes Linux', volumeHoraire: 30 },
  { classeNom: 'GLRS L2', moduleNom: 'Électronique Digitale 2', volumeHoraire: 20 },
  { classeNom: 'GLRS L2', moduleNom: 'Algo Avancée & Structures de Données 2', volumeHoraire: 30 },
  { classeNom: 'GLRS L2', moduleNom: 'Programmation Objet 3: Python', volumeHoraire: 24 },
  { classeNom: 'GLRS L2', moduleNom: 'Programmation Objet 4: C++', volumeHoraire: 24 },
  { classeNom: 'GLRS L2', moduleNom: 'Programmation Objet 5: JAVA', volumeHoraire: 24 },
  { classeNom: 'GLRS L2', moduleNom: 'Analyse et Conception 2', volumeHoraire: 20 },
  { classeNom: 'GLRS L2', moduleNom: 'Technologies Web 3: PHP/MySQL', volumeHoraire: 30 },
  // L3 — Semestre 5
  { classeNom: 'GLRS L3', moduleNom: 'English For IT (E-FIT) 1', volumeHoraire: 20 },
  { classeNom: 'GLRS L3', moduleNom: 'Leadership Développement Personnel & Entrepreneuriat', volumeHoraire: 32 },
  { classeNom: 'GLRS L3', moduleNom: 'Interconnexion de Réseaux et Systèmes: Pratique CISCO', volumeHoraire: 24 },
  { classeNom: 'GLRS L3', moduleNom: 'Administration de Réseaux Sous Linux Server', volumeHoraire: 30 },
  { classeNom: 'GLRS L3', moduleNom: 'Programmation Objet 6: JAVA', volumeHoraire: 24 },
  { classeNom: 'GLRS L3', moduleNom: 'Programmation Web 2: PHP Orienté Objet - Framework (Symfony 2)', volumeHoraire: 24 },
  { classeNom: 'GLRS L3', moduleNom: 'Technologies .NET (C#)', volumeHoraire: 24 },
  { classeNom: 'GLRS L3', moduleNom: 'Administration de Bases de Données sous SQL Server', volumeHoraire: 30 },
  { classeNom: 'GLRS L3', moduleNom: 'Fondamentaux de la Sécurité Informatique', volumeHoraire: 20 },
  { classeNom: 'GLRS L3', moduleNom: 'Management de Projets Informatiques', volumeHoraire: 30 },
  // L3 — Semestre 6
  { classeNom: 'GLRS L3', moduleNom: 'English For IT (E-FIT) 2', volumeHoraire: 20 },
  { classeNom: 'GLRS L3', moduleNom: 'Leadership - Com & Techniques de Recherche d\'Emploi', volumeHoraire: 12 },
  { classeNom: 'GLRS L3', moduleNom: 'Interconnexion de Réseaux et Systèmes: Pratique CISCO 2', volumeHoraire: 24 },
  { classeNom: 'GLRS L3', moduleNom: 'Administration de Réseaux sous Windows Server', volumeHoraire: 30 },
  { classeNom: 'GLRS L3', moduleNom: 'Génie Logiciel - Ateliers et Projets Développement d\'Applications', volumeHoraire: 30 },
  { classeNom: 'GLRS L3', moduleNom: 'Administration de Bases de Données sous Oracle', volumeHoraire: 30 },
  { classeNom: 'GLRS L3', moduleNom: 'Développement d\'Applications Mobile Flutter', volumeHoraire: 24 },
  { classeNom: 'GLRS L3', moduleNom: 'Applications Angular', volumeHoraire: 30 },
  { classeNom: 'GLRS L3', moduleNom: 'Framework Python: Flask', volumeHoraire: 24 },
  { classeNom: 'GLRS L3', moduleNom: 'Management des Processus', volumeHoraire: 20 },
  { classeNom: 'GLRS L3', moduleNom: 'Fondements du Droit du Travail', volumeHoraire: 16 },
  { classeNom: 'GLRS L3', moduleNom: 'Entrepreneuriat - Projet d\'entreprise - Grands Projets', volumeHoraire: 20 },
]

const maquetteApi = {
  lister: () => api.get<MaquetteEntry[]>('/maquette').then(r => r.data),
  upsert:    (data: { classeNom: string; moduleNom: string; volumeHoraire: number }) =>
    api.post<MaquetteEntry>('/maquette', data).then(r => r.data),
  supprimer: (id: number) => api.delete(`/maquette/${id}`),
}

export default function MaquettePage() {
  const queryClient = useQueryClient()
  const [search,       setSearch]       = useState('')
  const [filtreClasse, setFiltreClasse] = useState('TOUTES')
  const [form,         setForm]         = useState<FormState>(FORM_VIDE)
  const [editId,       setEditId]       = useState<number | null>(null)
  const [showForm,     setShowForm]     = useState(false)
  const [formError,    setFormError]    = useState<string | null>(null)
  const [showImport,   setShowImport]   = useState(false)
  const [importJson,   setImportJson]   = useState('')
  const [importStatus, setImportStatus] = useState<{ done: number; total: number; errors: number } | null>(null)

  const { data: entrees = [], isLoading } = useQuery({ queryKey: ['maquette'], queryFn: maquetteApi.lister })

  const { mutate: upsert, isPending: saving } = useMutation({
    mutationFn: () => maquetteApi.upsert({
      classeNom: form.classeNom.trim(),
      moduleNom: form.moduleNom.trim(),
      volumeHoraire: parseFloat(form.volumeHoraire),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maquette'] })
      setForm(FORM_VIDE); setEditId(null); setShowForm(false); setFormError(null)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erreur lors de la sauvegarde.'
      setFormError(msg)
    },
  })

  const { mutate: supprimer } = useMutation({
    mutationFn: maquetteApi.supprimer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maquette'] }),
  })

  const actives = useMemo(() => entrees.filter(e => e.actif), [entrees])
  const classes = useMemo(() => [...new Set(actives.map(e => e.classeNom))].sort(), [actives])

  /* VH max par classe pour la progress bar */
  const vhParClasse = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of actives) map[e.classeNom] = (map[e.classeNom] ?? 0) + e.volumeHoraire
    return map
  }, [actives])
  const maxVH = Math.max(...Object.values(vhParClasse), 1)

  const filtered = useMemo(() => actives
    .filter(e => filtreClasse === 'TOUTES' || e.classeNom === filtreClasse)
    .filter(e => !search || e.moduleNom.toLowerCase().includes(search.toLowerCase()) || e.classeNom.toLowerCase().includes(search.toLowerCase())),
    [actives, filtreClasse, search]
  )

  const parClasse = useMemo(() => {
    const map = new Map<string, MaquetteEntry[]>()
    for (const e of filtered) { const list = map.get(e.classeNom) ?? []; list.push(e); map.set(e.classeNom, list) }
    return map
  }, [filtered])

  const totalVH = filtered.reduce((s, e) => s + e.volumeHoraire, 0)

  const handleEdit = (e: MaquetteEntry) => {
    setForm({ classeNom: e.classeNom, moduleNom: e.moduleNom, volumeHoraire: String(e.volumeHoraire) })
    setEditId(e.id); setShowForm(true); setFormError(null)
  }

  const handleImport = async () => {
    let parsed: SeedEntry[]
    try {
      parsed = JSON.parse(importJson)
      if (!Array.isArray(parsed) || parsed.some(e => !e.classeNom || !e.moduleNom || typeof e.volumeHoraire !== 'number'))
        throw new Error()
    } catch {
      setImportStatus({ done: 0, total: -1, errors: 1 })
      return
    }
    setImportStatus({ done: 0, total: parsed.length, errors: 0 })
    let errCount = 0
    for (let i = 0; i < parsed.length; i++) {
      try { await maquetteApi.upsert(parsed[i]) } catch { errCount++ }
      setImportStatus({ done: i + 1, total: parsed.length, errors: errCount })
    }
    queryClient.invalidateQueries({ queryKey: ['maquette'] })
    setTimeout(() => { setShowImport(false); setImportStatus(null); setImportJson('') }, 1200)
  }

  const handleSubmit = () => {
    if (!form.classeNom.trim() || !form.moduleNom.trim() || !form.volumeHoraire) { setFormError('Tous les champs sont obligatoires.'); return }
    const vh = parseFloat(form.volumeHoraire)
    if (isNaN(vh) || vh <= 0) { setFormError('Le volume horaire doit être un nombre positif.'); return }
    setFormError(null); upsert()
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl text-gray-900">Maquette pédagogique</h1>
          <p className="mt-1 text-sm text-gray-500">Table de référence : classe + module → volume horaire prévu</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start shrink-0">
          <button onClick={() => { setShowImport(true); setImportStatus(null) }}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Importer
          </button>
          <button onClick={() => { setForm(FORM_VIDE); setEditId(null); setShowForm(true); setFormError(null) }}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
            style={{ background: '#C88500' }}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Ajouter une entrée
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: '#FEF3C7' }}>
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Entrées actives</p>
            <p className="text-3xl font-bold text-gray-900">{actives.length}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: '#EFF6FF' }}>
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Classes couvertes</p>
            <p className="text-3xl font-bold text-gray-900">{classes.length}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: '#F0FDF4' }}>
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Volume horaire {filtreClasse !== 'TOUTES' ? 'filtré' : 'total'}</p>
            <p className="text-3xl font-bold text-gray-900">{filtreClasse !== 'TOUTES' ? totalVH : actives.reduce((s,e) => s+e.volumeHoraire,0)}h</p>
          </div>
        </div>
      </div>

      {/* ── Filtres ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Recherche */}
        <div className="relative w-72 flex-shrink-0">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setFiltreClasse('TOUTES') }}
            placeholder="Module ou classe…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-9 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400 shadow-sm" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          )}
        </div>

        {/* Chips classes — défilable */}
        <div className="flex flex-1 items-center gap-1.5 overflow-x-auto rounded-xl bg-white p-1 shadow-sm border border-gray-100 scrollbar-none">
          <button onClick={() => { setFiltreClasse('TOUTES'); setSearch('') }}
            className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${filtreClasse === 'TOUTES' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}>
            Toutes
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${filtreClasse === 'TOUTES' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{classes.length}</span>
          </button>
          {classes.map(c => {
            const count = actives.filter(e => e.classeNom === c).length
            const isActive = filtreClasse === c
            return (
              <button key={c} onClick={() => { setFiltreClasse(c); setSearch('') }}
                className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${isActive ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
                style={isActive ? { background: '#C88500' } : {}}>
                {c}
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Groupes par classe ── */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
        </div>
      ) : parClasse.size === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-16 text-center shadow-sm border border-gray-100">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
            <svg className="h-7 w-7 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-900">Aucune entrée trouvée</p>
          <p className="mt-1 text-xs text-gray-400">Modifiez les filtres ou ajoutez une entrée.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...parClasse.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([classeNom, lignes]) => {
            const classeVH = lignes.reduce((s, l) => s + l.volumeHoraire, 0)
            const pct = Math.round((classeVH / maxVH) * 100)
            return (
              <div key={classeNom} className="rounded-2xl bg-white shadow-sm overflow-hidden border border-gray-100">

                {/* En-tête groupe */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black text-white flex-shrink-0"
                      style={{ background: '#C88500' }}>
                      {classeNom.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{classeNom}</span>
                        {lignes[0]?.classeFiliere && (
                          <span className="text-xs text-gray-400">— {lignes[0].classeFiliere}</span>
                        )}
                      </div>
                      {/* Mini progress bar VH */}
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 w-24 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#C88500' }} />
                        </div>
                        <span className="text-[10px] text-gray-400">{classeVH}h / {maxVH}h max</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-100">
                      {lignes.length} module{lignes.length !== 1 ? 's' : ''}
                    </span>
                    <span className="inline-flex rounded-lg px-2.5 py-1 text-xs font-bold border" style={{ background: '#F0FDF4', color: '#15803D', borderColor: '#BBF7D0' }}>
                      {classeVH}h total
                    </span>
                  </div>
                </div>

                {/* Lignes modules */}
                <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-5 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Module</th>
                      <th className="px-5 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-gray-400 w-32">VH</th>
                      <th className="px-5 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-gray-400 w-36">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {lignes.sort((a, b) => a.moduleNom.localeCompare(b.moduleNom)).map(ligne => {
                      const lignePct = Math.round((ligne.volumeHoraire / classeVH) * 100)
                      return (
                        <tr key={ligne.id} className="group hover:bg-amber-50/20 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <span className="text-gray-900 font-medium">{ligne.moduleNom}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="h-1.5 w-16 rounded-full bg-gray-100 overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${lignePct}%`, background: '#C88500', opacity: 0.6 }} />
                              </div>
                              <span className="inline-flex rounded-lg px-2.5 py-0.5 text-xs font-bold"
                                style={{ background: '#FEF3C7', color: '#92400E' }}>
                                {ligne.volumeHoraire}h
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEdit(ligne)}
                                className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-all">
                                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                Modifier
                              </button>
                              <button onClick={() => { if (confirm(`Désactiver "${ligne.moduleNom}" pour ${ligne.classeNom} ?`)) supprimer(ligne.id) }}
                                className="flex items-center gap-1 rounded-lg border border-red-100 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 shadow-sm transition-all">
                                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                Désactiver
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modale import en masse ── */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Importer des modules</h3>
                <p className="text-xs text-gray-400 mt-0.5">JSON · format : [{'{'}classeNom, moduleNom, volumeHoraire{'}'}]</p>
              </div>
              <button onClick={() => { setShowImport(false); setImportStatus(null); setImportJson('') }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            {/* Boutons données prédéfinies */}
            <div className="mb-3">
              <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Données prédéfinies</p>
              <button
                onClick={() => setImportJson(JSON.stringify(GLRS_DATA, null, 2))}
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
              >
                Charger GLRS (L1 · L2 · L3 — 70 modules)
              </button>
            </div>

            <textarea
              value={importJson}
              onChange={e => setImportJson(e.target.value)}
              rows={10}
              placeholder={'[\n  {"classeNom": "GLRS L1", "moduleNom": "Algorithmique", "volumeHoraire": 30}\n]'}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-mono text-gray-900 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 resize-none"
            />

            {importStatus && (
              <div className={`mt-3 rounded-xl px-3 py-2 text-sm ${importStatus.total === -1 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
                {importStatus.total === -1
                  ? 'JSON invalide. Vérifiez le format : [{classeNom, moduleNom, volumeHoraire}]'
                  : importStatus.done < importStatus.total
                    ? `Import en cours… ${importStatus.done} / ${importStatus.total}`
                    : `✓ Import terminé — ${importStatus.done - importStatus.errors} réussis${importStatus.errors > 0 ? `, ${importStatus.errors} erreurs` : ''}`
                }
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { setShowImport(false); setImportStatus(null); setImportJson('') }}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
                Fermer
              </button>
              <button
                onClick={handleImport}
                disabled={!importJson.trim() || (importStatus !== null && importStatus.done < (importStatus.total ?? 0) && importStatus.total !== -1)}
                className="rounded-xl px-5 py-2 text-sm font-bold text-white disabled:opacity-50 shadow-sm hover:opacity-90 transition-opacity"
                style={{ background: '#C88500' }}
              >
                Importer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modale ajout/modification ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{editId ? 'Modifier une entrée' : 'Nouvelle entrée'}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Maquette pédagogique</p>
              </div>
              <button onClick={() => setShowForm(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Classe <span className="text-red-500">*</span></label>
                <input type="text" value={form.classeNom} onChange={e => setForm(f => ({ ...f, classeNom: e.target.value }))}
                  placeholder="Ex : L1 GLRS, L2 IAGE…" list="classes-datalist"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                <datalist id="classes-datalist">{classes.map(c => <option key={c} value={c} />)}</datalist>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Module <span className="text-red-500">*</span></label>
                <input type="text" value={form.moduleNom} onChange={e => setForm(f => ({ ...f, moduleNom: e.target.value }))}
                  placeholder="Ex : Bases de données, Réseaux…" list="modules-datalist"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                <datalist id="modules-datalist">{[...new Set(entrees.map(e => e.moduleNom))].sort().map(m => <option key={m} value={m} />)}</datalist>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Volume horaire (heures) <span className="text-red-500">*</span></label>
                <input type="number" min="1" step="0.5" value={form.volumeHoraire} onChange={e => setForm(f => ({ ...f, volumeHoraire: e.target.value }))}
                  placeholder="Ex : 30"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
              </div>
            </div>

            {formError && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                {formError}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
                Annuler
              </button>
              <button onClick={handleSubmit} disabled={saving}
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60 shadow-sm hover:opacity-90 transition-opacity"
                style={{ background: '#C88500' }}>
                {saving ? 'Enregistrement…' : editId ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
