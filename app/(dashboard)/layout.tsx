'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore, roleLabel } from '@/store/auth.store'
import Sidebar from '@/components/layout/Sidebar'
import { notificationService, typeIcon, type NotificationResponse } from '@/services/notification.service'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, _hasHydrated, logout } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!_hasHydrated) return
    if (!user) router.replace('/login')
    else if (user.premierConnexion) router.replace('/changer-mot-de-passe')
  }, [_hasHydrated, user, router])

  if (!_hasHydrated || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-ism-warm">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-ism-gold border-t-transparent" />
      </div>
    )
  }

  const initials = `${user.prenom[0]}${user.nom[0]}`.toUpperCase()

  return (
    <div className="flex h-screen overflow-hidden bg-ism-warm">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header
          className="flex h-[68px] flex-shrink-0 items-center gap-4 border-b px-8 z-20"
          style={{
            background: 'rgba(253,242,236,0.88)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderColor: '#F1E2D4',
          }}
        >
          {/* Search */}
          <div className="flex items-center gap-2.5 rounded-3xl border bg-white px-4 py-2.5 w-72 transition-all focus-within:border-ism-gold" style={{ borderColor: '#E7D3C1' }}>
            <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#8A7256' }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              placeholder="Rechercher un vacataire, module…"
              className="w-full bg-transparent text-sm focus:outline-none"
              style={{ color: '#2B1D10' }}
            />
          </div>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-2">
            {/* Cloche notifications */}
            <NotificationBell />

            {/* Paramètres */}
            <button
              className="flex h-[42px] w-[42px] items-center justify-center rounded-xl border bg-white transition-colors"
              style={{ borderColor: '#E7D3C1', color: '#5C4A38' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#C88500'; (e.currentTarget as HTMLElement).style.color = '#C88500' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#E7D3C1'; (e.currentTarget as HTMLElement).style.color = '#5C4A38' }}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>

            {/* Avatar + rôle */}
            <div
              className="ml-1 flex items-center gap-2.5 cursor-pointer rounded-3xl border px-2 py-1.5 transition-colors"
              style={{ borderColor: 'transparent' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#F1E2D4'; (e.currentTarget as HTMLElement).style.background = '#fff' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ism-900 text-xs font-bold text-ism-gold">
                {initials}
              </div>
              <div className="text-right hidden sm:block pr-1">
                <p className="text-[13px] font-bold leading-tight" style={{ color: '#2B1D10' }}>{user.prenom} {user.nom}</p>
                <p className="text-[11px]" style={{ color: '#8A7256' }}>{roleLabel[user.role]}</p>
              </div>
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
        className="relative flex h-[42px] w-[42px] items-center justify-center rounded-xl border bg-white transition-colors"
        style={{ borderColor: '#E7D3C1', color: '#5C4A38' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#C88500'; (e.currentTarget as HTMLElement).style.color = '#C88500' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#E7D3C1'; (e.currentTarget as HTMLElement).style.color = '#5C4A38' }}
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
