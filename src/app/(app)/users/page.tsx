'use client'

import { useEffect, useMemo, useState } from 'react'
import { useApp } from '@/lib/context/AppContext'
import { fetchUsersApi, inviteUserApi, type ApiUserItem } from '@/lib/api/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { Loader2, Plus, Users } from 'lucide-react'

export default function UsersPage() {
    const { apiAccessToken, apiCompanyId, employees } = useApp()
    const [users, setUsers] = useState<ApiUserItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isInviteOpen, setIsInviteOpen] = useState(false)
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviteRole, setInviteRole] = useState<'owner' | 'member'>('member')
    const [inviteEmployeeId, setInviteEmployeeId] = useState<string>('')
    const [isInviting, setIsInviting] = useState(false)
    const employeeById = useMemo(
        () => new Map(employees.map((employee) => [employee.id, employee])),
        [employees]
    )
    const employeeByCode = useMemo(
        () => new Map(employees.map((employee) => [employee.employeeId, employee])),
        [employees]
    )
    const employeeByEmail = useMemo(
        () => new Map(
            employees
                .filter((employee) => Boolean(employee.email))
                .map((employee) => [employee.email.toLowerCase(), employee])
        ),
        [employees]
    )

    const fetchUsers = async () => {
        if (!apiAccessToken) {
            setIsLoading(false)
            return
        }
        try {
            const data = await fetchUsersApi(apiAccessToken)
            setUsers(data)
        } catch (err) {
            console.error('Failed to fetch users:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch users')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [apiAccessToken])

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inviteEmail.trim()) {
            toast('Please enter an email address', 'error')
            return
        }
        if (inviteRole === 'member' && !inviteEmployeeId) {
            toast('Please select an employee for the member role', 'error')
            return
        }
        if (!apiAccessToken || !apiCompanyId) {
            toast('Not authenticated', 'error')
            return
        }

        setIsInviting(true)
        try {
            const payload: { companyId: string; email: string; role: 'owner' | 'member'; employeeId?: string } = {
                companyId: apiCompanyId,
                email: inviteEmail.trim(),
                role: inviteRole
            }
            if (inviteRole === 'member' && inviteEmployeeId) {
                payload.employeeId = inviteEmployeeId
            }
            await inviteUserApi(payload, apiAccessToken)
            toast('Invitation sent successfully', 'success')
            setIsInviteOpen(false)
            setInviteEmail('')
            setInviteRole('member')
            setInviteEmployeeId('')
            // Refresh users list
            fetchUsers()
        } catch (err) {
            console.error('Failed to invite user:', err)
            toast(err instanceof Error ? err.message : 'Failed to invite user', 'error')
        } finally {
            setIsInviting(false)
        }
    }

    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Users</h1>
                    <p className="text-slate-500 font-medium">Manage users in your organization</p>
                </div>
                <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 px-6 py-6 h-auto">
                            <Plus className="w-5 h-5 mr-2" />
                            Invite User
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md rounded-3xl bg-white border-slate-200">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-slate-900">Invite User</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleInvite} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-slate-700 px-1">Email</Label>
                                <Input
                                    type="email"
                                    placeholder="user@example.com"
                                    className="rounded-xl border-slate-200 h-12"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-slate-700 px-1">Role</Label>
                                <Select value={inviteRole} onValueChange={(v) => {
                                    setInviteRole(v as 'owner' | 'member')
                                    // Clear employee selection when switching to owner
                                    if (v === 'owner') {
                                        setInviteEmployeeId('')
                                    }
                                }}>
                                    <SelectTrigger className="rounded-xl border-slate-200 h-12">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="member">Member</SelectItem>
                                        <SelectItem value="owner">Owner</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {inviteRole === 'member' && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700 px-1">Employee</Label>
                                    <Select value={inviteEmployeeId} onValueChange={setInviteEmployeeId}>
                                        <SelectTrigger className="rounded-xl border-slate-200 h-12">
                                            <SelectValue placeholder="Select employee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {employees.length === 0 ? (
                                                <SelectItem value="" disabled>No employees available</SelectItem>
                                            ) : (
                                                employees.map((employee) => (
                                                    <SelectItem key={employee.id} value={employee.id}>
                                                        {employee.name} {employee.email ? `(${employee.email})` : ''}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-slate-500 px-1">Select the employee profile to associate with this user</p>
                                </div>
                            )}
                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-xl border-slate-200"
                                    onClick={() => setIsInviteOpen(false)}
                                    disabled={isInviting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="rounded-xl bg-blue-600 text-white"
                                    disabled={isInviting}
                                >
                                    {isInviting ? 'Sending...' : 'Send Invite'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <p className="text-red-600 font-medium">{error}</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                <Users className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">No Users Yet</h3>
                            <p className="text-slate-500">No users found in your organization.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">Employee ID</th>
                                        <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">Name</th>
                                        <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">Email</th>
                                        <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">Role</th>
                                        <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => {
                                        const linkedEmployee =
                                            (user.employeeId ? employeeById.get(user.employeeId) : undefined) ||
                                            (user.employeeId ? employeeByCode.get(user.employeeId) : undefined) ||
                                            (user.email ? employeeByEmail.get(user.email.toLowerCase()) : undefined)
                                        const displayName = linkedEmployee?.name || user.name || '-'
                                        const displayEmployeeId = linkedEmployee?.employeeId || user.employeeId || '-'
                                        const avatarSeed = displayName !== '-' ? displayName : (user.email || '?')
                                        return (
                                            <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 text-slate-600">{displayEmployeeId}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                                        <span className="text-blue-600 font-bold text-sm">
                                                            {avatarSeed.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <span className="font-semibold text-slate-900">{displayName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{user.email}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg">
                                                    {user.role || 'User'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-sm">
                                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                                            </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
