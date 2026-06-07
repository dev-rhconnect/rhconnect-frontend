'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { vacataireService } from '@/services/vacataire.service'
import {
  contratService,
  telechargerPdf,
  type ContratResponse,
  type StatutContrat,
} from '@/services/contrat.service'

const statutContratBadge: Record<StatutContrat, string> = {
  ACTIF:    'bg-green-100 text-green-700',
  EXPIRE:   'bg-gray-100 text-gray-600',
  RESILIE:  'bg-red-100 text-red-700',
}

export default function VacataireDetailPage() {
  const { id } = useParams<{ id: string }>()
  const vacataireId = Number(id)
  const qc = useQueryClient()
  const [loadingPdf, setLoadingPdf] = useState<number | null>(null)
  const [loadingEnvoi, setLoadingEnvoi] = useState<number | null>(null)

  const { data: vacataire, isLoading: vacLoading } = useQuery({
    queryKey: ['vacataires', vacataireId],
    queryFn: () => vacataireService.trouverParId(vacataireId),
  })

  const { data: contrats = [], isLoading: contLoading } = useQuery({
    queryKey: ['contrats', 'vacataire', vacataireId],
    queryFn: () => contratService.listerParVacataire(vacataireId),
  })

  const { mutate: resilier } = useMutation({
    mutationFn: contratService.resilier,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contrats', 'vacataire', vacataireId] }),
  })

  const handleGenererPdf = async (contratId: number) => {
    setLoadingPdf(contratId)
    try {
      const blob = await contratService.genererPdf(contratId)
      telechargerPdf(blob, `Contrat_RHC-${String(contratId).padStart(5, '0')}.pdf`)
      qc.invalidateQueries({ queryKey: ['contrats', 'vacataire', vacataireId] })
    } finally {
      setLoadingPdf(null)
    }
  }

  const handleEnvoyer = async (contratId: number) => {
    setLoadingEnvoi(contratId)
    try {
      await contratService.envoyer(contratId)
      alert('Email envoyé au vacataire et à la DRH (fatou.faye@ism.edu.sn)')
    } catch {
      alert('Erreur lors de l\'envoi')
    } finally {
      setLoadingEnvoi(null)
    }
  }

  if (vacLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-ism-gold border-t-transparent" />
      </div>
    )
  }

  if (!vacataire) {
    return <div className="text-sm text-gray-500">Vacataire introuvable.</div>
  }

  return (
    <div>
      {/* Navigation */}
      <Link
        href="/responsable/vacataires"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Retour à la liste
      </Link>

      {/* En-tête vacataire */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white"
               style={{ background: '#1C0800' }}>
            {vacataire.prenom[0]}{vacataire.nom[0]}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{vacataire.prenom} {vacataire.nom}</h2>
            <p className="text-sm text-gray-500">{vacataire.email} · {vacataire.specialite}</p>
          </div>
        </div>
        <Link
          href={`/responsable/vacataires/${vacataireId}/contrat/nouveau`}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          style={{ background: '#1C0800' }}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nouveau contrat
        </Link>
      </div>

      {/* Fiche vacataire */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Téléphone', value: vacataire.telephone || '—' },
          { label: 'Statut', value: vacataire.statut },
          { label: 'CNI', value: vacataire.numeroCni || '—' },
          { label: 'Banque', value: vacataire.nomBanque || '—' },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-400">{item.label}</p>
            <p className="mt-0.5 font-semibold text-gray-900">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Contrats */}
      <div>
        <h3 className="mb-4 text-lg font-bold text-gray-900">Contrats de vacation</h3>

        {contLoading && (
          <div className="flex items-center justify-center py-8 text-sm text-gray-400">Chargement…</div>
        )}

        {!contLoading && contrats.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-14 text-center shadow-sm">
            <svg className="mb-3 h-12 w-12 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <p className="text-sm font-medium text-gray-900">Aucun contrat</p>
            <p className="mt-1 text-xs text-gray-400">Créez le premier contrat pour ce vacataire.</p>
          </div>
        )}

        {!contLoading && contrats.length > 0 && (
          <div className="space-y-4">
            {contrats.map((c) => (
              <ContratCard
                key={c.id}
                contrat={c}
                loadingPdf={loadingPdf === c.id}
                loadingEnvoi={loadingEnvoi === c.id}
                onGenererPdf={() => handleGenererPdf(c.id)}
                onEnvoyer={() => handleEnvoyer(c.id)}
                onResilier={() => resilier(c.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ContratCard({
  contrat: c,
  loadingPdf,
  loadingEnvoi,
  onGenererPdf,
  onEnvoyer,
  onResilier,
}: {
  contrat: ContratResponse
  loadingPdf: boolean
  loadingEnvoi: boolean
  onGenererPdf: () => void
  onEnvoyer: () => void
  onResilier: () => void
}) {
  const montantPrev = c.volumeHorairePrevisionnel * c.tauxHoraire

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-gray-900">{c.module}</h4>
            {c.estAvenant && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Avenant</span>
            )}
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statutContratBadge[c.statut]}`}>
              {c.statut}
            </span>
            {c.pdfGenere && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">PDF généré</span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {c.classe} · {new Date(c.dateDebut).toLocaleDateString('fr-SN')} → {new Date(c.dateFin).toLocaleDateString('fr-SN')}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-400">Rémunération prévisionnelle</p>
          <p className="font-bold text-gray-900">{montantPrev.toLocaleString('fr-SN')} <span className="text-xs font-normal text-gray-400">FCFA</span></p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-gray-50 p-3 text-sm">
        <div>
          <span className="text-xs text-gray-400">Volume horaire</span>
          <p className="font-semibold">{c.volumeHorairePrevisionnel} h</p>
        </div>
        <div>
          <span className="text-xs text-gray-400">Taux horaire</span>
          <p className="font-semibold">{c.tauxHoraire.toLocaleString('fr-SN')} FCFA</p>
        </div>
        <div>
          <span className="text-xs text-gray-400">Référence</span>
          <p className="font-mono font-semibold text-xs">RHC-VAC-{String(c.id).padStart(5, '0')}</p>
        </div>
      </div>

      {c.statut === 'ACTIF' && (
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <button
            onClick={onGenererPdf}
            disabled={loadingPdf}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {loadingPdf ? (
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" /></svg>
            ) : (
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            )}
            Générer PDF
          </button>

          <button
            onClick={onEnvoyer}
            disabled={loadingEnvoi}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: '#C88500' }}
          >
            {loadingEnvoi ? (
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" /></svg>
            ) : (
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
            Envoyer par email
          </button>

          <Link
            href={`/responsable/vacataires/${c.vacataireId}/contrat/nouveau?parentId=${c.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 transition-colors"
          >
            + Avenant
          </Link>

          <button
            onClick={() => confirm('Résilier ce contrat ?') && onResilier()}
            className="ml-auto rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            Résilier
          </button>
        </div>
      )}
    </div>
  )
}
