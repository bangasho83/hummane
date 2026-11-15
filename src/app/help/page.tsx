import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { GUIDES, buildSearchIndex, sectionHref } from '@/features/help'
import { HelpSearch } from '@/features/help/HelpSearch'

export const metadata: Metadata = {
  title: 'Help & Support | Hummane',
  description: 'Step-by-step guides for every part of Hummane, the HR management system. No sign-in needed.',
}

export default function HelpHomePage() {
  const searchEntries = buildSearchIndex()

  return (
    <div className="space-y-14">
      <section className="space-y-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">How can we help?</h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-600">Find help for company owners and employees, organised the same way as the app.</p>
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

      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Choose your guide</h2>
          <p className="mt-1 text-slate-600">Hummane has two areas. Pick the guide that matches how you sign in.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {(['admin', 'member'] as const).map((key) => {
            const info = GUIDES[key]
            return (
              <article key={key} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-2xl font-bold text-slate-900">{info.title}</h3>
                <p className="mt-1 font-semibold text-blue-700">{info.tagline}</p>
                <p className="mt-2 text-sm text-slate-600">{info.audienceNote}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {info.sections.map((section) => (
                    <li key={section.slug}>
                      <Link
                        href={sectionHref(section)}
                        className="inline-block rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                      >
                        {section.title}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/help/${info.guide}`}
                  className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  Open the {info.title} <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            )
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Need help with access?</h2>
        <p className="mt-1 text-slate-600">Find sign-in and account guidance for your role.</p>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/help/admin/account-and-access" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline">
            Account help for owners <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/help/member/getting-started" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline">
            Getting started for employees <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
