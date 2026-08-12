import { ReimbursementList } from '@/features/resources'
import { MemberResourceTabs } from '@/features/member/components/MemberResourceTabs'

export default function MemberReimbursementsPage() {
    return <div className="space-y-6"><MemberResourceTabs /><ReimbursementList memberMode /></div>
}