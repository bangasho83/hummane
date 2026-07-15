'use client'

import { ResourceTabs } from './ResourceTabs'

export function ResourcePageFrame({ children }: { children: React.ReactNode }) {
    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
            <div className="mb-6 flex flex-col gap-6">
                <div>
                    <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-600">Resource Management</p>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Resources &amp; Expenses</h1>
                    <p className="max-w-2xl font-medium text-slate-500">Review requests and reimbursements, manage company resources, and record vendor bills.</p>
                </div>
                <ResourceTabs />
            </div>
            <div className="mt-4">{children}</div>
        </div>
    )
}
