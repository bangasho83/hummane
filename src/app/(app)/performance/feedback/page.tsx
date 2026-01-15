'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/components/ui/toast'
import { useApp } from '@/lib/context/AppContext'
import { FEEDBACK_SUBJECTS, type FeedbackCard, type FeedbackSubject } from '@/types'
import { Plus, Search, Trash2 } from 'lucide-react'

type FeedbackTypeFilter = 'all' | FeedbackSubject

export default function FeedbackPage() {
    const { feedbackCards, feedbackEntries, deleteFeedbackEntry } = useApp()
    const pathname = usePathname()
    const [searchTerm, setSearchTerm] = useState('')
    const [typeFilter, setTypeFilter] = useState<FeedbackTypeFilter>('all')
    const [cardFilter, setCardFilter] = useState<string>('all')

    const cardsById = useMemo(() => new Map(feedbackCards.map(card => [card.id, card])), [feedbackCards])
    const cardOptions = useMemo(
        () => [...feedbackCards].sort((a, b) => a.title.localeCompare(b.title)),
        [feedbackCards]
    )

    const sortedEntries = useMemo(
        () => [...feedbackEntries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        [feedbackEntries]
    )

    const filteredEntries = useMemo(() => {
        return sortedEntries.filter((entry) => {
            const card = cardsById.get(entry.cardId)
            const matchesSearch = !searchTerm
                || entry.id.toLowerCase().includes(searchTerm.toLowerCase())
                || (entry.subjectName || '').toLowerCase().includes(searchTerm.toLowerCase())
                || (card?.title || '').toLowerCase().includes(searchTerm.toLowerCase())
            // Use subjectType for filtering since type can be null from API
            const entryType = entry.type || (entry.subjectType === 'Employee' ? 'Team Member' : entry.subjectType === 'Applicant' ? 'Applicant' : null)
            const matchesType = typeFilter === 'all' || entryType === typeFilter
            const matchesCard = cardFilter === 'all' || entry.cardId === cardFilter
            return matchesSearch && matchesType && matchesCard
        })
    }, [sortedEntries, cardsById, searchTerm, typeFilter, cardFilter])

    const hasActiveFilters = searchTerm || typeFilter !== 'all' || cardFilter !== 'all'

    const clearFilters = () => {
        setSearchTerm('')
        setTypeFilter('all')
        setCardFilter('all')
    }

    const handleDelete = async (entryId: string) => {
        if (confirm('Delete this feedback entry?')) {
            try {
                await deleteFeedbackEntry(entryId)
                toast('Feedback entry deleted', 'success')
            } catch (error) {
                toast('Failed to delete feedback entry', 'error')
            }
        }
    }

    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Feedback</h1>
                    <p className="text-slate-500 font-medium">
                        Submit feedback using predefined cards.
                    </p>
                </div>
                <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold px-6 py-3 h-auto">
                    <Link href="/performance/feedback/new">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Feedback
                    </Link>
                </Button>
            </div>

            <Card className="border-none shadow-premium rounded-3xl bg-white overflow-hidden">
                <CardContent className="p-0">
                    <div className="p-8 border-b border-slate-100">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex-1 min-w-[280px]">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <Input
                                        placeholder="Search feedback..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-11 bg-slate-50 border-slate-100 h-12 rounded-2xl focus-visible:ring-blue-500/20"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as FeedbackTypeFilter)}>
                                    <SelectTrigger className="w-[160px] bg-slate-50 border-slate-100 h-12 rounded-2xl">
                                        <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        {FEEDBACK_SUBJECTS.map((subject) => (
                                            <SelectItem key={subject} value={subject}>
                                                {subject}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={cardFilter} onValueChange={setCardFilter}>
                                    <SelectTrigger className="w-[220px] bg-slate-50 border-slate-100 h-12 rounded-2xl">
                                        <SelectValue placeholder="Card" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Cards</SelectItem>
                                        {cardOptions.map(card => (
                                            <SelectItem key={card.id} value={card.id}>
                                                {card.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {hasActiveFilters && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearFilters}
                                        className="text-slate-500 hover:text-red-500 font-bold"
                                    >
                                        Reset
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="pl-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">View Feedback</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Card</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Recipient</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">From</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Date</TableHead>
                                <TableHead className="text-right pr-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredEntries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-12 text-center text-slate-500">
                                        {feedbackEntries.length === 0 ? 'No feedback submitted yet.' : 'No matches for the selected filters.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredEntries.map((entry) => {
                                    const card = cardsById.get(entry.cardId) as FeedbackCard | undefined
                                    // Complete if all answers with kind 'score' have answer value > 0
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    const scoreAnswers = entry.answers.filter((a: any) => a.question?.kind === 'score')
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    const isIncomplete = scoreAnswers.some((a: any) => {
                                        const value = parseInt(a.answer, 10)
                                        return isNaN(value) || value <= 0
                                    })
                                    return (
                                        <TableRow key={entry.id} className="hover:bg-slate-50/50 border-slate-50">
                                            <TableCell className="pl-8 py-5">
                                                <Link
                                                    href={`/performance/feedback/${entry.id}`}
                                                    onClick={() => {
                                                        if (typeof window !== 'undefined') {
                                                            sessionStorage.setItem('feedbackDetailBack', pathname)
                                                        }
                                                    }}
                                                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                                                >
                                                    View Feedback
                                                </Link>
                                            </TableCell>
                                            <TableCell className="py-5 text-sm text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <span>{card?.title || 'Unknown'}</span>
                                                    {isIncomplete && (
                                                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                                                            Incomplete
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5 font-semibold text-slate-900">
                                                {entry.subjectName || 'Unknown'}
                                            </TableCell>
                                            <TableCell className="py-5 text-sm font-medium text-slate-600">
                                                {entry.authorName || '—'}
                                            </TableCell>
                                            <TableCell className="py-5 text-sm text-slate-500">
                                                {new Date(entry.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl"
                                                    onClick={() => handleDelete(entry.id)}
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                                )}
                            </TableBody>
                        </Table>
                </CardContent>
            </Card>
        </div>
    )
}
