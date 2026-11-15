import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { GUIDES, featureHref, groupSections, isGuide, sectionHref } from '@/features/help'

type PageProps = { params: Promise<{ guide: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return [{ guide: 'admin' }, { guide: 'member' }]
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { guide } = await params
  if (!isGuide(guide)) return {}
  const info = GUIDES[guide]
  return { title: `${info.title} | Hummane Help`, description: info.tagline }
}

export default async function GuideHubPage({ params }: PageProps) {
  const { guide } = await params
  if (!isGuide(guide)) notFound()
  const info = GUIDES[guide]
  const other = GUIDES[guide === 'admin' ? 'member' : 'admin']
  const groups = groupSections(info.sections)

  return (
    <div className="space-y-12">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link href="/help" className="font-semibold text-blue-600 hover:underline">
          Help
        </Link>
        <span className="mx-2">/</span>
        <span>{info.title}</span>
      </nav>

      <header className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">{info.title}</h1>
        <p className="max-w-3xl text-lg text-slate-600">{info.tagline}</p>
        <p className="max-w-3xl text-slate-500">{info.audienceNote}</p>
      </header>

      {groups.map(({ group, sections }) => (
        <section key={group} className="space-y-5">
          <h2 className="text-2xl font-bold text-slate-900">{group}</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {sections.map((section) => (
              <article key={section.slug} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">{section.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{section.description}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {section.features.map((feature) => (
                    <li key={feature.id}>
                      <Link
                        href={featureHref(section, feature)}
                        className="inline-block rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                      >
                        {feature.title}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href={sectionHref(section)} className="mt-5 inline-flex items-center gap-1 pt-1 text-sm font-semibold text-blue-600 hover:underline">
                  View {section.title} help <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </section>
      ))}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Looking for something else?</h2>
        <p className="mt-1 text-slate-600">{other.tagline}</p>
        <Link href={`/help/${other.guide}`} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline">
          Go to the {other.title} <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  )
}
