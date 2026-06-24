'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vacataireService, type VacataireResponse, type StatutVacataire } from '@/services/vacataire.service'

const PAGE_SIZE = 10

const statutConfig: Record<StatutVacataire, { label: string; bg: string; color: string; dot: string }> = {
  ACTIF:    { label: 'Actif',     bg: '#F0FDF4', color: '#15803D', dot: '#22C55E' },
  INACTIF:  { label: 'Archivé',  bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF' },
  SUSPENDU: { label: 'Suspendu', bg: '#FEF2F2', color: '#DC2626', dot: '#EF4444' },
}

type Filtre = 'TOUS' | StatutVacataire | 'SANS_CONTRAT' | 'SANS_SIGNATURE'

export default function VacatairesPage() {
  const [search,  setSearch]  = useState('')
  const [filtre,  setFiltre]  = useState<Filtre>('TOUS')
  const [page,    setPage]    = useState(1)
  const queryClient = useQueryClient()

  const { data: vacataires = [], isLoading, isError } = useQuery({
    queryKey: ['vacataires'],
    queryFn: vacataireService.listerTous,
  })

  const { mutate: archiver } = useMutation({
    mutationFn: (id: number) => vacataireService.archiver(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vacataires'] }),
  })

  /* ── Stats pour les chips filtres ── */
  const stats = useMemo(() => ({
    tous:          vacataires.length,
    actifs:        vacataires.filter(v => v.statut === 'ACTIF').length,
    archives:      vacataires.filter(v => v.statut === 'INACTIF').length,
    suspendus:     vacataires.filter(v => v.statut === 'SUSPENDU').length,
    sansContrat:   vacataires.filter(v => !v.aContratActif && v.statut === 'ACTIF').length,
    sansSignature: vacataires.filter(v => !v.signatureUploaded && v.statut === 'ACTIF').length,
  }), [vacataires])

  /* ── Filtrage + recherche ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return vacataires.filter(v => {
      const matchSearch = !q ||
        v.nom.toLowerCase().includes(q) ||
        v.prenom.toLowerCase().includes(q) ||
        v.email.toLowerCase().includes(q) ||
        (v.specialite ?? '').toLowerCase().includes(q)

      const matchFiltre =
        filtre === 'TOUS'            ? true :
        filtre === 'SANS_CONTRAT'   ? (!v.aContratActif && v.statut === 'ACTIF') :
        filtre === 'SANS_SIGNATURE' ? (!v.signatureUploaded && v.statut === 'ACTIF') :
        v.statut === filtre

      return matchSearch && matchFiltre
    })
  }, [vacataires, search, filtre])

  /* ── Pagination ── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const handleFiltre = (f: Filtre) => { setFiltre(f); setPage(1) }
  const handleSearch = (v: string) => { setSearch(v); setPage(1) }

  /* ── Pages à afficher ── */
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
          <h2 className="text-xl font-bold sm:text-2xl text-gray-900">Dossiers vacataires</h2>
          <p className="mt-1 text-sm text-gray-500">{stats.tous} vacataire{stats.tous !== 1 ? 's' : ''} enregistré{stats.tous !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/responsable/vacataires/nouveau"
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity self-start shrink-0"
          style={{ background: '#C88500' }}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nouveau dossier
        </Link>
      </div>

      {/* ── Alertes urgentes ── */}
      {(stats.sansContrat > 0 || stats.sansSignature > 0) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {stats.sansContrat > 0 && (
            <button onClick={() => handleFiltre('SANS_CONTRAT')}
              className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all hover:shadow-md ${filtre === 'SANS_CONTRAT' ? 'border-amber-400 bg-amber-50' : 'border-amber-200 bg-amber-50/60'}`}>
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100">
                <svg className="h-5 w-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-amber-800">{stats.sansContrat} sans contrat actif</p>
                <p className="text-xs text-amber-600">Cliquer pour filtrer</p>
              </div>
            </button>
          )}
          {stats.sansSignature > 0 && (
            <button onClick={() => handleFiltre('SANS_SIGNATURE')}
              className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all hover:shadow-md ${filtre === 'SANS_SIGNATURE' ? 'border-orange-400 bg-orange-50' : 'border-orange-200 bg-orange-50/60'}`}>
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100">
                <svg className="h-5 w-5 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-orange-800">{stats.sansSignature} sans signature</p>
                <p className="text-xs text-orange-600">Cliquer pour filtrer</p>
              </div>
            </button>
          )}
        </div>
      )}

      {/* ── Filtres + recherche ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Chips filtres */}
        <div className="flex items-center gap-1.5 rounded-xl bg-white p-1 shadow-sm border border-gray-100">
          {([
            { id: 'TOUS',            label: 'Tous',         count: stats.tous      },
            { id: 'ACTIF',           label: 'Actifs',       count: stats.actifs    },
            { id: 'INACTIF',         label: 'Archivés',     count: stats.archives  },
            { id: 'SUSPENDU',        label: 'Suspendus',    count: stats.suspendus },
          ] as { id: Filtre; label: string; count: number }[]).map(f => (
            <button key={f.id} onClick={() => handleFiltre(f.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filtre === f.id
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}>
              {f.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${filtre === f.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Recherche */}
        <div className="relative flex-1 max-w-xs ml-auto">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input type="text" value={search} onChange={e => handleSearch(e.target.value)}
            placeholder="Nom, email, spécialité…"
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
              <svg className="h-8 w-8 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {search ? `Aucun résultat pour "${search}"` : 'Aucun vacataire dans cette catégorie'}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {search ? 'Essayez un autre terme de recherche.' : 'Changez de filtre ou créez un nouveau dossier.'}
            </p>
            {!search && (
              <Link href="/responsable/vacataires/nouveau"
                className="mt-4 rounded-xl px-4 py-2 text-xs font-bold text-white"
                style={{ background: '#C88500' }}>
                + Nouveau dossier
              </Link>
            )}
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <>
            <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Vacataire</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Spécialité</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Profil</th>
                  <th className="px-5 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider text-gray-400">Signature</th>
                  <th className="px-5 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider text-gray-400">Contrat</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Statut</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((v) => (
                  <VacataireRow key={v.id} vacataire={v}
                    onArchiver={() => { if (confirm(`Archiver le dossier de ${v.prenom} ${v.nom} ?`)) archiver(v.id) }} />
                ))}
              </tbody>
            </table>
            </div>

            {/* ── Pagination ── */}
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3.5">
              <p className="text-xs text-gray-400">
                {filtered.length === 0 ? '0 résultat' : `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)} sur ${filtered.length}`}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                </button>

                {pageButtons.map((p, i) =>
                  p === '…' ? (
                    <span key={`ellipsis-${i}`} className="flex h-7 w-7 items-center justify-center text-xs text-gray-400">…</span>
                  ) : (
                    <button key={p} onClick={() => setPage(p)}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                        currentPage === p
                          ? 'text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
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

function VacataireRow({ vacataire: v, onArchiver }: { vacataire: VacataireResponse; onArchiver: () => void }) {
  const initiales = (v.prenom[0] ?? '') + (v.nom[0] ?? '')
  const cfg = statutConfig[v.statut]
  const avatarColors = ['#1C0800', '#0F2B4A', '#1A2E05', '#2D0A1F', '#0A2D2D']
  const avatarBg = avatarColors[(v.prenom.charCodeAt(0) + v.nom.charCodeAt(0)) % avatarColors.length]

  return (
    <tr className="group hover:bg-amber-50/30 transition-colors">

      {/* Vacataire */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-ism-gold uppercase ring-2 ring-white"
            style={{ background: avatarBg }}>
            {initiales}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{v.prenom} {v.nom}</p>
            <p className="text-xs text-gray-400 truncate">{v.email}</p>
          </div>
        </div>
      </td>

      {/* Spécialité */}
      <td className="px-5 py-3.5">
        <span className="text-sm text-gray-700">{v.specialite ?? '—'}</span>
      </td>

      {/* Profil */}
      <td className="px-5 py-3.5">
        <span className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
          {v.typeVacataire === 'PROFESSEUR_UNIVERSITAIRE' ? 'Prof. univ.' : 'Standard'}
        </span>
      </td>

      {/* Signature */}
      <td className="px-5 py-3.5 text-center">
        {v.signatureUploaded ? (
          <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ background: '#F0FDF4', color: '#15803D' }}>
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            Déposée
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ background: '#FFF7ED', color: '#C2410C' }}>
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            En attente
          </span>
        )}
      </td>

      {/* Contrat */}
      <td className="px-5 py-3.5 text-center">
        {v.aContratActif ? (
          <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ background: '#F0FDF4', color: '#15803D' }}>
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            Actif
          </span>
        ) : (
          <span className="inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ background: '#F9FAFB', color: '#9CA3AF' }}>
            Aucun
          </span>
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
          <Link href={`/responsable/vacataires/${v.id}`}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
            </svg>
            Dossier
          </Link>
          {v.statut === 'ACTIF' && (
            <button onClick={onArchiver}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" />
              </svg>
              Archiver
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
