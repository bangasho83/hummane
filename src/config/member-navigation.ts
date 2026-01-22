import type { LucideIcon } from 'lucide-react'
import {
  Calendar,
  LayoutDashboard,
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
  { name: 'Profile', href: '/member/profile', icon: User },
  { name: 'Attendance', href: '/member/attendance', icon: Calendar },
]

