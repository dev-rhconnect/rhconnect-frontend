'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore, roleLabel } from '@/store/auth.store'
import Sidebar from '@/components/layout/Sidebar'
import { notificationService, typeIcon, type NotificationResponse } from '@/services/notification.service'
import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, _hasHydrated, logout } = useAuthStore()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!_hasHydrated) return
    if (!user) router.replace('/login')
    else if (user.premierConnexion) router.replace('/changer-mot-de-passe')
  }, [_hasHydrated, user, router])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!_hasHydrated || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-ism-warm">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-ism-gold border-t-transparent" />
      </div>
    )
  }

  const initials = `${user.prenom[0]}${user.nom[0]}`.toUpperCase()

  function handleLogout() {
    logout()
    router.replace('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-ism-warm">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(v => !v)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 flex-shrink-0 items-center gap-4 border-b border-gray-100 bg-white px-6">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Rechercher..."
              className="w-full rounded-full bg-gray-100 py-2 pl-9 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ism-gold/40"
            />
          </div>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-1">
            {/* Cloche notifications */}
            <NotificationBell />

            {/* Avatar + menu profil */}
            <div ref={profileRef} className="relative ml-1">
              <button
                onClick={() => setProfileOpen(o => !o)}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-gray-100 transition-colors"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-gray-900">{user.prenom} {user.nom}</p>
                  <p className="text-xs text-gray-400">{roleLabel[user.role]}</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ism-900 text-xs font-bold text-ism-gold ring-2 ring-ism-gold/20">
                  {initials}
                </div>
                <svg className="h-3.5 w-3.5 text-gray-400 hidden sm:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl bg-white shadow-xl ring-1 ring-gray-100 overflow-hidden">
                  {/* Infos utilisateur */}
                  <div className="border-b border-gray-100 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ism-900 text-sm font-bold text-ism-gold">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{user.prenom} {user.nom}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        <span className="mt-0.5 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                          {roleLabel[user.role]}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="py-1.5">
                    <Link
                      href="/changer-mot-de-passe"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      Changer le mot de passe
                    </Link>
                  </div>

                  <div className="border-t border-gray-100 py-1.5">
                    <button
                      onClick={() => { setProfileOpen(false); handleLogout() }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Se déconnecter
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   Composant cloche notifications — Diaynaba SOW Sprint 1
   ══════════════════════════════════════════════════════ */
function NotificationBell() {
  const [ouvert, setOuvert] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  // Fermer en cliquant hors du dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOuvert(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { data: notifs = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.mesDernieres,
    refetchInterval: 30_000, // rafraîchir toutes les 30 s
  })

  const nbNonLues = notifs.filter((n) => !n.lu).length

  const { mutate: marquerLue } = useMutation({
    mutationFn: (id: number) => notificationService.marquerLue(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const { mutate: toutMarquer } = useMutation({
    mutationFn: notificationService.marquerToutesLues,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOuvert((o) => !o)}
        className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {nbNonLues > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: '#C88500' }}>
            {nbNonLues > 9 ? '9+' : nbNonLues}
          </span>
        )}
      </button>

      {ouvert && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl bg-white shadow-xl ring-1 ring-gray-100 overflow-hidden">
          {/* En-tête dropdown */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-bold text-gray-900">
              Notifications {nbNonLues > 0 && <span className="ml-1 text-xs font-normal text-gray-400">({nbNonLues} non lue{nbNonLues > 1 ? 's' : ''})</span>}
            </span>
            {nbNonLues > 0 && (
              <button
                onClick={() => toutMarquer()}
                className="text-xs font-semibold hover:underline"
                style={{ color: '#C88500' }}
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {/* Liste */}
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <svg className="mb-2 h-8 w-8 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <p className="text-xs text-gray-400">Aucune notification</p>
              </div>
            ) : (
              notifs.map((n) => (
                <NotifItem key={n.id} notif={n} onLire={() => { if (!n.lu) marquerLue(n.id) }} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NotifItem({ notif: n, onLire }: { notif: NotificationResponse; onLire: () => void }) {
  const tempsEcoule = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const min = Math.floor(diff / 60000)
    if (min < 1) return 'À l\'instant'
    if (min < 60) return `Il y a ${min} min`
    const h = Math.floor(min / 60)
    if (h < 24) return `Il y a ${h} h`
    return `Il y a ${Math.floor(h / 24)} j`
  }

  return (
    <button
      onClick={onLire}
      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${!n.lu ? 'bg-amber-50/40' : ''}`}
    >
      <span className="flex-shrink-0 text-lg">{typeIcon[n.type]}</span>
      <div className="min-w-0 flex-1">
        <p className={`text-xs leading-snug ${!n.lu ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
          {n.message}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">{tempsEcoule(n.dateEnvoi)}</p>
      </div>
      {!n.lu && (
        <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full" style={{ background: '#C88500' }} />
      )}
    </button>
  )
}
