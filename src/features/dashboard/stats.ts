import type { Applicant, Employee, Job } from '@/types'

export const getDashboardStats = (
    employees: Employee[],
    jobs: Job[],
    applicants: Applicant[],
    resourceRequestCount: number
) => ({
    totalEmployees: employees.length,
    openJobs: jobs.filter((job) => job.status === 'open').length,
    resourceRequestCount,
    activeApplicants: applicants.filter((applicant) =>
        applicant.status !== 'rejected' && applicant.status !== 'hired'
    ).length,
})