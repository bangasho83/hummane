import type { LucideIcon } from 'lucide-react'
import {
  Building2,
  Calendar,
  ClipboardList,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Settings,
  Users,
  Wallet,
} from 'lucide-react'

export type NavItem = {
  name: string
  href: string
  icon: LucideIcon
  exact?: boolean
}

const dashboardItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
]

const teamItems: NavItem[] = [
  { name: 'Team', href: '/dashboard/team', icon: Users },
  { name: 'Attendance', href: '/dashboard/attendance', icon: Calendar },
  { name: 'Payroll', href: '/dashboard/payroll', icon: Wallet },
  { name: 'Organization', href: '/dashboard/organization', icon: Building2 },
]

const hiringItems: NavItem[] = [
  { name: 'Jobs', href: '/dashboard/jobs', icon: FileText },
  { name: 'Applicants', href: '/dashboard/applicants', icon: Users, exact: true },
  { name: 'Progress', href: '/dashboard/applicants/progress', icon: ClipboardList, exact: true },
]

const performanceItems: NavItem[] = [
  { name: 'Feedback', href: '/dashboard/performance/feedback', icon: ClipboardList, exact: true },
  { name: 'Cards', href: '/dashboard/performance/feedback-cards', icon: FileText, exact: true },
]

const secondaryItems: NavItem[] = [
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Support', href: '/dashboard/support', icon: HelpCircle },
]

export const navigationSections: Array<{ label?: string; items: NavItem[] }> = [
  { items: dashboardItems },
  { label: 'Team', items: teamItems },
  { label: 'Performance', items: performanceItems },
  { label: 'Hiring', items: hiringItems },
  { label: 'Account & Support', items: secondaryItems },
]
