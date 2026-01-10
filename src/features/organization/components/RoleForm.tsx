'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { QuillEditor } from '@/components/ui/quill-editor'
import { useApp } from '@/lib/context/AppContext'
import type { Role } from '@/types'
import { toast } from '@/components/ui/toast'

type RoleFormProps = {
    mode: 'create' | 'edit'
    role?: Role | null
}

export function RoleForm({ mode, role }: RoleFormProps) {
    const { createRole, updateRole } = useApp()
    const router = useRouter()
    const [title, setTitle] = useState(role?.title || '')
    const [description, setDescription] = useState(role?.description || '')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (role) {
            setTitle(role.title)
            setDescription(role.description || '')
        }
    }, [role])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) {
            toast('Role title is required', 'error')
            return
        }
        setLoading(true)
        try {
            if (mode === 'create') {
                await createRole({ title: title.trim(), description })
                toast('Role created successfully', 'success')
            } else if (role) {
                await updateRole(role.id, { title: title.trim(), description })
                toast('Role updated successfully', 'success')
            }
            router.push('/organization/roles')
        } catch (error: any) {
            toast(error?.message || 'Failed to save role', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSave} className="space-y-6">
            <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-slate-700 px-1">Role Title</Label>
                        <Input
                            placeholder="e.g. Senior Software Engineer"
                            className="rounded-xl border-slate-200 h-12"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-slate-700 px-1">Job Description</Label>
                        <QuillEditor
                            value={description}
                            onChange={setDescription}
                            placeholder="Describe the responsibilities and requirements..."
                            className="bg-white"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
                <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl border-slate-200"
                    onClick={() => router.push('/organization/roles')}
                    disabled={loading}
                >
                    Cancel
                </Button>
                <Button type="submit" className="rounded-xl bg-blue-600 text-white" disabled={loading}>
                    {loading ? 'Saving...' : mode === 'create' ? 'Create Role' : 'Save Changes'}
                </Button>
            </div>
        </form>
    )
}
