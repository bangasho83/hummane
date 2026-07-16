import { MemberResourceTabs } from '@/features/member/components/MemberResourceTabs'

export default function MemberResourcesLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
            <div className="mb-6 flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Resources</h1>
                    <p className="font-medium text-slate-500">Request what you need, view assigned resources and library books, and submit reimbursements.</p>
                </div>
                <MemberResourceTabs />
            </div>
            {children}
        </div>
    )
}
