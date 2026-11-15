import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Hummane overview | Hummane Help',
  description: 'How Hummane helps HR teams manage people, time off, hiring, performance, and company resources in one place.',
}

const reasons = [
  {
    title: 'People data is scattered',
    body: 'Contracts, bank details, leave, and feedback often live in different files. One record per person keeps everything findable and current.',
  },
  {
    title: 'Time off needs clear rules',
    body: 'Different employment types get different allowances. Leave types with quotas make balances predictable and fair.',
  },
  {
    title: 'Hiring needs ownership',
    body: 'Candidates stall when nobody is responsible for the next step. Each stage in Hummane has a named employee.',
  },
  {
    title: 'Teams need shared goals',
    body: 'OKRs and tasks connect everyday work to team and company objectives so progress is visible.',
  },
]

const steps = [
  {
    title: 'Create your account and company',
    body: 'An owner signs up and sets up the company name, industry, and size.',
    href: '/help/admin/account-and-access',
  },
  {
    title: 'Set up your organization',
    body: 'Add departments, roles, leave types, working hours, holidays, and vendors. These feed every other form.',
    href: '/help/admin/organization',
  },
  {
    title: 'Add your people',
    body: 'Register team members, set reporting lines, and invite them to the Employee Portal.',
    href: '/help/admin/team',
  },
  {
    title: 'Run time off and attendance',
    body: 'Register leave, see who is away, and review leave totals.',
    href: '/help/admin/attendance',
  },
  {
    title: 'Hire and develop',
    body: 'Post jobs, move applicants through stages, and use feedback cards and OKRs to grow your team.',
    href: '/help/admin/hiring',
  },
  {
    title: 'Track resources and expenses',
    body: 'Approve requests, assign equipment and subscriptions, and record bills and reimbursements.',
    href: '/help/admin/resources',
  },
]

export default function HelpOverviewPage() {
  return (
    <div className="space-y-14">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link href="/help" className="font-semibold text-blue-600 hover:underline">
          Help
        </Link>
        <span className="mx-2">/</span>
        <span>Overview</span>
      </nav>

      <header className="space-y-4">
        <p className="text-sm font-semibold text-blue-600">Hummane overview</p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-900">One place to manage your people, from hiring to everyday work.</h1>
        <p className="max-w-3xl text-lg text-slate-600">
          Hummane brings employee records, leave, hiring, performance, OKRs, tasks, and company resources together. Owners manage the company and employees
          use their own portal.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/help/admin/account-and-access" className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
            Get started
          </Link>
          <Link href="/help" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Browse both guides
          </Link>
        </div>
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Why it matters</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {reasons.map((reason) => (
            <div key={reason.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-slate-900">{reason.title}</h3>
              <p className="mt-2 text-slate-600">{reason.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">How Hummane works</h2>
        <ol className="space-y-4">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">{index + 1}</span>
              <div>
                <h3 className="font-bold text-slate-900">{step.title}</h3>
                <p className="mt-1 text-slate-600">{step.body}</p>
                <Link href={step.href} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline">
                  Read the guide <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Company owners</h2>
          <p className="mt-2 text-slate-600">
            Owners see the admin area: Dashboard, Team, Resources, OKRs, Attendance, Payroll, Organization, Hiring, Performance, Users, and Settings.
          </p>
          <Link href="/help/admin" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline">
            Admin guide <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Employees</h2>
          <p className="mt-2 text-slate-600">
            Employees see the Employee Portal: their dashboard, OKRs, tasks, applicants assigned to them, feedback, resources, leave, attendance, and profile.
          </p>
          <Link href="/help/member" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline">
            Employee guide <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
        <h2 className="text-xl font-bold text-slate-900">A sensible place to start</h2>
        <p className="mt-2 text-slate-700">
          Set up departments, roles, and leave types first. Then add a few team members and try registering a leave request. Everything else builds on that.
        </p>
        <Link href="/help/admin/organization" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline">
          Start with Organization <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  )
}
