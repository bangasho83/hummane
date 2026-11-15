import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GUIDES, getHelpSection } from '@/features/help'
import { SectionView } from '@/features/help/SectionView'

type PageProps = { params: Promise<{ section: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return GUIDES.admin.sections.map((section) => ({ section: section.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section: slug } = await params
  const section = getHelpSection('admin', slug)
  if (!section) return {}
  return {
    title: `${section.title} | ${GUIDES.admin.title} | Hummane Help`,
    description: section.description,
  }
}

export default async function HelpSectionPage({ params }: PageProps) {
  const { section: slug } = await params
  const section = getHelpSection('admin', slug)
  if (!section) notFound()
  return <SectionView section={section} />
}
