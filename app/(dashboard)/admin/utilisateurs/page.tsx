'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vacataireService, type VacataireResponse } from '@/services/vacataire.service'

export default function AdminUtilisateursPage() {
  const queryClient = useQueryClient()
  const [uploadId, setUploadId] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  const { data: vacataires = [], isLoading, isError } = useQuery({
    queryKey: ['vacataires-admin'],
    queryFn: vacataireService.listerTous,
  })

  const { mutate: uploadSignature, isPending: uploading } = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      vacataireService.uploadSignature(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacataires-admin'] })
      setUploadId(null)
    },
  })

  const filtered = vacataires.filter((v) => {
    const q = search.toLowerCase()
    return (
      v.nom.toLowerCase().includes(q) ||
      v.prenom.toLowerCase().includes(q) ||
      v.email.toLowerCase().includes(q)
    )
  })

  const complets   = vacataires.filter((v) => v.profilComplet).length
  const incomplets = vacataires.length - complets

  return (
    <div>
      {/* En-tête */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dossiers vacataires</h2>
        <p className="mt-1 text-sm text-gray-500">
          Supervision des profils — contrat + signature électronique
        </p>
      </div>

      {/* KPI */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total vacataires</p>
          <p className="mt-1 text-4xl font-bold text-gray-900">{vacataires.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Profils complets</p>
          <p className="mt-1 text-4xl font-bold text-green-600">{complets}</p>
          <p className="text-xs text-gray-400 mt-0.5">contrat actif + signature</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Profils incomplets</p>
          <p className="mt-1 text-4xl font-bold text-orange-500">{incomplets}</p>
          <p className="text-xs text-gray-400 mt-0.5">contrat ou signature manquant</p>
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
            placeholder="Rechercher un vacataire…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        {isLoading && <div className="flex items-center justify-center py-16 text-sm text-gray-400">Chargement…</div>}
        {isError && <div className="flex items-center justify-center py-16 text-sm text-red-500">Erreur de chargement.</div>}

        {!isLoading && !isError && filtered.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Vacataire</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Spécialité</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Contrat actif</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Signature</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Profil complet</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => (
                <tr key={v.id} className={`hover:bg-gray-50 transition-colors ${i === filtered.length - 1 ? '' : 'border-b border-gray-50'}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white uppercase" style={{ background: '#1C0800' }}>
                        {v.prenom[0]}{v.nom[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{v.prenom} {v.nom}</p>
                        <p className="text-xs text-gray-400">{v.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{v.specialite}</td>
                  <td className="px-5 py-4 text-center">
                    <CheckOrCross ok={v.aContratActif} />
                  </td>
                  <td className="px-5 py-4 text-center">
                    <CheckOrCross ok={v.signatureUploaded} />
                  </td>
                  <td className="px-5 py-4 text-center">
                    {v.profilComplet ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        Complet
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-600">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /><circle cx="12" cy="12" r="10" /></svg>
                        Incomplet
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {!v.signatureUploaded && (
                      <>
                        <label
                          htmlFor={`sig-${v.id}`}
                          className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                          style={{ background: '#C88500' }}
                          onClick={() => setUploadId(v.id)}
                        >
                          {uploading && uploadId === v.id ? 'Upload…' : 'Uploader signature'}
                        </label>
                        <input
                          id={`sig-${v.id}`}
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) uploadSignature({ id: v.id, file })
                          }}
                        />
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function CheckOrCross({ ok }: { ok: boolean }) {
  return ok ? (
    <svg className="mx-auto h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ) : (
    <svg className="mx-auto h-5 w-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
