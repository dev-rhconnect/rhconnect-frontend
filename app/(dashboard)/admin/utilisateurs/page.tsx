'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  adminService,
  roleLabel,
  type UtilisateurResponse,
  type Role,
} from '@/services/admin.service'

const roleBadge: Record<Role, string> = {
  ADMIN:                 'bg-purple-100 text-purple-700',
  RESPONSABLE_PROGRAMME: 'bg-blue-100 text-blue-700',
  ATTACHE_CLASSE:        'bg-cyan-100 text-cyan-700',
  RELAIS_FINANCE:        'bg-amber-100 text-amber-800',
  VACATAIRE:             'bg-green-100 text-green-700',
}

const rolesModifiables: { value: Role; label: string }[] = [
  { value: 'RESPONSABLE_PROGRAMME', label: 'Responsable Pédagogique' },
  { value: 'ATTACHE_CLASSE',        label: 'Attaché de Classe' },
  { value: 'RELAIS_FINANCE',        label: 'Relais Finance' },
]

export default function UtilisateursPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleModal, setRoleModal] = useState<{ id: number; roleActuel: Role; nomComplet: string } | null>(null)
  const [nouveauRole, setNouveauRole] = useState<Role>('RESPONSABLE_PROGRAMME')
  const [roleError, setRoleError] = useState<string | null>(null)

  const { data: utilisateurs = [], isLoading } = useQuery({
    queryKey: ['admin', 'utilisateurs'],
    queryFn: adminService.listerUtilisateurs,
  })

  const { mutate: activer } = useMutation({
    mutationFn: adminService.activer,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'utilisateurs'] }),
  })

  const { mutate: desactiver } = useMutation({
    mutationFn: adminService.desactiver,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'utilisateurs'] }),
  })

  const { mutate: changerRole, isPending: changementEnCours } = useMutation({
    mutationFn: ({ id, role }: { id: number; role: Role }) =>
      adminService.changerRole(id, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'utilisateurs'] })
      setRoleModal(null)
      setRoleError(null)
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erreur lors du changement de rôle.'
      setRoleError(msg)
    },
  })

  const filtres = utilisateurs.filter((u) => {
    const q = search.toLowerCase()
    return (
      u.nom.toLowerCase().includes(q) ||
      u.prenom.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    )
  })

  const ouvrirModalRole = (u: UtilisateurResponse) => {
    // Préselectionner le premier rôle DIFFÉRENT du rôle actuel
    const autreRole = rolesModifiables.find((r) => r.value !== u.role)?.value ?? 'ATTACHE_CLASSE'
    setNouveauRole(autreRole as Role)
    setRoleError(null)
    setRoleModal({ id: u.id, roleActuel: u.role, nomComplet: `${u.prenom} ${u.nom}` })
  }

  return (
    <div>
      {/* En-tête */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Utilisateurs</h2>
          <p className="mt-1 text-sm text-gray-500">
            Gestion des comptes — {utilisateurs.length} compte{utilisateurs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/admin/utilisateurs/nouveau"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#1C0800' }}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nouveau compte
        </Link>
      </div>

      {/* Barre de recherche */}
      <div className="relative mb-5 max-w-sm">
        <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un utilisateur…"
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ism-gold/40"
        />
      </div>

      {/* Tableau */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        {isLoading && (
          <div className="flex items-center justify-center py-12 text-sm text-gray-400">Chargement…</div>
        )}

        {!isLoading && filtres.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="mb-3 h-12 w-12 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <p className="text-sm font-medium text-gray-900">Aucun utilisateur trouvé</p>
          </div>
        )}

        {!isLoading && filtres.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Nom</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Email</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Rôle</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Statut</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Depuis</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtres.map((u, i) => (
                <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${i < filtres.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                           style={{ background: '#1C0800' }}>
                        {`${u.prenom[0]}${u.nom[0]}`.toUpperCase()}
                      </div>
                      <p className="font-semibold text-gray-900">{u.prenom} {u.nom}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{u.email}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleBadge[u.role]}`}>
                      {roleLabel[u.role]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      u.actif ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${u.actif ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {u.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">
                    {new Date(u.dateCreation).toLocaleDateString('fr-SN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {/* Changer rôle — pas pour Admin IT ni Vacataire */}
                      {u.role !== 'ADMIN' && u.role !== 'VACATAIRE' && (
                        <button
                          onClick={() => ouvrirModalRole(u)}
                          className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                          title="Changer le rôle"
                        >
                          Rôle
                        </button>
                      )}
                      {u.actif ? (
                        <button
                          onClick={() => desactiver(u.id)}
                          className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Désactiver
                        </button>
                      ) : (
                        <button
                          onClick={() => activer(u.id)}
                          className="rounded-lg border border-green-200 px-3 py-1 text-xs font-medium text-green-600 hover:bg-green-50 transition-colors"
                        >
                          Activer
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal changement de rôle */}
      {roleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-1 text-lg font-bold text-gray-900">Modifier le rôle</h3>
            <p className="mb-1 text-sm text-gray-700 font-medium">{roleModal.nomComplet}</p>
            <p className="mb-5 text-sm text-gray-500">
              Rôle actuel :&nbsp;
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${roleBadge[roleModal.roleActuel]}`}>
                {roleLabel[roleModal.roleActuel]}
              </span>
            </p>

            <label className="mb-1.5 block text-sm font-medium text-gray-700">Nouveau rôle</label>
            <select
              value={nouveauRole}
              onChange={(e) => { setNouveauRole(e.target.value as Role); setRoleError(null) }}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ism-gold/40"
            >
              {rolesModifiables.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>

            {roleError && (
              <p className="mt-2 text-xs text-red-600">{roleError}</p>
            )}

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => { setRoleModal(null); setRoleError(null) }}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => changerRole({ id: roleModal.id, role: nouveauRole })}
                disabled={changementEnCours}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                style={{ background: '#C88500' }}
              >
                {changementEnCours && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                  </svg>
                )}
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
