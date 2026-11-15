export type HelpAudience = 'admin' | 'member' | 'everyone'

/** The two guides in the help center */
export type HelpGuide = 'admin' | 'member'

export type HelpFeature = {
  /** Anchor id, unique across the whole help center (used as /help/<guide>/<section>#<id>) */
  id: string
  title: string
  /** One-line description shown in lists and search results */
  summary: string
  /** Who can open the linked page: company owners (admin), employees (member) or both */
  audience: HelpAudience
  why: string
  example: string
  before: string
  check: string
  inside: Array<{ title: string; body: string }>
  steps: string[]
  /** Real in-app page this guide is about */
  open: { href: string; label: string }
}

export type HelpSection = {
  slug: string
  /** Heading this section is listed under on its guide's hub page */
  group: string
  title: string
  description: string
  audience: HelpGuide
  whatItDoes: string
  features: HelpFeature[]
  tips: string[]
}

export const AUDIENCE_LABEL: Record<HelpAudience, string> = {
  admin: 'Company owner',
  member: 'Employee',
  everyone: 'Everyone',
}
