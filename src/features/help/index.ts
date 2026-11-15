import type { HelpFeature, HelpSection } from './types'
import { startSections } from './content/start'
import { adminSections } from './content/admin'
import { resourceSections } from './content/resources'
import { portalSections } from './content/portal'

export * from './types'

/** Order matches how the product is navigated: getting started, admin areas, then the Employee Portal. */
export const HELP_SECTIONS: HelpSection[] = [
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
  portalSections[0], // Employee Portal
]

export const getHelpSection = (slug: string): HelpSection | undefined => HELP_SECTIONS.find((section) => section.slug === slug)

export type HelpSearchEntry = {
  href: string
  title: string
  summary: string
  sectionTitle: string
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
      href: `/help/${section.slug}#${feature.id}`,
      title: feature.title,
      summary: feature.summary,
      sectionTitle: section.title,
      haystack: `${section.title} ${featureText(feature)}`.toLowerCase(),
    }))
  )
