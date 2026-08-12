import { MemberAssignedResourceList } from '@/features/member/components/MemberAssignedResourceList'
import { MemberResourceTabs } from '@/features/member/components/MemberResourceTabs'

export default function MemberBooksPage() {
    return <div className="space-y-6"><MemberResourceTabs /><MemberAssignedResourceList register="books" /></div>
}