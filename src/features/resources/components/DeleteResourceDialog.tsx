'use client'

import { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface DeleteResourceDialogProps {
    name: string
    onDelete: () => Promise<void>
    disabled?: boolean
    compact?: boolean
}

export function DeleteResourceDialog({ name, onDelete, disabled, compact = true }: DeleteResourceDialogProps) {
    const [open, setOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const remove = async () => {
        setDeleting(true)
        try {
            await onDelete()
            setOpen(false)
        } catch {
            // The caller reports the API error and the dialog stays open for retry.
        } finally {
            setDeleting(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    type="button"
                    variant={compact ? 'ghost' : 'outline'}
                    size={compact ? 'icon' : 'default'}
                    disabled={disabled}
                    className={compact
                        ? 'h-10 w-10 rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-600'
                        : 'rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700'}
                    aria-label={`Delete ${name}`}
                >
                    <Trash2 className="h-4 w-4" />
                    {!compact && 'Delete permanently'}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl border-slate-100">
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This permanently removes the record. Assignment and payment history cannot be recovered.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleting} className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={deleting}
                        onClick={(event) => {
                            event.preventDefault()
                            void remove()
                        }}
                        className="rounded-xl bg-red-600 text-white hover:bg-red-700"
                    >
                        {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                        Delete permanently
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
