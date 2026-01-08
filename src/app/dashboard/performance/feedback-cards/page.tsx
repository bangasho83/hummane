'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/components/ui/toast'
import { useApp } from '@/lib/context/AppContext'
import type { FeedbackCard } from '@/types'
import { Plus, Pencil, Trash2 } from 'lucide-react'

export default function FeedbackCardsPage() {
    const { feedbackCards, deleteFeedbackCard } = useApp()

    const sortedCards = useMemo(
        () => [...feedbackCards].sort((a, b) => a.title.localeCompare(b.title)),
        [feedbackCards]
    )

    const handleDelete = (card: FeedbackCard) => {
        if (confirm(`Delete "${card.title}"? This cannot be undone.`)) {
            deleteFeedbackCard(card.id)
            toast('Feedback card deleted', 'success')
        }
    }

    return (
        <DashboardShell>
            <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6">
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Feedback Cards</h1>
                        <p className="text-slate-500 font-medium">
                            Build reusable feedback templates with weighted questions.
                        </p>
                    </div>
                    <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold px-6 py-3 h-auto">
                        <Link href="/dashboard/performance/feedback-cards/new">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Feedback Card
                        </Link>
                    </Button>
                </div>

                <Card className="border-none shadow-premium rounded-3xl bg-white overflow-hidden">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="pl-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Card Title</TableHead>
                                    <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Type</TableHead>
                                    <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 text-center">Questions</TableHead>
                                    <TableHead className="text-right pr-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedCards.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="py-12 text-center text-slate-500">
                                            No feedback cards yet. Create one to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sortedCards.map((card) => (
                                        <TableRow key={card.id} className="hover:bg-slate-50/50 border-slate-50">
                                            <TableCell className="pl-8 py-5 font-bold text-slate-900">
                                                {card.title}
                                            </TableCell>
                                            <TableCell className="py-5 text-sm font-medium text-slate-600">
                                                {card.subject}
                                            </TableCell>
                                            <TableCell className="text-center text-sm font-medium text-slate-600">
                                                {card.questions.length}
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-10 w-10 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
                                                        asChild
                                                    >
                                                        <Link href={`/dashboard/performance/feedback-cards/${card.id}/edit`}>
                                                            <Pencil className="w-5 h-5" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-10 w-10 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl"
                                                        onClick={() => handleDelete(card)}
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardShell>
    )
}
