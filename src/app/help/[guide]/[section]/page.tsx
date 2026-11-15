import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowUpRight, Lightbulb } from 'lucide-react'
import { GUIDES, HELP_SECTIONS, getHelpSection, sectionHref, type HelpFeature } from '@/features/help'

type PageProps = { params: Promise<{ guide: string; section: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return HELP_SECTIONS.map((section) => ({ guide: section.audience, section: section.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { guide, section: slug } = await params
  const section = getHelpSection(guide, slug)
  if (!section) return {}
  return {
    title: `${section.title} | ${GUIDES[section.audience].title} | Hummane Help`,
    description: section.description,
  }
}

function FeatureGuide({ feature }: { feature: HelpFeature }) {
  return (
    <article id={feature.id} className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-2xl font-bold text-slate-900">How to use {feature.title}</h3>
      </div>
      <p className="mt-2 text-slate-600">{feature.summary}</p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">Why this matters</h4>
          <p className="mt-1 text-slate-700">{feature.why}</p>
        </div>
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">Example</h4>
          <p className="mt-1 text-slate-700">{feature.example}</p>
        </div>
      </div>

      <div className="mt-6 space-y-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
        <p>
          <span className="font-bold text-slate-900">Before you start: </span>
          {feature.before}
        </p>
        <p>
          <span className="font-bold text-slate-900">Check before you finish: </span>
          {feature.check}
        </p>
      </div>

      <h4 className="mt-8 text-lg font-bold text-slate-900">Inside this feature</h4>
      <dl className="mt-3 space-y-4">
        {feature.inside.map((item) => (
          <div key={item.title}>
            <dt className="font-semibold text-slate-900">{item.title}</dt>
            <dd className="mt-0.5 text-slate-600">{item.body}</dd>
          </div>
        ))}
      </dl>

      <h4 className="mt-8 text-lg font-bold text-slate-900">Steps</h4>
      <ol className="mt-3 space-y-3">
        {feature.steps.map((step, index) => (
          <li key={step} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">{index + 1}</span>
            <span className="pt-0.5 text-slate-700">{step}</span>
          </li>
        ))}
      </ol>

      <Link
        href={feature.open.href}
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
      >
        {feature.open.label} <ArrowUpRight className="h-4 w-4" />
      </Link>
      <p className="mt-2 text-xs text-slate-500">You will be asked to sign in first if you are not already signed in.</p>
    </article>
  )
}

export default async function HelpSectionPage({ params }: PageProps) {
  const { guide, section: slug } = await params
  const section = getHelpSection(guide, slug)
  if (!section) notFound()
  const guideInfo = GUIDES[section.audience]

  return (
    <div className="space-y-10">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link href="/help" className="font-semibold text-blue-600 hover:underline">
          Help
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/help/${guideInfo.guide}`} className="font-semibold text-blue-600 hover:underline">
          {guideInfo.title}
        </Link>
        <span className="mx-2">/</span>
        <span>{section.title}</span>
      </nav>

      <header className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">{section.title}</h1>
        <p className="max-w-3xl text-lg text-slate-600">{section.description}</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">What this area does</h2>
        <p className="mt-2 text-slate-700">{section.whatItDoes}</p>
      </section>

      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">On this page</h2>
          <ul className="mt-3 space-y-1">
            {section.features.map((feature) => (
              <li key={feature.id}>
                <a href={`#${feature.id}`} className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-white hover:text-blue-700">
                  {feature.title}
                </a>
              </li>
            ))}
          </ul>
          <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-slate-500">{guideInfo.title}</h2>
          <ul className="mt-3 space-y-1">
            {guideInfo.sections.map((item) => (
              <li key={item.slug}>
                <Link
                  href={sectionHref(item)}
                  aria-current={item.slug === section.slug ? 'page' : undefined}
                  className={`block rounded-lg px-3 py-2 text-sm font-semibold ${
                    item.slug === section.slug ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-white hover:text-blue-700'
                  }`}
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-slate-900">How to use these features</h2>
          {section.features.map((feature) => (
            <FeatureGuide key={feature.id} feature={feature} />
          ))}

          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <Lightbulb className="h-5 w-5 text-amber-600" aria-hidden /> Helpful tips
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
              {section.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </section>

          <Link href={`/help/${guideInfo.guide}`} className="inline-block text-sm font-semibold text-blue-600 hover:underline">
            All {guideInfo.title} topics
          </Link>
        </div>
      </div>
    </div>
  )
}
