'use client'

import { DashboardShell } from '@/components/layout/DashboardShell'
import { OrgTabs } from '@/components/dashboard/organization/OrgTabs'

export function OrgPageFrame({ children }: { children: React.ReactNode }) {
    return (
        <DashboardShell>
            <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                <div className="flex flex-col gap-6 mb-6">
                    <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-600 mb-2">
                            Organization
                        </p>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Structure & Permissions
                        </h1>
                        <p className="text-slate-500 font-medium max-w-2xl">
                            Manage departments, roles, and leave types in one place.
                        </p>
                    </div>

                    <OrgTabs />
                </div>

                <div className="mt-4">
                    {children}
                </div>
            </div>
        </DashboardShell>
    )
}
