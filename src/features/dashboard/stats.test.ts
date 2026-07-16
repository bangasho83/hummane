import { describe, expect, it } from 'vitest'
import type { Applicant, Employee, Job } from '@/types'
import { getDashboardStats } from './stats'

describe('getDashboardStats', () => {
    it('includes the resource request total in dashboard metrics', () => {
        const employees = [{ id: 'employee-1' }] as Employee[]
        const jobs = [{ status: 'open' }, { status: 'closed' }] as Job[]
        const applicants = [{ status: 'new' }, { status: 'hired' }] as Applicant[]

        expect(getDashboardStats(employees, jobs, applicants, 24)).toEqual({
            totalEmployees: 1,
            openJobs: 1,
            resourceRequestCount: 24,
            activeApplicants: 1,
        })
    })
})