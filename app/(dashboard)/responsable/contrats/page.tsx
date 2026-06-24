'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { contratService, type ContratResponse } from '@/services/contrat.service'

const PAGE_SIZE = 10

const statutConfig: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  ACTIF:   { label: 'Actif',    bg: '#F0FDF4', color: '#15803D', dot: '#22C55E' },
  EXPIRE:  { label: 'Expiré',  bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF' },
  RESILIE: { label: 'Résilié', bg: '#FEF2F2', color: '#DC2626', dot: '#EF4444' },
}

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function joursRestants(dateFin: string) {
  return Math.ceil((new Date(dateFin + 'T00:00:00').getTime() - Date.now()) / 86400000)
}

type Filtre = '' | 'ACTIF' | 'EXPIRE' | 'RESILIE' | 'EXPIRE_BIENTOT' | 'AVENANT'

export default function ContratsPage() {
  const [search,  setSearch]  = useState('')
  const [filtre,  setFiltre]  = useState<Filtre>('ACTIF')
  const [page,    setPage]    = useState(1)

  const { data: contrats = [], isLoading, isError } = useQuery({
    queryKey: ['contrats-tous'],
    queryFn: contratService.listerTous,
  })

  /* ── Stats ── */
  const stats = useMemo(() => ({
    tous:         contrats.length,
    actifs:       contrats.filter(c => c.statut === 'ACTIF').length,
    expires:      contrats.filter(c => c.statut === 'EXPIRE').length,
    resilies:     contrats.filter(c => c.statut === 'RESILIE').length,
    avenants:     contrats.filter(c => c.estAvenant).length,
    expireBientot: contrats.filter(c => c.statut === 'ACTIF' && joursRestants(c.dateFin) <= 30 && joursRestants(c.dateFin) > 0).length,
  }), [contrats])

  /* ── Filtrage ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return contrats.filter(c => {
      const modulesStr = (c.modules ?? []).map(m => m.nomModule).join(' ').toLowerCase()
      const matchSearch = !q || c.nomVacataire.toLowerCase().includes(q) || modulesStr.includes(q)
      const matchFiltre =
        filtre === ''              ? true :
        filtre === 'EXPIRE_BIENTOT' ? (c.statut === 'ACTIF' && joursRestants(c.dateFin) <= 30 && joursRestants(c.dateFin) > 0) :
        filtre === 'AVENANT'       ? c.estAvenant :
        c.statut === filtre
      return matchSearch && matchFiltre
    })
  }, [contrats, search, filtre])

  /* ── Pagination ── */
  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated   = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const handleFiltre = (f: Filtre) => { setFiltre(f); setPage(1) }
  const handleSearch = (v: string) => { setSearch(v); setPage(1) }

  const pageButtons = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | '…')[] = [1]
    if (currentPage > 3) pages.push('…')
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i)
    if (currentPage < totalPages - 2) pages.push('…')
    pages.push(totalPages)
    return pages
  }, [totalPages, currentPage])

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Contrats</h2>
          <p className="mt-1 text-sm text-gray-500">
            {stats.tous} contrat{stats.tous !== 1 ? 's' : ''} — {stats.actifs} actif{stats.actifs !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/responsable/vacataires"
          className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-100 transition-colors self-start">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
          </svg>
          Créer via le dossier vacataire
        </Link>
      </div>

      {/* ── Alerte expiration imminente ── */}
      {stats.expireBientot > 0 && (
        <button onClick={() => handleFiltre('EXPIRE_BIENTOT')}
          className={`w-full flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all hover:shadow-md ${filtre === 'EXPIRE_BIENTOT' ? 'border-amber-400 bg-amber-50' : 'border-amber-200 bg-amber-50/60'}`}>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100">
            <svg className="h-5 w-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-amber-800">
              {stats.expireBientot} contrat{stats.expireBientot !== 1 ? 's' : ''} expire{stats.expireBientot === 1 ? '' : 'nt'} dans moins de 30 jours
            </p>
            <p className="text-xs text-amber-600">Cliquer pour filtrer — pensez à renouveler ou créer un avenant</p>
          </div>
          <svg className="ml-auto h-4 w-4 text-amber-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      )}

      {/* ── Filtres + recherche ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-xl bg-white p-1 shadow-sm border border-gray-100">
          {([
            { id: '',              label: 'Tous',            count: stats.tous     },
            { id: 'ACTIF',        label: 'Actifs',          count: stats.actifs   },
            { id: 'EXPIRE',       label: 'Expirés',         count: stats.expires  },
            { id: 'RESILIE',      label: 'Résiliés',        count: stats.resilies },
            { id: 'AVENANT',      label: 'Avenants',        count: stats.avenants },
          ] as { id: Filtre; label: string; count: number }[]).map(f => (
            <button key={f.id} onClick={() => handleFiltre(f.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filtre === f.id ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}>
              {f.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${filtre === f.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs ml-auto">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input type="text" value={search} onChange={e => handleSearch(e.target.value)}
            placeholder="Vacataire, module…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400 shadow-sm" />
          {search && (
            <button onClick={() => handleSearch('')} className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Tableau ── */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden border border-gray-100">

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
          </div>
        )}
        {isError && (
          <div className="flex items-center justify-center py-20 text-sm text-red-500">Erreur de chargement.</div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50">
              <svg className="h-8 w-8 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {search ? `Aucun résultat pour "${search}"` : 'Aucun contrat dans cette catégorie'}
            </p>
            <p className="mt-1 text-xs text-gray-400">Changez de filtre ou créez un contrat depuis le dossier vacataire.</p>
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <>
            <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Vacataire</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Année</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Modules</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Période</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Expiration</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Statut</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map(c => <ContratRow key={c.id} c={c} />)}
              </tbody>
            </table>
          </div>

            {/* ── Pagination ── */}
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3.5">
              <p className="text-xs text-gray-400">
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} sur {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                {pageButtons.map((p, i) =>
                  p === '…' ? (
                    <span key={`e-${i}`} className="flex h-7 w-7 items-center justify-center text-xs text-gray-400">…</span>
                  ) : (
                    <button key={p} onClick={() => setPage(p)}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${currentPage === p ? 'text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                      style={currentPage === p ? { background: '#C88500' } : {}}>
                      {p}
                    </button>
                  )
                )}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ContratRow({ c }: { c: ContratResponse }) {
  const cfg = statutConfig[c.statut] ?? { label: c.statut, bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF' }
  const initiales = c.nomVacataire.split(' ').map(p => p[0]).slice(0, 2).join('')
  const mods = c.modules ?? []
  const jours = joursRestants(c.dateFin)
  const expireBientot = c.statut === 'ACTIF' && jours > 0 && jours <= 30

  return (
    <tr className="group hover:bg-amber-50/30 transition-colors">

      {/* Vacataire */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-ism-gold uppercase ring-2 ring-white"
            style={{ background: '#1C0800' }}>
            {initiales}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Link href={`/responsable/vacataires/${c.vacataireId}`}
                className="font-semibold text-gray-900 hover:text-amber-700 truncate">
                {c.nomVacataire}
              </Link>
              {c.estAvenant && (
                <span className="inline-flex rounded-md bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-100 flex-shrink-0">
                  Avenant
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Année */}
      <td className="px-5 py-3.5">
        <span className="inline-flex rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
          {c.anneeAcademique}
        </span>
      </td>

      {/* Modules */}
      <td className="px-5 py-3.5 max-w-[200px]">
        {mods.length === 0 ? (
          <span className="text-xs text-gray-300">—</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {mods.slice(0, 2).map(m => (
              <span key={m.id} className="inline-flex rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-100">
                {m.nomModule}
              </span>
            ))}
            {mods.length > 2 && (
              <span className="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                +{mods.length - 2}
              </span>
            )}
          </div>
        )}
      </td>

      {/* Période */}
      <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">
        <div className="flex items-center gap-1">
          <span>{formatDate(c.dateDebut)}</span>
          <svg className="h-3 w-3 text-gray-300 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          <span>{formatDate(c.dateFin)}</span>
        </div>
      </td>

      {/* Expiration */}
      <td className="px-5 py-3.5">
        {c.statut !== 'ACTIF' ? (
          <span className="text-xs text-gray-300">—</span>
        ) : jours <= 0 ? (
          <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ background: '#FEF2F2', color: '#DC2626' }}>
            Expiré
          </span>
        ) : expireBientot ? (
          <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ background: '#FFFBEB', color: '#B45309' }}>
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            {jours}j
          </span>
        ) : (
          <span className="text-xs text-gray-400">{jours}j</span>
        )}
      </td>

      {/* Statut */}
      <td className="px-5 py-3.5">
        <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
          style={{ background: cfg.bg, color: cfg.color }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot }} />
          {cfg.label}
        </span>
      </td>

      {/* Actions */}
      <td className="px-5 py-3.5">
        <div className="flex items-center justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
          <Link href={`/responsable/contrats/${c.id}`}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            Détails
          </Link>
          {c.statut === 'ACTIF' && !c.estAvenant && (
            <Link href={`/responsable/contrats/${c.id}/avenant/nouveau`}
              className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-all">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Avenant
            </Link>
          )}
        </div>
      </td>
    </tr>
  )
}
