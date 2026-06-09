'use client'

import { useCallback, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vacataireService } from '@/services/vacataire.service'

function UploadSignatureModal({
  vacataireNom,
  onClose,
  onConfirm,
  uploading,
}: {
  vacataireNom: string
  onClose: () => void
  onConfirm: (file: File) => void
  uploading: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = (f: File) => setFile(f)

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Signature électronique</h3>
            <p className="mt-0.5 text-xs text-gray-500">{vacataireNom}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Zone drag-and-drop */}
          {!file ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 transition-colors ${
                dragging
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-gray-200 bg-gray-50 hover:border-amber-300 hover:bg-amber-50/40'
              }`}
            >
              <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${dragging ? 'bg-amber-100' : 'bg-white shadow-sm'}`}>
                <svg className={`h-7 w-7 transition-colors ${dragging ? 'text-amber-500' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-700">
                {dragging ? 'Relâchez pour importer' : 'Déposez le fichier ici'}
              </p>
              <p className="mt-1 text-xs text-gray-400">ou{' '}
                <span className="font-semibold" style={{ color: '#C88500' }}>
                  sélectionnez depuis votre ordinateur
                </span>
              </p>
              <p className="mt-3 text-xs text-gray-300">PNG, JPG, PDF — max 5 Mo</p>
            </div>
          ) : (
            /* Aperçu fichier sélectionné */
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                  {file.type.startsWith('image/') ? (
                    <svg className="h-6 w-6 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                  ) : (
                    <svg className="h-6 w-6 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>

              {/* Miniature si image */}
              {file.type.startsWith('image/') && (
                <div className="mt-3 overflow-hidden rounded-xl border border-gray-100">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Aperçu signature"
                    className="h-28 w-full object-contain bg-white"
                  />
                </div>
              )}

              <button
                onClick={() => inputRef.current?.click()}
                className="mt-3 text-xs font-semibold hover:underline"
                style={{ color: '#C88500' }}
              >
                Changer de fichier
              </button>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
              e.target.value = ''
            }}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => file && onConfirm(file)}
            disabled={!file || uploading}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
            style={{ background: '#C88500' }}
          >
            {uploading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                Upload en cours…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                Confirmer l'upload
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminUtilisateursPage() {
  const queryClient = useQueryClient()
  const [uploadTarget, setUploadTarget] = useState<{ id: number; nom: string } | null>(null)
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
      setUploadTarget(null)
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

  const openUpload = (v: { id: number; prenom: string; nom: string }) =>
    setUploadTarget({ id: v.id, nom: `${v.prenom} ${v.nom}` })

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
                    <button
                      onClick={() => openUpload(v)}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                      style={v.signatureUploaded
                        ? { color: '#C88500', background: '#FFF7E6' }
                        : { color: '#fff', background: '#C88500' }
                      }
                    >
                      {v.signatureUploaded ? 'Remplacer signature' : 'Uploader signature'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal upload signature */}
      {uploadTarget && (
        <UploadSignatureModal
          vacataireNom={uploadTarget.nom}
          uploading={uploading}
          onClose={() => setUploadTarget(null)}
          onConfirm={(file) => uploadSignature({ id: uploadTarget.id, file })}
        />
      )}
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
