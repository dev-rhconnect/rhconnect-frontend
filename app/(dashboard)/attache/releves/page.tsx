'use client'

import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { releveService, type FeuilleHeureResponse, type StatutReleve } from '@/services/releve.service'

const statutConfig: Record<StatutReleve, { label: string; className: string }> = {
  EN_COURS: { label: 'En cours',  className: 'bg-blue-50 text-blue-700'   },
  SOUMIS:   { label: 'Soumis',   className: 'bg-amber-50 text-amber-700'  },
  VALIDE:   { label: 'Validé',   className: 'bg-green-50 text-green-700'  },
  REJETE:   { label: 'Rejeté',   className: 'bg-red-50 text-red-700'      },
}

export default function RelevesPage() {
  const queryClient = useQueryClient()

  const { data: releves = [], isLoading, isError } = useQuery({
    queryKey: ['releves', 'mes-releves'],
    queryFn: releveService.mesReleves,
  })

  const { mutate: soumettre, isPending: soumettreEnCours } = useMutation({
    mutationFn: (id: number) => releveService.soumettre(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['releves'] }),
  })

  return (
    <div>
      {/* En-tête */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relevés d'heures</h2>
          <p className="mt-1 text-sm text-gray-500">
            {releves.length} relevé{releves.length !== 1 ? 's' : ''} — soumettez votre relevé mensuel pour validation
          </p>
        </div>
        <Link
          href="/attache/releves/nouveau"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#1C0800' }}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nouveau relevé
        </Link>
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {isLoading && (
          <div className="rounded-2xl bg-white p-8 text-center text-sm text-gray-400 shadow-sm">
            Chargement…
          </div>
        )}

        {isError && (
          <div className="rounded-2xl bg-white p-8 text-center text-sm text-red-500 shadow-sm">
            Erreur lors du chargement.
          </div>
        )}

        {!isLoading && !isError && releves.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 shadow-sm">
            <svg className="mb-3 h-12 w-12 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
            </svg>
            <p className="text-sm font-medium text-gray-900">Aucun relevé</p>
            <p className="mt-1 text-xs text-gray-400">Vos relevés apparaîtront ici une fois les contrats assignés.</p>
          </div>
        )}

        {releves.map((r) => (
          <ReleveCard
            key={r.id}
            releve={r}
            onSoumettre={() => soumettre(r.id)}
            soumettreEnCours={soumettreEnCours}
          />
        ))}
      </div>
    </div>
  )
}

function ReleveCard({
  releve: r,
  onSoumettre,
  soumettreEnCours,
}: {
  releve: FeuilleHeureResponse
  onSoumettre: () => void
  soumettreEnCours: boolean
}) {
  const cfg = statutConfig[r.statut]
  const nbSeances = r.lignes?.length ?? 0

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        {/* Info */}
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-gray-900">{r.module}</h3>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
              {cfg.label}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-gray-500">{r.classe} · Période : {r.periode}</p>
        </div>

        {/* Action soumettre */}
        {r.statut === 'EN_COURS' && (
          <button
            onClick={onSoumettre}
            disabled={soumettreEnCours || nbSeances === 0}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#C88500' }}
            title={nbSeances === 0 ? 'Ajoutez des séances avant de soumettre' : 'Soumettre pour validation'}
          >
            Soumettre →
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="mt-4 flex items-center gap-6 border-t border-gray-50 pt-4">
        <div>
          <p className="text-xs text-gray-400">Séances saisies</p>
          <p className="text-xl font-bold text-gray-900">{nbSeances}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Heures validées</p>
          <p className="text-xl font-bold text-gray-900">{r.totalHeuresValidees.toFixed(1)} h</p>
        </div>
        {r.dateSoumission && (
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-400">Soumis le</p>
            <p className="text-sm font-semibold text-gray-700">
              {new Date(r.dateSoumission).toLocaleDateString('fr-SN')}
            </p>
          </div>
        )}
        {r.dateValidation && (
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-400">Validé le</p>
            <p className="text-sm font-semibold text-green-700">
              {new Date(r.dateValidation).toLocaleDateString('fr-SN')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
