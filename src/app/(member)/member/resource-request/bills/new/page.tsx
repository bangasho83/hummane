import { redirect } from 'next/navigation'

export default function LegacyNewMemberBillPage() {
    redirect('/member/resource-request/reimbursements/new')
}
