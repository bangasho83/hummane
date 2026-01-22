'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { useApp } from '@/lib/context/AppContext'
import { cn } from '@/lib/utils'
import { navigationSections, type NavItem } from '@/config/navigation'
import { toast } from '@/components/ui/toast'

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { logout, currentCompany } = useApp()

    const NavLink = ({ item }: { item: NavItem }) => {
        const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)

        return (
            <Link
                href={item.href}
                className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all group mb-1",
                    isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
            >
                <item.icon className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600"
                )} />
                {item.name}
                {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
                )}
            </Link>
        )
    }

    return (
        <aside className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col sticky top-0 z-50">
            <div className="p-6 flex-1 overflow-y-auto">
                <div className="flex items-center gap-2 mb-8 px-2">
                    <div className="w-9 h-9 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <span className="text-white font-black text-xl">h</span>
                    </div>
                    <div>
                        <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">
                            hummane
                        </span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">
                            Empowering Humans
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    {navigationSections.map((section) => (
                        <div key={section.label ?? 'primary'}>
                            {section.label ? (
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4 px-3">
                                    {section.label}
                                </p>
                            ) : null}
                            <nav>
                                {section.items.map((item) => (
                                    <NavLink key={item.name} item={item} />
                                ))}
                            </nav>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                <button
                    onClick={async () => {
                        try {
                            await logout()
                            router.push('/login')
                        } catch (error) {
                            toast('Failed to logout. Please try again.', 'error')
                        }
                    }}
                    className="flex items-center gap-3 px-3 py-3 w-full rounded-xl text-sm font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-100 border border-transparent transition-all group mb-4"
                >
                    <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition-colors" />
                    Logout Account
                </button>

                {currentCompany && (
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                            Active Workspace
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                                {currentCompany.name[0].toUpperCase()}
                            </div>
                            <p className="text-sm font-bold text-slate-900 truncate flex-1">
                                {currentCompany.name}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    )
}
