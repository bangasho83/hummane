'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, ChevronDown, ChevronRight, Edit3, Goal, Loader2, Plus, RotateCcw, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { useApp } from '@/lib/context/AppContext'
import {
  createOkrCycleApi,
  createOkrObjectiveApi,
  deleteOkrObjectiveApi,
  fetchActiveOkrBoardApi,
  updateOkrCycleApi,
  updateOkrObjectiveApi,
  type OkrCyclePayload,
  type OkrObjectivePayload,
} from '@/lib/api/client'
import type { OkrBoard, OkrKeyResult, OkrObjective, OkrObjectiveLevel, OkrObjectiveStatus } from '@/types'

const dateKey = (date: Date) => date.toISOString().slice(0, 10)
const addYear = () => { const date = new Date(); date.setFullYear(date.getFullYear() + 1); return dateKey(date) }
const progressClass = (status: OkrObjectiveStatus) => status === 'completed' ? 'bg-emerald-500' : status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-300'

function ProgressBar({ progress, status }: { progress: number; status?: OkrObjectiveStatus | null }) {
  return <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full rounded-full ${progressClass(status ?? 'upcoming')}`} style={{ width: `${progress}%` }} /></div>
}

const newKeyResult = (): OkrKeyResult => ({ id: crypto.randomUUID(), title: '', description: '', unit: '', startValue: 0, currentValue: 0, targetValue: 1, dueDate: addYear(), status: 'upcoming' })

function KeyResultFields({ item, onChange, onRemove }: { item: OkrKeyResult; onChange: (item: OkrKeyResult) => void; onRemove: () => void }) {
  return <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Key result</p><Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-red-500" onClick={onRemove}>Remove</Button></div><Input required placeholder="e.g. Qualified meetings booked" value={item.title} onChange={e => onChange({ ...item, title: e.target.value })} /><Textarea placeholder="What this measurable checkpoint delivers" value={item.description ?? ''} onChange={e => onChange({ ...item, description: e.target.value })} className="min-h-16" /><div className="grid grid-cols-2 gap-2"><Input required placeholder="Unit: leads, clients, %" value={item.unit} onChange={e => onChange({ ...item, unit: e.target.value })} /><Input required type="date" value={item.dueDate} onChange={e => onChange({ ...item, dueDate: e.target.value })} /></div><div className="grid grid-cols-3 gap-2"><Input required min="0" step="any" type="number" aria-label="Start value" value={item.startValue} onChange={e => onChange({ ...item, startValue: Number(e.target.value) })} /><Input required min="0" step="any" type="number" aria-label="Current value" value={item.currentValue} onChange={e => onChange({ ...item, currentValue: Number(e.target.value) })} /><Input required min="0.01" step="any" type="number" aria-label="Target value" value={item.targetValue} onChange={e => onChange({ ...item, targetValue: Number(e.target.value) })} /></div><div className="grid grid-cols-3 gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400"><span>Start</span><span>Current</span><span>Target</span></div></div>
}

function IndividualObjectiveForm({
  cycleId, objective, level, departmentId, parentObjectiveId, employeeId, onSave, onCancel,
}: {
  cycleId: string
  objective?: OkrObjective | null
  level: OkrObjectiveLevel
  departmentId?: string
  parentObjectiveId?: string
  employeeId?: string
  onSave: (payload: OkrObjectivePayload) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<OkrObjectivePayload>({
    cycleId, level, departmentId, parentObjectiveId, employeeId,
    headline: objective?.headline ?? '', description: objective?.description ?? '', keyResults: objective?.keyResults?.length ? objective.keyResults : [newKeyResult()],
  })
  const [saving, setSaving] = useState(false)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true)
    try {
      const payload = form
      await onSave(payload)
      onCancel()
    }
    catch (error) { toast(error instanceof Error ? error.message : 'Could not save objective', 'error') }
    finally { setSaving(false) }
  }
  return <form className="space-y-4" onSubmit={submit}>
    <div><label className="text-xs font-bold text-slate-600">Objective</label><Input required value={form.headline} onChange={e => setForm({ ...form, headline: e.target.value })} className="mt-1" /></div>
    <div><label className="text-xs font-bold text-slate-600">Description</label><Textarea value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 min-h-20" /></div>
    <div className="flex items-center justify-between"><label className="text-xs font-bold text-slate-600">Key results & milestones</label><Button type="button" size="sm" variant="outline" onClick={() => setForm({ ...form, keyResults: [...(form.keyResults ?? []), newKeyResult()] })}><Plus className="h-3.5 w-3.5" />Add key result</Button></div>
    <div className="max-h-96 space-y-3 overflow-y-auto">{(form.keyResults ?? []).map((keyResult, index) => <KeyResultFields key={keyResult.id} item={keyResult} onChange={next => setForm({ ...form, keyResults: form.keyResults?.map((item, itemIndex) => itemIndex === index ? next : item) })} onRemove={() => setForm({ ...form, keyResults: form.keyResults?.filter((_, itemIndex) => itemIndex !== index) })} />)}</div>
    <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button disabled={saving} type="submit">{saving ? 'Saving…' : 'Save objective'}</Button></div>
  </form>
}

function TeamObjectiveForm({ cycleId, objective, departmentId, onSave, onCancel }: { cycleId: string; objective?: OkrObjective; departmentId?: string; onSave: (payload: OkrObjectivePayload) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState<OkrObjectivePayload>({ cycleId, level: 'team', departmentId, headline: objective?.headline ?? '', description: objective?.description ?? '' })
  const [saving, setSaving] = useState(false)
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); try { await onSave(form); onCancel() } catch (error) { toast(error instanceof Error ? error.message : 'Could not save team objective', 'error') } finally { setSaving(false) } }
  return <form className="space-y-4" onSubmit={submit}><div><label className="text-xs font-bold text-slate-600">Team objective</label><Input required value={form.headline} onChange={e => setForm({ ...form, headline: e.target.value })} className="mt-1" /></div><div><label className="text-xs font-bold text-slate-600">What this team is responsible for</label><Textarea value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 min-h-24" /></div><p className="rounded-md bg-blue-50 p-3 text-xs text-blue-700">Progress is calculated automatically from this department&apos;s individual objectives.</p><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button disabled={saving} type="submit">{saving ? 'Saving…' : 'Save team objective'}</Button></div></form>
}

function ObjectiveCard({ objective, onEdit, onDelete }: { objective: OkrObjective; onEdit: () => void; onDelete?: () => void }) {
  const isTeam = objective.level === 'team'
  return <Card className="border-slate-200 shadow-sm"><CardContent className="p-4 space-y-3">
    <div className="flex justify-between gap-2"><div className="min-w-0"><p className="font-bold text-slate-900 text-sm leading-tight">{objective.headline || 'Untitled objective'}</p>{!isTeam && objective.dueDate && <p className="text-xs text-slate-500 mt-1">Due {new Date(`${objective.dueDate}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>}</div><div className="flex gap-1"><Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit} aria-label="Edit objective"><Edit3 className="h-3.5 w-3.5" /></Button>{onDelete && <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={onDelete} aria-label="Delete objective"><Trash2 className="h-3.5 w-3.5" /></Button>}</div></div>
    {objective.description && <p className="text-xs text-slate-500 line-clamp-2">{objective.description}</p>}
    <ProgressBar progress={objective.progress} status={objective.status} />
    <div className="flex items-center justify-between text-xs"><span className="font-semibold text-slate-600">{isTeam ? 'Member progress roll-up' : `${objective.currentValue} / ${objective.targetValue} ${objective.unit ?? ''}`}</span><span className="font-bold text-blue-600">{objective.progress}%</span></div>
    {objective.updatedByName && <p className="text-[10px] text-slate-400">Last updated by {objective.updatedByName}</p>}
  </CardContent></Card>
}

export function OkrBoard({ adminView = false }: { adminView?: boolean }) {
  const { apiAccessToken, isHydrating, departments, employees } = useApp()
  const [board, setBoard] = useState<OkrBoard | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const lanesInitialized = useRef(false)
  const [cycleDialog, setCycleDialog] = useState(false)
  const [objectiveDialog, setObjectiveDialog] = useState<{ objective?: OkrObjective; level: OkrObjectiveLevel; departmentId?: string; parentObjectiveId?: string; employeeId?: string } | null>(null)
  const [cycleForm, setCycleForm] = useState<OkrCyclePayload>({ headline: '', description: '', targetValue: 0, unit: '', targetDate: addYear(), status: 'active' })

  const refresh = useCallback(async () => {
    if (!apiAccessToken) return
    setLoading(true)
    try { const value = await fetchActiveOkrBoardApi(apiAccessToken); setBoard(value); if (value) setCycleForm({ headline: value.cycle.headline, description: value.cycle.description, targetValue: value.cycle.targetValue, unit: value.cycle.unit, targetDate: value.cycle.targetDate, status: value.cycle.status }) }
    catch (error) { toast(error instanceof Error ? error.message : 'Could not load OKRs', 'error') }
    finally { setLoading(false) }
  }, [apiAccessToken])

  useEffect(() => { if (!isHydrating) void refresh() }, [isHydrating, refresh])
  useEffect(() => { if (board && !lanesInitialized.current) { setExpanded(new Set(departments.map(department => department.id))); lanesInitialized.current = true } }, [board, departments])

  const saveCycle = async (event: React.FormEvent) => {
    event.preventDefault(); if (!apiAccessToken) return
    try { if (board) await updateOkrCycleApi(board.cycle.id, cycleForm, apiAccessToken); else await createOkrCycleApi(cycleForm, apiAccessToken); setCycleDialog(false); await refresh(); toast('OKR cycle saved', 'success') }
    catch (error) { toast(error instanceof Error ? error.message : 'Could not save cycle', 'error') }
  }
  const saveObjective = async (payload: OkrObjectivePayload) => {
    if (!apiAccessToken) return
    if (objectiveDialog?.objective) await updateOkrObjectiveApi(objectiveDialog.objective.id, payload, apiAccessToken)
    else await createOkrObjectiveApi(payload, apiAccessToken)
    await refresh(); toast('Objective saved', 'success')
  }
  const removeObjective = async (id: string) => {
    if (!apiAccessToken || !confirm('Delete this objective and its linked individual objectives?')) return
    try { await deleteOkrObjectiveApi(id, apiAccessToken); await refresh(); toast('Objective deleted', 'success') } catch { toast('Could not delete objective', 'error') }
  }
  const employeeByDepartment = useMemo(() => new Map(departments.map(department => [department.id, employees.filter(employee => employee.departmentId === department.id)])), [departments, employees])
  const teamByDepartment = useMemo(() => new Map(board?.departments.map(department => [department.id, department]) ?? []), [board])
  const timelineStart = useMemo(() => { const date = new Date(); date.setMonth(date.getMonth() - 1); date.setDate(1); return date }, [])
  const timelineEnd = useMemo(() => board ? new Date(`${board.cycle.targetDate}T23:59:59`) : new Date(addYear()), [board])
  const timelineMonths = useMemo(() => { const months: Date[] = []; const cursor = new Date(timelineStart.getFullYear(), timelineStart.getMonth(), 1); while (cursor <= timelineEnd) { months.push(new Date(cursor)); cursor.setMonth(cursor.getMonth() + 1) } return months }, [timelineStart, timelineEnd])
  const timelinePosition = (dueDate: string) => { const total = Math.max(1, timelineEnd.getTime() - timelineStart.getTime()); return Math.max(1, Math.min(96, ((new Date(`${dueDate}T12:00:00`).getTime() - timelineStart.getTime()) / total) * 100)) }

  if (loading || isHydrating) return <div className="flex min-h-80 items-center justify-center text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading shared OKRs…</div>
  if (!board) return <>
    <Card className="border-dashed border-slate-300"><CardContent className="p-14 text-center"><Goal className="mx-auto h-12 w-12 text-blue-500" /><h1 className="mt-4 text-2xl font-extrabold text-slate-900">Start your shared OKR cycle</h1><p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">Anyone on the team can create the company objective, then connect department and individual objectives to it.</p><Button className="mt-6" onClick={() => { setCycleForm({ headline: '', description: '', targetValue: 0, unit: '', targetDate: addYear(), status: 'active' }); setCycleDialog(true) }}><Plus className="mr-2 h-4 w-4" />Create shared OKR cycle</Button></CardContent></Card>
    <Dialog open={cycleDialog} onOpenChange={setCycleDialog}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Create shared OKR cycle</DialogTitle></DialogHeader><form onSubmit={saveCycle} className="space-y-4"><div><label className="text-xs font-bold text-slate-600">Company objective</label><Input required className="mt-1" value={cycleForm.headline ?? ''} onChange={e => setCycleForm({ ...cycleForm, headline: e.target.value })} /></div><div><label className="text-xs font-bold text-slate-600">Description</label><Textarea className="mt-1" value={cycleForm.description ?? ''} onChange={e => setCycleForm({ ...cycleForm, description: e.target.value })} /></div><div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-bold text-slate-600">Target</label><Input required type="number" min="0" className="mt-1" value={cycleForm.targetValue ?? 0} onChange={e => setCycleForm({ ...cycleForm, targetValue: Number(e.target.value) })} /></div><div><label className="text-xs font-bold text-slate-600">Unit</label><Input required className="mt-1" value={cycleForm.unit ?? ''} onChange={e => setCycleForm({ ...cycleForm, unit: e.target.value })} /></div></div><div><label className="text-xs font-bold text-slate-600">Target date</label><Input required type="date" className="mt-1" value={cycleForm.targetDate ?? ''} onChange={e => setCycleForm({ ...cycleForm, targetDate: e.target.value })} /></div><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setCycleDialog(false)}>Cancel</Button><Button type="submit">Save company objective</Button></div></form></DialogContent></Dialog>
  </>

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Shared team workspace</p><h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{adminView ? 'Company OKR alignment' : 'Our OKRs'}</h1><p className="mt-1 text-slate-500">Everyone in the company can enrich this cycle.</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => void refresh()}><RotateCcw className="mr-2 h-4 w-4" />Refresh</Button><Button onClick={() => setCycleDialog(true)}><Edit3 className="mr-2 h-4 w-4" />Edit company objective</Button></div></div>
    <Card className="border-slate-200 bg-gradient-to-br from-white to-blue-50"><CardContent className="p-6"><div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-2 text-sm font-bold text-blue-600"><Goal className="h-4 w-4" />Company objective</div><h2 className="mt-2 text-xl font-extrabold text-slate-900">{board.cycle.headline || 'Untitled company objective'}</h2>{board.cycle.description && <p className="mt-1 max-w-2xl text-sm text-slate-600">{board.cycle.description}</p>}<p className="mt-3 text-sm font-semibold text-slate-700">{board.cycle.targetValue} {board.cycle.unit} · Target {new Date(`${board.cycle.targetDate}T00:00:00`).toLocaleDateString()}</p></div><div className="min-w-32 text-center"><p className="text-3xl font-extrabold text-blue-600">{board.cycle.progress ?? 0}%</p><p className="text-xs font-bold uppercase tracking-wider text-slate-400">aligned progress</p></div></div></CardContent></Card>
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="grid min-w-[1180px] grid-cols-[240px_minmax(620px,1fr)_320px] border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500"><div className="p-4">Individual OKRs</div><div className="flex border-x border-slate-200">{timelineMonths.map(month => <div key={month.toISOString()} className="flex-1 p-4 text-center">{month.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</div>)}</div><div className="p-4 text-center">Team OKRs</div></div><div className="min-w-[1180px] divide-y divide-slate-200">{departments.map(department => { const team = teamByDepartment.get(department.id); const departmentEmployees = employeeByDepartment.get(department.id) ?? []; const teamObjective = team?.teamObjective; return <div key={department.id} className="grid grid-cols-[240px_minmax(620px,1fr)_320px]"><div className="border-r border-slate-200 bg-slate-50/70"><button className="flex w-full items-center justify-between border-b border-slate-200 p-3 text-left" onClick={() => setExpanded(previous => { const next = new Set(previous); next.has(department.id) ? next.delete(department.id) : next.add(department.id); return next })}><span className="flex items-center gap-2 font-bold text-slate-800"><Users className="h-4 w-4 text-blue-600" />{department.name}</span>{expanded.has(department.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button>{expanded.has(department.id) && departmentEmployees.map(employee => { const individual = team?.individuals.find(item => item.employeeId === employee.id); return <div key={employee.id} className="min-h-44 border-b border-slate-200 p-3 last:border-b-0"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">{employee.name.split(' ').map(name => name[0]).slice(0, 2).join('')}</span><div><p className="text-sm font-bold text-slate-800">{employee.name}</p><p className="text-xs text-slate-500">{employee.position || employee.roleName || 'Team member'}</p></div></div>{individual ? <button className="mt-3 w-full rounded-lg border border-blue-200 bg-white p-3 text-left" onClick={() => setObjectiveDialog({ objective: individual, level: 'individual' })}><p className="text-xs font-bold uppercase text-blue-600">{employee.name.split(' ')[0]}&apos;s objective</p><p className="mt-1 text-sm font-bold text-slate-800">{individual.headline}</p><ProgressBar progress={individual.progress} status={individual.status} /><p className="mt-1 text-right text-xs font-bold text-blue-600">{individual.progress}%</p></button> : <Button variant="outline" className="mt-3 h-auto w-full justify-start border-dashed p-3 text-left text-xs" onClick={() => teamObjective ? setObjectiveDialog({ level: 'individual', parentObjectiveId: teamObjective.id, employeeId: employee.id }) : setObjectiveDialog({ level: 'team', departmentId: department.id })}><Plus className="h-4 w-4" />{teamObjective ? 'Define contributor objective' : 'Define team objective first'}</Button>}</div>})}</div><div className="relative border-r border-slate-200 bg-white" style={{ backgroundImage: `linear-gradient(to right, #e2e8f0 1px, transparent 1px)`, backgroundSize: `${100 / Math.max(1, timelineMonths.length)}% 100%` }}>{expanded.has(department.id) && departmentEmployees.map(employee => { const individual = team?.individuals.find(item => item.employeeId === employee.id); return <div key={employee.id} className="relative min-h-44 border-b border-slate-100 px-4 py-3 last:border-b-0">{individual?.keyResults.map(keyResult => <button key={keyResult.id} className="absolute top-5 w-36 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm hover:border-blue-400" style={{ left: `${timelinePosition(keyResult.dueDate)}%` }} onClick={() => setObjectiveDialog({ objective: individual, level: 'individual' })}><span className={`mb-2 block h-2.5 w-2.5 rounded-full ${progressClass(keyResult.status)}`} /><p className="line-clamp-2 text-xs font-bold text-slate-800">{keyResult.title}</p><p className="mt-2 text-[10px] text-slate-500">{keyResult.currentValue}/{keyResult.targetValue} {keyResult.unit}</p><p className="text-[10px] text-slate-400">Due {new Date(`${keyResult.dueDate}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p></button>)}{individual && <Button size="sm" variant="ghost" className="absolute bottom-2 left-3 text-xs text-blue-600" onClick={() => setObjectiveDialog({ objective: individual, level: 'individual' })}><Plus className="h-3 w-3" />Key result</Button>}</div>})}<div className="pointer-events-none absolute inset-y-0 w-px bg-red-400" style={{ left: `${timelinePosition(dateKey(new Date()))}%` }} /></div><div className="bg-slate-50/50 p-4">{teamObjective ? <ObjectiveCard objective={teamObjective} onEdit={() => setObjectiveDialog({ objective: teamObjective, level: 'team' })} onDelete={() => void removeObjective(teamObjective.id)} /> : <Button variant="outline" className="w-full justify-start border-dashed" onClick={() => setObjectiveDialog({ level: 'team', departmentId: department.id })}><Plus className="h-4 w-4" />Add team objective</Button>}</div></div> })}</div><div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500"><span className="font-bold">Legend:</span> <span className="ml-3 text-emerald-600">● Completed</span><span className="ml-3 text-blue-600">● In progress</span><span className="ml-3 text-slate-400">● Upcoming</span><span className="ml-6">Red line = today</span></div></section>
    <Dialog open={cycleDialog} onOpenChange={setCycleDialog}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{board ? 'Edit company objective' : 'Create shared OKR cycle'}</DialogTitle></DialogHeader><form onSubmit={saveCycle} className="space-y-4"><div><label className="text-xs font-bold text-slate-600">Company objective</label><Input required className="mt-1" value={cycleForm.headline ?? ''} onChange={e => setCycleForm({ ...cycleForm, headline: e.target.value })} /></div><div><label className="text-xs font-bold text-slate-600">Description</label><Textarea className="mt-1" value={cycleForm.description ?? ''} onChange={e => setCycleForm({ ...cycleForm, description: e.target.value })} /></div><div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-bold text-slate-600">Target</label><Input required type="number" min="0" className="mt-1" value={cycleForm.targetValue ?? 0} onChange={e => setCycleForm({ ...cycleForm, targetValue: Number(e.target.value) })} /></div><div><label className="text-xs font-bold text-slate-600">Unit</label><Input required className="mt-1" value={cycleForm.unit ?? ''} onChange={e => setCycleForm({ ...cycleForm, unit: e.target.value })} /></div></div><div><label className="text-xs font-bold text-slate-600">Target date</label><Input required type="date" className="mt-1" value={cycleForm.targetDate ?? ''} onChange={e => setCycleForm({ ...cycleForm, targetDate: e.target.value })} /></div><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setCycleDialog(false)}>Cancel</Button><Button type="submit">Save company objective</Button></div></form></DialogContent></Dialog>
    <Dialog open={Boolean(objectiveDialog)} onOpenChange={open => !open && setObjectiveDialog(null)}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{objectiveDialog?.objective ? `Edit ${objectiveDialog.level === 'team' ? 'team objective' : 'objective'}` : `Add ${objectiveDialog?.level === 'team' ? 'team objective' : 'objective'}`}</DialogTitle></DialogHeader>{objectiveDialog?.level === 'team' ? <TeamObjectiveForm cycleId={board.cycle.id} objective={objectiveDialog.objective} departmentId={objectiveDialog.departmentId ?? objectiveDialog.objective?.departmentId ?? undefined} onSave={saveObjective} onCancel={() => setObjectiveDialog(null)} /> : objectiveDialog && <IndividualObjectiveForm cycleId={board.cycle.id} objective={objectiveDialog.objective} level="individual" departmentId={objectiveDialog.departmentId} parentObjectiveId={objectiveDialog.parentObjectiveId ?? objectiveDialog.objective?.parentObjectiveId ?? undefined} employeeId={objectiveDialog.employeeId ?? objectiveDialog.objective?.employeeId ?? undefined} onSave={saveObjective} onCancel={() => setObjectiveDialog(null)} />}</DialogContent></Dialog>
  </div>
}
