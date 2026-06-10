'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService, type UtilisateurResponse, type CreateUserRequest } from '@/services/admin.service'

const ROLES_ADMIN = ['RESPONSABLE_PROGRAMME', 'ATTACHE_CLASSE', 'RELAIS_FINANCE', 'ADMIN'] as const
type RoleAdmin = typeof ROLES_ADMIN[number]

const roleConfig: Record<RoleAdmin, { label: string; className: string }> = {
  ADMIN:                  { label: 'Admin IT',         className: 'bg-gray-100 text-gray-700' },
  RESPONSABLE_PROGRAMME:  { label: 'Resp. Programme',  className: 'bg-blue-50 text-blue-700'  },
  ATTACHE_CLASSE:         { label: 'Attaché Classe',   className: 'bg-purple-50 text-purple-700' },
  RELAIS_FINANCE:         { label: 'Relais Finance',   className: 'bg-green-50 text-green-700' },
}

function CreateCompteModal({
  onClose,
  onConfirm,
  saving,
}: {
  onClose: () => void
  onConfirm: (data: CreateUserRequest) => void
  saving: boolean
}) {
  const [form, setForm] = useState<CreateUserRequest>({
    prenom: '',
    nom: '',
    email: '',
    role: 'RESPONSABLE_PROGRAMME',
    motDePasseTemporaire: '',
  })

  const set = (k: keyof CreateUserRequest, v: string) =>
    setForm((f) => ({ ...f, [k]: v }))

  const valid = form.prenom.trim() && form.nom.trim() && form.email.trim() && form.role

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Créer un compte</h3>
            <p className="mt-0.5 text-xs text-gray-500">L'utilisateur recevra un mot de passe temporaire</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">Prénom <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.prenom}
                onChange={(e) => set('prenom', e.target.value)}
                placeholder="Aminata"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">Nom <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => set('nom', e.target.value)}
                placeholder="Diallo"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">Email <span className="text-red-500">*</span></label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="aminata.diallo@ism.edu.sn"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">Rôle <span className="text-red-500">*</span></label>
            <select
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
            >
              <option value="RESPONSABLE_PROGRAMME">Responsable de Programme</option>
              <option value="ATTACHE_CLASSE">Attaché de Classe</option>
              <option value="RELAIS_FINANCE">Relais Finance</option>
              <option value="ADMIN">Admin IT</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
              Mot de passe temporaire
              <span className="ml-1 text-gray-400 font-normal">(optionnel)</span>
            </label>
            <input
              type="text"
              value={form.motDePasseTemporaire}
              onChange={(e) => set('motDePasseTemporaire', e.target.value)}
              placeholder="Laissez vide pour le mot de passe par défaut"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
            Annuler
          </button>
          <button
            onClick={() => {
              if (!valid) return
              const payload = { ...form }
              if (!payload.motDePasseTemporaire?.trim()) delete payload.motDePasseTemporaire
              onConfirm(payload)
            }}
            disabled={!valid || saving}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
            style={{ background: '#C88500' }}
          >
            {saving ? (
              <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>Création…</>
            ) : (
              <><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>Créer le compte</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminUtilisateursPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const { data: tous = [], isLoading, isError } = useQuery({
    queryKey: ['utilisateurs-admin'],
    queryFn: adminService.listerUtilisateurs,
  })

  const utilisateurs = tous.filter((u) => (ROLES_ADMIN as readonly string[]).includes(u.role))

  const { mutate: creer, isPending: creating } = useMutation({
    mutationFn: adminService.creerCompte,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilisateurs-admin'] })
      setShowCreate(false)
    },
  })

  const { mutate: toggleActif } = useMutation({
    mutationFn: ({ id, actif }: { id: number; actif: boolean }) =>
      actif ? adminService.desactiver(id) : adminService.activer(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['utilisateurs-admin'] }),
  })

  const filtered = utilisateurs.filter((u) => {
    const q = search.toLowerCase()
    return (
      u.nom.toLowerCase().includes(q) ||
      u.prenom.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    )
  })

  const parRole = (role: RoleAdmin) => utilisateurs.filter((u) => u.role === role).length
  const enAttente = utilisateurs.filter((u) => u.premierConnexion).length

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Comptes utilisateurs</h2>
          <p className="mt-1 text-sm text-gray-500">
            Gérez les accès de l'équipe administrative ISM
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
          Créer un compte
        </button>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {([
          { role: 'RESPONSABLE_PROGRAMME', label: 'Resp. Programme', color: 'text-blue-600', bg: 'bg-blue-50' },
          { role: 'ATTACHE_CLASSE',        label: 'Attachés Classe', color: 'text-purple-600', bg: 'bg-purple-50' },
          { role: 'RELAIS_FINANCE',        label: 'Relais Finance',  color: 'text-green-600', bg: 'bg-green-50' },
        ] as const).map((item) => (
          <div key={item.role} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className={`mb-3 inline-flex h-8 w-8 items-center justify-center rounded-xl ${item.bg}`}>
              <svg className={`h-4 w-4 ${item.color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <p className="text-xs text-gray-500">{item.label}</p>
            <p className={`mt-0.5 text-3xl font-bold ${item.color}`}>{parRole(item.role)}</p>
          </div>
        ))}

        <div className={`rounded-2xl p-5 shadow-sm ${enAttente > 0 ? 'border-2 border-amber-200 bg-amber-50' : 'bg-white'}`}>
          <div className={`mb-3 inline-flex h-8 w-8 items-center justify-center rounded-xl ${enAttente > 0 ? 'bg-amber-100' : 'bg-orange-50'}`}>
            <svg className={`h-4 w-4 ${enAttente > 0 ? 'text-amber-500' : 'text-ism-gold'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <p className="text-xs text-gray-500">En attente 1ère connexion</p>
          <p className={`mt-0.5 text-3xl font-bold ${enAttente > 0 ? 'text-amber-600' : 'text-gray-900'}`}>{enAttente}</p>
        </div>
      </div>

      {/* Recherche */}
      <div className="mb-4">
        <div className="relative max-w-sm">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un compte…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        {isLoading && <div className="flex items-center justify-center py-16 text-sm text-gray-400">Chargement…</div>}
        {isError && <div className="flex items-center justify-center py-16 text-sm text-red-500">Erreur de chargement.</div>}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="mb-3 h-10 w-10 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <p className="text-sm font-medium text-gray-900">
              {search ? 'Aucun résultat' : 'Aucun compte créé'}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {search ? 'Essayez un autre terme.' : 'Créez le premier compte.'}
            </p>
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Utilisateur</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Rôle</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Statut</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">1ère connexion</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                const cfg = roleConfig[u.role as RoleAdmin]
                const initiales = (u.prenom[0] ?? '') + (u.nom[0] ?? '')
                return (
                  <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${i === filtered.length - 1 ? '' : 'border-b border-gray-50'}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white uppercase" style={{ background: '#1C0800' }}>
                          {initiales}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{u.prenom} {u.nom}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg?.className ?? 'bg-gray-100 text-gray-600'}`}>
                        {cfg?.label ?? u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {u.actif ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600">
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                          Désactivé
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {u.premierConnexion ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                          En attente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          Effectuée
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => toggleActif({ id: u.id, actif: u.actif })}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                          u.actif
                            ? 'text-red-500 hover:bg-red-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {u.actif ? 'Désactiver' : 'Activer'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <CreateCompteModal
          saving={creating}
          onClose={() => setShowCreate(false)}
          onConfirm={(data) => creer(data)}
        />
      )}
    </div>
  )
}
