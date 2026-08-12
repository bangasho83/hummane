import type { LucideIcon } from 'lucide-react'
import {
  Calendar,
  CalendarDays,
  LayoutDashboard,
  MessageSquare,
  ClipboardList,
  Package,
  ReceiptText,
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
  { name: 'Library', href: '/member/resources', icon: Package },
  { name: 'Reimbursements', href: '/member/reimbursements', icon: ReceiptText },
  { name: 'Resource Request', href: '/member/resource-request', icon: ClipboardList },
  { name: 'Leaves', href: '/member/leaves', icon: CalendarDays },
  { name: 'Attendance', href: '/member/attendance', icon: Calendar },
  { name: 'Profile', href: '/member/profile', icon: User },
]
