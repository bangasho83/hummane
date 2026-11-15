import type { HelpFeature, HelpGuide, HelpSection } from './types'
import { startSections } from './content/start'
import { adminSections } from './content/admin'
import { resourceSections } from './content/resources'
import { memberSections } from './content/member'

export * from './types'

/** Admin guide, in the same order as the owner navigation. */
export const ADMIN_SECTIONS: HelpSection[] = [
  startSections[0], // Account & Access
  startSections[1], // Dashboard
  startSections[2], // Team
  startSections[3], // Attendance & Leave
  startSections[4], // Payroll
  adminSections[0], // Organization
  resourceSections[0], // Resources & Expenses
  adminSections[1], // Hiring
  adminSections[2], // Performance
  adminSections[3], // Users, Settings & Support
]

/** Employee guide, in the same order as the Employee Portal navigation. */
export const MEMBER_SECTIONS: HelpSection[] = memberSections

export const HELP_SECTIONS: HelpSection[] = [...ADMIN_SECTIONS, ...MEMBER_SECTIONS]

export type GuideInfo = {
  guide: HelpGuide
  /** Landing page of the guide: employees live at /help, admins at /help/admin */
  href: string
  title: string
  tagline: string
  audienceNote: string
  sections: HelpSection[]
}

export const GUIDES: Record<HelpGuide, GuideInfo> = {
  admin: {
    guide: 'admin',
    href: '/help/admin',
    title: 'Admin guide',
    tagline: 'For company owners who set up and run the workspace.',
    audienceNote: 'Covers the admin area: Dashboard, Team, Attendance, Payroll, Organization, Resources, Hiring, Performance, and Settings.',
    sections: ADMIN_SECTIONS,
  },
  member: {
    guide: 'member',
    href: '/help',
    title: 'Employee guide',
    tagline: 'For employees using their own Employee Portal.',
    audienceNote: 'Covers the Employee Portal: tasks, OKRs, leave, attendance, feedback, applicants, resources, and your profile.',
    sections: MEMBER_SECTIONS,
  },
}

export const isGuide = (value: string): value is HelpGuide => value === 'admin' || value === 'member'

export const sectionHref = (section: Pick<HelpSection, 'audience' | 'slug'>) => `${GUIDES[section.audience].href}/${section.slug}`

export const featureHref = (section: Pick<HelpSection, 'audience' | 'slug'>, feature: Pick<HelpFeature, 'id'>) =>
  `${sectionHref(section)}#${feature.id}`

export const getHelpSection = (guide: string, slug: string): HelpSection | undefined =>
  isGuide(guide) ? GUIDES[guide].sections.find((section) => section.slug === slug) : undefined

/** Sections of a guide, grouped under their hub headings in first-seen order. */
export const groupSections = (sections: HelpSection[]): Array<{ group: string; sections: HelpSection[] }> => {
  const groups: Array<{ group: string; sections: HelpSection[] }> = []
  for (const section of sections) {
    const existing = groups.find((item) => item.group === section.group)
    if (existing) existing.sections.push(section)
    else groups.push({ group: section.group, sections: [section] })
  }
  return groups
}

export type HelpSearchEntry = {
  href: string
  title: string
  summary: string
  sectionTitle: string
  guideTitle: string
  /** Lower-cased text used for matching */
  haystack: string
}

const featureText = (feature: HelpFeature) =>
  [
    feature.title,
    feature.summary,
    feature.why,
    feature.example,
    feature.before,
    feature.check,
    ...feature.inside.flatMap((item) => [item.title, item.body]),
    ...feature.steps,
  ]
    .join(' ')
    .toLowerCase()

export const buildSearchIndex = (): HelpSearchEntry[] =>
  HELP_SECTIONS.flatMap((section) =>
    section.features.map((feature) => ({
      href: featureHref(section, feature),
      title: feature.title,
      summary: feature.summary,
      sectionTitle: section.title,
      guideTitle: GUIDES[section.audience].title,
      haystack: `${section.title} ${featureText(feature)}`.toLowerCase(),
    }))
  )
