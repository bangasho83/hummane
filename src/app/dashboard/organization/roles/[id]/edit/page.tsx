'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { OrgPageFrame, RoleForm } from '@/features/organization'
import { useApp } from '@/lib/context/AppContext'
import type { Role } from '@/types'
import { toast } from '@/components/ui/toast'

export default function EditRolePage() {
    const params = useParams()
    const router = useRouter()
    const { roles } = useApp()
    const roleId = params.id as string
    const role = useMemo(() => roles.find(r => r.id === roleId), [roles, roleId])
    const [current, setCurrent] = useState<Role | null>(role || null)

    useEffect(() => {
        if (role) {
            setCurrent(role)
        } else if (roles.length > 0 && !role) {
            toast('Role not found', 'error')
            router.push('/dashboard/organization/roles')
        }
    }, [role, roles.length, router])

    return (
        <OrgPageFrame>
            <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Edit Role</h1>
                    <p className="text-slate-500 font-medium">Update the title and description for this role.</p>
                </div>
                <RoleForm mode="edit" role={current} />
            </div>
        </OrgPageFrame>
    )
}
