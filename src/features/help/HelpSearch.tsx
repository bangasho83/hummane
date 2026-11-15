'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import type { HelpSearchEntry } from './index'

const MAX_RESULTS = 8

// Title matches rank above summary matches, which rank above body-text matches.
const score = (entry: HelpSearchEntry, terms: string[]) => {
  let total = 0
  const title = entry.title.toLowerCase()
  const summary = entry.summary.toLowerCase()
  for (const term of terms) {
    if (!entry.haystack.includes(term)) return 0
    total += title.includes(term) ? 6 : summary.includes(term) ? 3 : 1
  }
  return total
}

export function HelpSearch({ entries }: { entries: HelpSearchEntry[] }) {
  const [query, setQuery] = useState('')
  const terms = useMemo(() => query.toLowerCase().split(/\s+/).filter(Boolean), [query])

  const results = useMemo(() => {
    if (terms.length === 0) return []
    return entries
      .map((entry) => ({ entry, score: score(entry, terms) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS)
      .map((item) => item.entry)
  }, [entries, terms])

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <label htmlFor="help-search" className="sr-only">
        Search Hummane help
      </label>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden />
      <input
        id="help-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search Hummane help, for example “leave”, “payroll”, or “applicant”"
        autoComplete="off"
        className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-base text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />

      {terms.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-xl">
          {results.length > 0 ? (
            <ul role="listbox" aria-label="Search results">
              {results.map((entry) => (
                <li key={entry.href}>
                  <Link href={entry.href} className="block border-b border-slate-100 px-5 py-3 last:border-b-0 hover:bg-slate-50">
                    <span className="block text-xs font-semibold uppercase tracking-wide text-blue-600">{entry.sectionTitle}</span>
                    <span className="block text-sm font-bold text-slate-900">{entry.title}</span>
                    <span className="block text-sm text-slate-500">{entry.summary}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-4 text-sm text-slate-500">No help found for “{query}”. Try a shorter or different word.</p>
          )}
        </div>
      )}
    </div>
  )
}
