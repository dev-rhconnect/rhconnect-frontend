'use client'

import { useRouter } from 'next/navigation'

export default function NouveauRelevePage() {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center justify-center min-h-64 text-center p-8">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
        <span className="text-3xl">ℹ️</span>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Création automatique</h2>
      <p className="text-sm text-gray-500 max-w-sm mb-6">
        Les relevés sont désormais créés automatiquement lorsque vous validez une séance
        comme réalisée dans le calendrier. Un relevé par module et par mois est généré.
      </p>
      <button
        onClick={() => router.push('/attache/releves')}
        className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors"
        style={{ background: '#C88500' }}
      >
        ← Voir mes relevés
      </button>
    </div>
  )
}
