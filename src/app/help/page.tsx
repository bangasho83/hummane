import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { GUIDES, buildSearchIndex } from '@/features/help'
import { GuideHub } from '@/features/help/GuideHub'
import { HelpSearch } from '@/features/help/HelpSearch'

export const metadata: Metadata = {
  title: 'Employee Help | Hummane',
  description: 'Step-by-step guides for employees using Hummane: tasks, OKRs, leave, feedback, resources, and your profile. No sign-in needed.',
}

export default function HelpHomePage() {
  const searchEntries = buildSearchIndex()

  return (
    <div className="space-y-14">
      <section className="space-y-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">How can we help?</h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-600">Guides for employees using Hummane. Search, or pick a topic below.</p>
        <HelpSearch entries={searchEntries} />
      </section>

      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div>
          <p className="text-sm font-semibold text-blue-700">New to Hummane?</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">See how Hummane supports your HR team</h2>
          <p className="mt-1 text-slate-600">Understand how the pieces connect and where to begin.</p>
        </div>
        <Link
          href="/help/overview"
          className="mt-4 inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:mt-0"
        >
          Read the overview <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Are you a company owner or admin?</h2>
          <p className="mt-1 text-slate-600">{GUIDES.admin.tagline} Setup, people, hiring, payroll, and more.</p>
        </div>
        <Link
          href={GUIDES.admin.href}
          className="mt-4 inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:mt-0"
        >
          Open the Admin guide <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <GuideHub guide="member" hideHeader />
    </div>
  )
}
