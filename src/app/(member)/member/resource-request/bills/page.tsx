import { redirect } from 'next/navigation'

export default function LegacyMemberBillsPage() {
    redirect('/member/resource-request/reimbursements')
}
