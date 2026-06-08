'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore, roleLabel } from '@/store/auth.store'
import type { Role } from '@/types'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  exact?: boolean
}

const navConfig: Record<Role, NavItem[]> = {
  ADMIN: [
    { label: 'Tableau de bord', href: '/admin', icon: <GridIcon />, exact: true },
    { label: 'Utilisateurs', href: '/admin/utilisateurs', icon: <UsersIcon /> },
    { label: "Logs d'audit", href: '/admin/logs', icon: <LogIcon /> },
  ],
  RESPONSABLE_PROGRAMME: [
    { label: 'Tableau de bord', href: '/responsable', icon: <GridIcon />, exact: true },
    { label: 'Dossiers vacataires', href: '/responsable/vacataires', icon: <FolderIcon /> },
    { label: "Relevés d'heures", href: '/responsable/releves', icon: <ClockIcon /> },
  ],
  ATTACHE_CLASSE: [
    { label: 'Tableau de bord', href: '/attache', icon: <GridIcon />, exact: true },
    { label: "Relevés d'heures", href: '/attache/releves', icon: <ClockIcon /> },
    { label: 'Planning', href: '/attache/planning', icon: <CalendarIcon /> },
  ],
  RELAIS_FINANCE: [
    { label: 'Tableau de bord', href: '/finance', icon: <GridIcon />, exact: true },
    { label: 'Validation relevés', href: '/finance/validations', icon: <CheckSquareIcon /> },
    { label: 'Rémunérations', href: '/finance/remunerations', icon: <MoneyIcon /> },
  ],
  VACATAIRE: [
    { label: 'Tableau de bord', href: '/vacataire', icon: <GridIcon />, exact: true },
    { label: 'Mes relevés validés', href: '/vacataire/releves', icon: <ClockIcon /> },
    { label: 'Mes fiches de paie', href: '/vacataire/fiches-paie', icon: <MoneyIcon /> },
  ],
}

const newDossierHref: Partial<Record<Role, string>> = {
  RESPONSABLE_PROGRAMME: '/responsable/vacataires/nouveau',
  ADMIN: '/admin/utilisateurs/nouveau',
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  if (!user) return null

  const items = navConfig[user.role] ?? []
  const newHref = newDossierHref[user.role]

  const handleLogout = () => {
    logout()
    router.replace('/login')
  }

  return (
    <aside className="flex h-full w-60 flex-shrink-0 flex-col border-r border-gray-100 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-5">
        {/* Icône réseau RHConnect */}
        <svg viewBox="0 0 240 295" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-9 w-8 flex-shrink-0">
          <polygon points="120,80 176,113 176,178 120,210 64,178 64,113" fill="none" stroke="#7A4010" strokeWidth="9" strokeLinejoin="round" />
          <circle cx="120" cy="145" r="11" fill="#7A4010" />
          <circle cx="120" cy="34" r="25" fill="#EDA832" />
          <path d="M90,64 Q120,51 150,64 L145,84 L95,84 Z" fill="#EDA832" />
          <circle cx="24" cy="133" r="20" fill="#C07820" />
          <path d="M0,158 Q24,146 48,158 L45,176 L3,176 Z" fill="#C07820" />
          <circle cx="216" cy="128" r="18" fill="#C07820" />
          <path d="M194,149 Q216,138 238,149 L235,166 L197,166 Z" fill="#C07820" />
          <circle cx="120" cy="238" r="22" fill="#EDA832" />
          <path d="M93,264 Q120,252 147,264 L143,283 L97,283 Z" fill="#EDA832" />
        </svg>
        <div>
          <p className="text-sm font-black" style={{ color: '#EDA832' }}>
            RH<span style={{ color: '#C07820' }}>Connect</span>
          </p>
          <p className="text-xs text-gray-400">Portail vacataires ISM</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {items.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'border-l-[3px] border-ism-gold bg-orange-50 pl-2.5 font-semibold text-ism-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="h-4 w-4 flex-shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 pb-4">
        {newHref && (
          <Link
            href={newHref}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-ism-gold hover:bg-orange-50"
          >
            + Nouveau Dossier
          </Link>
        )}
        <div className="my-2 border-t border-gray-100" />
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-800">
          <span className="h-4 w-4"><HelpIcon /></span>
          Aide
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-800"
        >
          <span className="h-4 w-4"><LogoutIcon /></span>
          Déconnexion
        </button>
      </div>
    </aside>
  )
}

/* ── Inline SVG icons ── */

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  )
}
function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}
function CheckSquareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}
function LogIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}
function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
function MoneyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}
function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}
function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
