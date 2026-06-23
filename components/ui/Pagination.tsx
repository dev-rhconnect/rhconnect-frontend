'use client'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  from: number
  to: number
  onPage: (p: number) => void
}

function pageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

export default function Pagination({ page, totalPages, total, from, to, onPage }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-t" style={{ borderColor: '#F1E2D4' }}>
      <p className="text-xs" style={{ color: '#8A7256' }}>
        {total === 0
          ? '0 résultat'
          : `${from} à ${to} sur ${total} résultat${total !== 1 ? 's' : ''}`}
      </p>
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition-all disabled:opacity-30 hover:bg-[#FCF5EE]"
          style={{ color: '#5C4A38' }}
        >
          ←
        </button>

        {pageNumbers(page, totalPages).map((p, i) =>
          p === '...' ? (
            <span key={`dot-${i}`} className="w-6 text-center text-xs" style={{ color: '#8A7256' }}>…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              className="h-8 w-8 rounded-lg text-xs font-semibold transition-all"
              style={
                p === page
                  ? { background: '#2B1D10', color: '#fff' }
                  : { color: '#5C4A38' }
              }
              onMouseEnter={(e) => {
                if (p !== page) (e.currentTarget as HTMLElement).style.background = '#FCF5EE'
              }}
              onMouseLeave={(e) => {
                if (p !== page) (e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition-all disabled:opacity-30 hover:bg-[#FCF5EE]"
          style={{ color: '#5C4A38' }}
        >
          →
        </button>
      </div>
    </div>
  )
}
