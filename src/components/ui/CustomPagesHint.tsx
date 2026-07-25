'use client'

import { useState, type ReactNode } from 'react'

// Wraps a value the reader set themselves — a book's page count that doesn't
// match the catalog edition/work — rendering it with a dashed underline plus a
// small tooltip that explains it's user-set. The tooltip shows on hover and
// toggles on click/tap (so it's reachable on touch), and clicks don't bubble to
// an enclosing link/card.
export default function CustomPagesHint({ children, label }: { children: ReactNode; label: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="group relative inline-block">
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen((o) => !o) }}
        className="cursor-help underline decoration-dashed underline-offset-2"
      >
        {children}
      </span>
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 top-full z-[90] mt-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--container)] px-2 py-1 text-[10px] font-normal text-[var(--text-muted)] shadow-lg transition-opacity duration-150 group-hover:opacity-100 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {label}
      </span>
    </span>
  )
}
