import Link from 'next/link'
import type { ReactNode } from 'react'

export default function HelpLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50/50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/help" className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">
              hum<span className="text-blue-600">mane</span>
            </span>
            <span className="text-sm font-semibold text-slate-500">Help</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm font-semibold sm:gap-2">
            <Link href="/help" className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100">
              Employee help
            </Link>
            <Link href="/help/admin" className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100">
              Admin help
            </Link>
            <Link href="/help/overview" className="hidden rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 sm:block">
              Overview
            </Link>
            <Link href="/login" className="rounded-lg bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700">
              Sign in
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-500 sm:px-6">
          <Link href="/help" className="font-semibold text-blue-600 hover:underline">
            All help topics
          </Link>
        </div>
      </footer>
    </div>
  )
}
