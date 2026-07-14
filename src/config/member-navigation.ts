import type { LucideIcon } from 'lucide-react'
import {
  Calendar,
  CalendarDays,
  LayoutDashboard,
  MessageSquare,
  Package,
  Users,
  User,
} from 'lucide-react'

export type MemberNavItem = {
  name: string
  href: string
  icon: LucideIcon
  exact?: boolean
}

export const memberNavigationItems: MemberNavItem[] = [
  { name: 'Dashboard', href: '/member', icon: LayoutDashboard, exact: true },
  { name: 'Applicants', href: '/member/applicants', icon: Users },
  { name: 'Feedback', href: '/member/feedback', icon: MessageSquare },
  { name: 'Resource Request', href: '/member/resource-request', icon: Package },
  { name: 'Leaves', href: '/member/leaves', icon: CalendarDays },
  { name: 'Attendance', href: '/member/attendance', icon: Calendar },
  { name: 'Profile', href: '/member/profile', icon: User },
]
