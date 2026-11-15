import type { HelpFeature, HelpSection } from '../types'
import { memberFeatures } from './portal'

const signIn: HelpFeature = {
  id: 'member-sign-in',
  title: 'Sign in to the Employee Portal',
  summary: 'Accept your invitation, sign in, and land on your own portal.',
  audience: 'member',
  why: 'Your company owner invites you by email. Signing in takes you straight to your personal portal, never the admin area.',
  example: 'A new hire gets an invitation, signs up with the same work email, and sees their dashboard with leave balance and tasks.',
  before: 'Use the same email address your company owner invited. If you cannot sign in, ask them to check the email on your invitation.',
  check: 'If a page says No Employee Profile Linked, your account is not yet linked to your employee record. Ask your company owner to link it in Users.',
  inside: [
    { title: 'Sign-in options', body: 'Enter your email and password and select Sign In, or select Continue with Google.' },
    {
      title: 'New account',
      body: 'Create your account with the invited email. Use at least 8 characters with an uppercase letter, a lowercase letter, and a number.',
    },
    { title: 'Your area', body: 'Employees see the Employee Portal. Admin pages redirect you back to it.' },
  ],
  steps: [
    'Open the sign-in page. If you are new, open Create one and sign up with your invited email.',
    'Enter your email and password, or select Continue with Google.',
    'Select Sign In.',
    'You arrive on your Employee Portal dashboard.',
  ],
  open: { href: '/login', label: 'Open Sign in' },
}

const byId = new Map(memberFeatures.map((feature) => [feature.id, feature]))
const pick = (...ids: string[]): HelpFeature[] =>
  ids.map((id) => {
    const feature = byId.get(id)
    if (!feature) throw new Error(`Missing member help feature: ${id}`)
    return feature
  })

export const memberSections: HelpSection[] = [
  {
    slug: 'getting-started',
    group: 'Getting started',
    title: 'Getting started',
    description: 'Sign in, find your way around your dashboard, and keep your profile up to date.',
    audience: 'member',
    whatItDoes:
      'Your Employee Portal is your own area in Hummane. It shows your personal summary, your details, and everything your company has assigned to you. Your company owner sets up your account and links it to your employee record.',
    features: [signIn, ...pick('member-dashboard', 'member-profile')],
    tips: [
      'If something is missing from your profile, such as your role or salary, contact your company owner. You can only change your photo and add documents.',
      'Use this help center any time, even without signing in.',
    ],
  },
  {
    slug: 'work',
    group: 'My work',
    title: 'Tasks & OKRs',
    description: 'Plan day-to-day work with shared tasks and track your goals with OKRs.',
    audience: 'member',
    whatItDoes:
      'Tasks cover the work in front of you. OKRs connect that work to your team’s and the company’s goals. Both are shared, so colleagues can see progress.',
    features: pick('member-tasks', 'member-okrs'),
    tips: [
      'Start with All tasks to see the full picture, then switch to My tasks to focus.',
      'Your dashboard reminds you if you have not defined an OKR yet.',
    ],
  },
  {
    slug: 'time-off',
    group: 'My work',
    title: 'Leave & Attendance',
    description: 'Apply for leave, check your balance, and see who is away.',
    audience: 'member',
    whatItDoes:
      'Apply for time off, see how much you have left this year, and check the team grid before planning meetings or handovers.',
    features: pick('member-leaves', 'member-attendance'),
    tips: [
      'Only leave types that match your employment type are shown when you apply.',
      'Company holidays appear on your dashboard under Upcoming Holidays.',
    ],
  },
  {
    slug: 'feedback-and-hiring',
    group: 'People',
    title: 'Feedback & Applicants',
    description: 'Give and read feedback, and review candidates assigned to you.',
    audience: 'member',
    whatItDoes:
      'Feedback lets you see how colleagues rate your work and share structured feedback with them. If you help with hiring, Applicants shows the candidates assigned to you.',
    features: pick('member-feedback', 'member-applicants'),
    tips: [
      'Review scores before you submit. You may not be able to change them afterwards.',
      'You only see applicants once someone assigns you to a hiring stage.',
    ],
  },
  {
    slug: 'resources-and-expenses',
    group: 'Company resources',
    title: 'Resources & Expenses',
    description: 'See what is assigned to you, ask for what you need, and claim expenses.',
    audience: 'member',
    whatItDoes:
      'Check the equipment, subscriptions, and books assigned to you, send a request for something new, and submit expenses you paid for yourself.',
    features: pick('member-resources', 'member-requests', 'member-reimbursements'),
    tips: [
      'Resources, subscriptions, and books are read-only. Use a request to ask for something new.',
      'You cannot edit a reimbursement after submitting it. Contact your admin to change one.',
    ],
  },
]
