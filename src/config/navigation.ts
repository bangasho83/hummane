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
  UserCog,
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
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Attendance', href: '/attendance', icon: Calendar },
  { name: 'Payroll', href: '/payroll', icon: Wallet },
  { name: 'Organization', href: '/organization', icon: Building2 },
]

const hiringItems: NavItem[] = [
  { name: 'Jobs', href: '/jobs', icon: FileText },
  { name: 'Applicants', href: '/applicants', icon: Users, exact: true },
  { name: 'Progress', href: '/applicants/progress', icon: ClipboardList, exact: true },
]

const performanceItems: NavItem[] = [
  { name: 'Feedback', href: '/performance/feedback', icon: ClipboardList, exact: true },
  { name: 'Cards', href: '/performance/feedback-cards', icon: FileText, exact: true },
]

const secondaryItems: NavItem[] = [
  { name: 'Users', href: '/users', icon: UserCog },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Support', href: '/support', icon: HelpCircle },
]

export const navigationSections: Array<{ label?: string; items: NavItem[] }> = [
  { items: dashboardItems },
  { label: 'Team', items: teamItems },
  { label: 'Performance', items: performanceItems },
  { label: 'Hiring', items: hiringItems },
  { label: 'Account & Support', items: secondaryItems },
]
