'use client'

import Link from 'next/link'
import { useAuthStore } from '@/store/auth.store'

export default function VacataireDashboard() {
  const { user } = useAuthStore()

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Bonjour, {user?.prenom ?? 'Vacataire'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Consultez votre contrat, vos heures effectuées et vos fiches de paie.
          </p>
        </div>
        <Link
          href="/vacataire/contrat"
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold text-ism-900 hover:text-ism-gold transition-colors"
        >
          Mon contrat →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
              <svg className="h-5 w-5 text-ism-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-600">Actif</span>
          </div>
          <p className="text-sm text-gray-500">Heures contractuelles</p>
          <p className="mt-1 text-4xl font-bold text-gray-900">— h</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
              <svg className="h-5 w-5 text-ism-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-ism-gold">Ce semestre</span>
          </div>
          <p className="text-sm text-gray-500">Heures effectuées</p>
          <p className="mt-1 text-4xl font-bold text-gray-900">— h</p>
          <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
            <div className="h-2 rounded-full bg-ism-gold" style={{ width: '0%' }} />
          </div>
        </div>

        <div className="rounded-2xl border-2 border-orange-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <svg className="h-5 w-5 text-ism-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span className="text-sm font-bold text-ism-gold">Mes rémunérations</span>
          </div>
          <p className="text-sm text-gray-700">
            Vos fiches de paie disponibles seront accessibles ici dès validation.
          </p>
          <Link href="/vacataire/fiches-paie" className="mt-4 inline-flex items-center text-sm font-semibold text-gray-900 hover:text-ism-gold transition-colors">
            Voir mes fiches de paie →
          </Link>
        </div>
      </div>
    </div>
  )
}
