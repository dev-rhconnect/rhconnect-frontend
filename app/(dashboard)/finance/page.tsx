'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useQuery } from '@tanstack/react-query'
import { releveService } from '@/services/releve.service'
import { paiementService } from '@/services/paiement.service'
import { rapportService } from '@/services/rapport.service'

export default function FinanceDashboard() {
  const { user } = useAuthStore()

  const moisCourant = new Date().toISOString().slice(0, 7)
  const [exportMois, setExportMois] = useState(moisCourant)
  const [exporting, setExporting] = useState<null | 'pdf' | 'excel'>(null)

  const { data: soumis    = [] } = useQuery({ queryKey: ['releves-soumis'], queryFn: releveService.listerSoumis })
  const { data: paiements = [] } = useQuery({ queryKey: ['paiements'], queryFn: paiementService.listerTous })
  const { data: equipe    = [] } = useQuery({ queryKey: ['releves-equipe'], queryFn: releveService.equipe })

  const totalAValider  = soumis.length
  const montantTotal   = paiements.reduce((sum, p) => sum + (p.montantNet ?? 0), 0)
  const totalPaiements = paiements.length

  // KPI : relevés avec écart volume horaire (heures validées > volume prévu)
  const ecarts = equipe.filter((r) => {
    if (!r.volumeHorairePrevisionnel || r.volumeHorairePrevisionnel === 0) return false
    return r.totalHeuresValidees > r.volumeHorairePrevisionnel
  })

  const handleExport = async (format: 'pdf' | 'excel') => {
    setExporting(format)
    try {
      if (format === 'pdf')   await rapportService.telechargerFinancePdf(exportMois)
      else                    await rapportService.telechargerFinanceExcel(exportMois)
    } finally {
      setExporting(null)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Bonjour, {user?.prenom ?? 'Relais Finance'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Validez les relevés d'heures et supervisez les rémunérations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export paiements */}
          <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2">
            <input
              type="month"
              value={exportMois}
              onChange={(e) => setExportMois(e.target.value)}
              className="text-xs text-gray-600 focus:outline-none"
            />
            <button
              onClick={() => handleExport('pdf')}
              disabled={exporting !== null}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-60 transition-opacity"
              style={{ background: '#7A4010' }}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {exporting === 'pdf' ? '...' : 'PDF'}
            </button>
            <button
              onClick={() => handleExport('excel')}
              disabled={exporting !== null}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-60 transition-opacity"
              style={{ background: '#2E7D32' }}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {exporting === 'excel' ? '...' : 'Excel'}
            </button>
          </div>
          <Link
            href="/finance/validations"
            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
            style={{ background: '#C88500' }}
          >
            Voir les validations
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* Relevés à valider */}
        <div className={`rounded-2xl p-5 shadow-sm ${totalAValider > 0 ? 'border-2 border-blue-200 bg-blue-50' : 'bg-white'}`}>
          <div className="mb-4 flex items-start justify-between">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${totalAValider > 0 ? 'bg-blue-100' : 'bg-orange-50'}`}>
              <svg className={`h-5 w-5 ${totalAValider > 0 ? 'text-blue-600' : 'text-ism-gold'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <Link href="/finance/validations" className={`rounded-full px-2 py-0.5 text-xs font-semibold transition-colors ${totalAValider > 0 ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-orange-50 text-ism-gold hover:bg-orange-100'}`}>
              Traiter →
            </Link>
          </div>
          <p className="text-sm text-gray-500">Relevés à valider</p>
          <p className={`mt-1 text-4xl font-bold ${totalAValider > 0 ? 'text-blue-600' : 'text-gray-900'}`}>{totalAValider}</p>
        </div>

        {/* Fiches de paie */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
              <svg className="h-5 w-5 text-ism-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-600">Total</span>
          </div>
          <p className="text-sm text-gray-500">Fiches de paie générées</p>
          <p className="mt-1 text-4xl font-bold text-gray-900">{totalPaiements}</p>
        </div>

        {/* Montant net total */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
              <svg className="h-5 w-5 text-ism-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-ism-gold">FCFA</span>
          </div>
          <p className="text-sm text-gray-500">Montant net total</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {montantTotal.toLocaleString('fr-FR')}
          </p>
        </div>

        {/* Écarts volume horaire */}
        <div className={`rounded-2xl p-5 shadow-sm ${ecarts.length > 0 ? 'border-2 border-amber-200 bg-amber-50' : 'bg-white'}`}>
          <div className="mb-3 flex items-center gap-2">
            <svg className={`h-5 w-5 ${ecarts.length > 0 ? 'text-amber-500' : 'text-ism-gold'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <span className={`text-sm font-bold ${ecarts.length > 0 ? 'text-amber-700' : 'text-ism-gold'}`}>
              Écarts volume
            </span>
          </div>
          {ecarts.length > 0 ? (
            <>
              <p className="text-3xl font-bold text-amber-700">{ecarts.length}</p>
              <p className="mt-1 text-xs text-amber-600">relevé{ecarts.length !== 1 ? 's' : ''} dépassant le volume prévu</p>
            </>
          ) : (
            <p className="text-sm text-gray-600">Aucun écart de volume horaire détecté.</p>
          )}
        </div>
      </div>

      {/* Accès rapides + relevés en attente */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-gray-900">Accès rapides</h3>
          <div className="space-y-2">
            {[
              { label: 'Validation des relevés',  href: '/finance/validations',  desc: 'Valider ou rejeter les relevés soumis' },
              { label: 'Rémunérations',           href: '/finance/remunerations', desc: 'Gérer les fiches de paie et paiements' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-xl px-4 py-3 hover:bg-orange-50 transition-colors group"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-ism-gold transition-colors">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
                <svg className="h-4 w-4 text-gray-300 group-hover:text-ism-gold transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-gray-900">Relevés en attente</h3>
          {soumis.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <svg className="mb-2 h-8 w-8 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12" /></svg>
              <p className="text-xs text-gray-400">Aucun relevé en attente de validation</p>
            </div>
          ) : (
            <div className="space-y-2">
              {soumis.slice(0, 4).map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{r.nomVacataire}</p>
                    <p className="text-xs text-gray-500">{r.module} — {r.periode}</p>
                  </div>
                  <span className="text-xs font-semibold text-blue-700">
                    {r.totalHeuresValidees.toFixed(1)} h
                  </span>
                </div>
              ))}
              {soumis.length > 4 && (
                <Link href="/finance/validations" className="block text-center text-xs font-semibold text-ism-gold hover:text-ism-900 transition-colors pt-1">
                  +{soumis.length - 4} autres →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
