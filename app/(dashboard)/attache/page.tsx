'use client'

import Link from 'next/link'
import { useAuthStore } from '@/store/auth.store'

export default function AttacheDashboard() {
  const { user } = useAuthStore()

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Bonjour, {user?.prenom ?? 'Attaché'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Saisissez les heures effectuées et soumettez les relevés mensuels.
          </p>
        </div>
        <Link
          href="/attache/releves/nouveau"
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold text-ism-900 hover:text-ism-gold transition-colors"
        >
          + Saisir des heures
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
              <svg className="h-5 w-5 text-ism-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-ism-gold">Ce mois</span>
          </div>
          <p className="text-sm text-gray-500">Séances saisies</p>
          <p className="mt-1 text-4xl font-bold text-gray-900">—</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
              <svg className="h-5 w-5 text-ism-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-600">Heures</span>
          </div>
          <p className="text-sm text-gray-500">Total heures saisies</p>
          <p className="mt-1 text-4xl font-bold text-gray-900">—</p>
        </div>

        <div className="rounded-2xl border-2 border-orange-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <svg className="h-5 w-5 text-ism-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span className="text-sm font-bold text-ism-gold">Relevés en attente</span>
          </div>
          <p className="text-sm text-gray-700">
            Les relevés du mois en cours à soumettre seront affichés ici.
          </p>
          <Link href="/attache/releves" className="mt-4 inline-flex items-center text-sm font-semibold text-gray-900 hover:text-ism-gold transition-colors">
            Voir mes relevés →
          </Link>
        </div>
      </div>
    </div>
  )
}
