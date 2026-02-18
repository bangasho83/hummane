'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ExternalLink, Search, Users } from 'lucide-react'
import { useApp } from '@/lib/context/AppContext'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { APPLICANT_STATUSES, type Applicant, type ApplicantStatus } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://hummane-api.vercel.app'

export default function MemberApplicantsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const jobIdParam = searchParams.get('jobId')
  const { apiAccessToken, meProfile, jobs, roles, isHydrating } = useApp()
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')

  const employeeId = meProfile?.employeeId

  const departments = useMemo(() => {
    const unique = [...new Set(jobs.map(job => job.department).filter(Boolean) as string[])]
    return unique.sort()
  }, [jobs])

  const rolesById = useMemo(() => {
    const map = new Map<string, string>()
    roles.forEach(role => map.set(role.id, role.title))
    return map
  }, [roles])

  const roleOptions = useMemo(() => {
    const ids = [...new Set(jobs.map(job => job.roleId).filter(Boolean) as string[])]
    return ids
      .map(id => ({ id, title: rolesById.get(id) || 'Unknown role' }))
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [jobs, rolesById])

  const jobById = useMemo(() => new Map(jobs.map(job => [job.id, job])), [jobs])
  const jobByTitle = useMemo(() => new Map(jobs.map(job => [job.title, job])), [jobs])

  const getApplicantJob = useCallback((applicant: Applicant) => {
    if (applicant.jobId && jobById.has(applicant.jobId)) {
      return jobById.get(applicant.jobId)
    }
    return jobByTitle.get(applicant.positionApplied)
  }, [jobById, jobByTitle])

  const toExternalUrl = (value?: string) => {
    if (!value) return ''
    const trimmed = value.trim()
    if (!trimmed) return ''
    if (/^https?:\/\//i.test(trimmed)) return trimmed
    return `https://${trimmed}`
  }

  const getResumeUrl = (applicant: Applicant) => {
    if (typeof applicant.resumeFile === 'string') return applicant.resumeFile
    if (typeof applicant.resumeFile === 'object' && applicant.resumeFile?.dataUrl) return applicant.resumeFile.dataUrl
    if (applicant.documents?.files?.length) return applicant.documents.files[0]
    return ''
  }

  const formatSalary = (value?: number) => {
    if (!value) return 'Not specified'
    return Math.round(value).toLocaleString('en-US', { maximumFractionDigits: 0 })
  }

  const getStatusColor = (status: ApplicantStatus) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700'
      case 'first interview': return 'bg-yellow-100 text-yellow-700'
      case 'second interview': return 'bg-purple-100 text-purple-700'
      case 'final interview': return 'bg-indigo-100 text-indigo-700'
      case 'initiate documentation': return 'bg-green-100 text-green-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      case 'hired': return 'bg-emerald-100 text-emerald-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  const fetchApplicants = useCallback(async () => {
    if (!apiAccessToken || !employeeId) {
      setApplicants([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const url = `${API_BASE_URL}/applicants?employeeId=${encodeURIComponent(employeeId)}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiAccessToken}`,
        },
      })

      if (!response.ok) {
        setApplicants([])
        return
      }

      const data = await response.json().catch(() => null)
      const list = data?.data || data?.applicants || data
      const items = Array.isArray(list) ? (list as Applicant[]) : []
      setApplicants(items.filter(item => APPLICANT_STATUSES.includes(item.status as ApplicantStatus)))
    } catch {
      setApplicants([])
    } finally {
      setLoading(false)
    }
  }, [apiAccessToken, employeeId])

  useEffect(() => {
    if (!isHydrating) {
      void fetchApplicants()
    }
  }, [isHydrating, fetchApplicants])

  const filteredApplicants = useMemo(() => {
    return applicants.filter(applicant => {
      const job = getApplicantJob(applicant)
      const matchesSearch =
        applicant.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        applicant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        applicant.positionApplied.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesDepartment = departmentFilter === 'all' || job?.department === departmentFilter
      const matchesRole = roleFilter === 'all' || job?.roleId === roleFilter
      const matchesJob = !jobIdParam || applicant.jobId === jobIdParam
      return matchesSearch && matchesDepartment && matchesRole && matchesJob
    })
  }, [applicants, departmentFilter, getApplicantJob, jobIdParam, roleFilter, searchTerm])

  const hasActiveFilters = searchTerm || departmentFilter !== 'all' || roleFilter !== 'all'

  if (isHydrating) {
    return <div className="p-8 text-slate-500">Loading applicants...</div>
  }

  if (!employeeId) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-slate-900">Applicants</h1>
        <p className="mt-2 text-slate-500">No employee profile linked to this account.</p>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Applicants</h1>
        <p className="text-slate-500 font-medium">Applicants assigned to you.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  placeholder="Search applicants..."
                  className="pl-11 bg-slate-50 border-slate-100 h-12 rounded-2xl focus-visible:ring-blue-500/20"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[180px] bg-slate-50 border-slate-100 h-12 rounded-2xl">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px] bg-slate-50 border-slate-100 h-12 rounded-2xl">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.id} value={role.id}>{role.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('')
                    setDepartmentFilter('all')
                    setRoleFilter('all')
                  }}
                  className="text-sm text-slate-500 hover:text-red-500 font-bold"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading assigned applicants...</div>
        ) : filteredApplicants.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
              <Users className="w-10 h-10 text-slate-200" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {searchTerm ? 'No results found' : 'No Assigned Applicants'}
            </h2>
            <p className="text-slate-500 font-medium max-w-sm">
              {searchTerm ? `No assigned applicants match "${searchTerm}".` : 'No applicants are assigned to you yet.'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="pl-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Name</TableHead>
                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Position</TableHead>
                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Experience</TableHead>
                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Current Salary</TableHead>
                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Expected Salary</TableHead>
                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">LinkedIn</TableHead>
                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Resume</TableHead>
                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Status</TableHead>
                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Applied Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplicants.map((applicant) => {
                const linkedinUrl = toExternalUrl(applicant.linkedinUrl)
                const resumeUrl = getResumeUrl(applicant)
                return (
                  <TableRow
                    key={applicant.id}
                    className="hover:bg-slate-50/50 border-slate-50 cursor-pointer group"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        sessionStorage.setItem('applicantDetailBack', '/member/applicants')
                      }
                      router.push(`/member/applicants/${applicant.id}`)
                    }}
                  >
                    <TableCell className="pl-8 py-5 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{applicant.fullName}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(`/member/applicants/${applicant.id}`, '_blank', 'noopener')
                          }}
                          aria-label={`Open ${applicant.fullName} profile in new tab`}
                          title="Open in new tab"
                          className="text-slate-300 hover:text-slate-500 opacity-60 group-hover:opacity-100 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">{applicant.positionApplied}</TableCell>
                    <TableCell className="text-slate-600">{applicant.yearsOfExperience} {applicant.yearsOfExperience === 1 ? 'year' : 'years'}</TableCell>
                    <TableCell className="text-right text-slate-600 tabular-nums">{formatSalary(applicant.currentSalary)}</TableCell>
                    <TableCell className="text-right text-slate-600 tabular-nums">{formatSalary(applicant.expectedSalary)}</TableCell>
                    <TableCell className="text-slate-600">
                      {linkedinUrl ? (
                        <a
                          href={linkedinUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-600 hover:underline"
                        >
                          View
                        </a>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {resumeUrl ? (
                        <a
                          href={resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-600 hover:underline"
                        >
                          Open
                        </a>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(applicant.status)}`}>
                        {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-600">{new Date(applicant.appliedDate).toLocaleDateString()}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
