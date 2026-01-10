import type { Company, Department, Role, LeaveType, LeaveRecord, Holiday, Job, Applicant, Employee, FeedbackCard, FeedbackEntry } from '@/types'

export type ApiUser = {
  id: string
  email?: string
  name?: string
  companyId?: string
  createdAt?: string
}

export type ApiCompany = Partial<Company>

export type AuthLoginResponse = {
  access_token?: string
  accessToken?: string
  user?: ApiUser
  company?: ApiCompany
  [key: string]: unknown
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://hummane-api.vercel.app'
const AUTH_LOGIN_PATH = `${API_BASE_URL}/auth/login`
const COMPANIES_PATH = `${API_BASE_URL}/companies`
const EMPLOYEES_PATH = `${API_BASE_URL}/employees`
const DEPARTMENTS_PATH = `${API_BASE_URL}/departments`
const ROLES_PATH = `${API_BASE_URL}/roles`
const LEAVE_TYPES_PATH = `${API_BASE_URL}/leave-types`
const LEAVES_PATH = `${API_BASE_URL}/leaves`
const FEEDBACK_CARDS_PATH = `${API_BASE_URL}/feedback-cards`
const FEEDBACK_ENTRIES_PATH = `${API_BASE_URL}/feedback-entries`
const HOLIDAYS_PATH = `${API_BASE_URL}/holidays`
const JOBS_PATH = `${API_BASE_URL}/jobs`
const APPLICANTS_PATH = `${API_BASE_URL}/applicants`
const ACCESS_TOKEN_KEY = 'hummaneApiAccessToken'
const API_USER_KEY = 'hummaneApiUser'
const COMPANY_ID_KEY = 'hummaneCompanyId'

const readStorage = (key: string) => {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(key)
}

const writeStorage = (key: string, value: string) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, value)
}

const removeStorage = (key: string) => {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(key)
}

export const getStoredAccessToken = () => readStorage(ACCESS_TOKEN_KEY)
export const getStoredCompanyId = () => readStorage(COMPANY_ID_KEY)

export const getStoredApiUser = (): ApiUser | null => {
  const raw = readStorage(API_USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as ApiUser
  } catch {
    return null
  }
}

export const persistApiSession = (accessToken: string, user: ApiUser) => {
  writeStorage(ACCESS_TOKEN_KEY, accessToken)
  writeStorage(API_USER_KEY, JSON.stringify(user))
}

export const persistCompanyId = (companyId: string) => {
  writeStorage(COMPANY_ID_KEY, companyId)
}

export const clearApiSession = () => {
  removeStorage(ACCESS_TOKEN_KEY)
  removeStorage(API_USER_KEY)
  removeStorage(COMPANY_ID_KEY)
}

export const exchangeFirebaseToken = async (firebaseToken: string) => {
  let response: Response
  try {
    response = await fetch(AUTH_LOGIN_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ firebaseToken }),
    })
  } catch (error) {
    console.error('API /auth/login network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const text = await response.text()
    console.error('API /auth/login error:', response.status, text)
    let message = text
    try {
      const data = JSON.parse(text) as { message?: string; error?: string }
      message = data.message || data.error || text
    } catch {}
    throw new Error(message || 'Failed to exchange Firebase token')
  }

  const data = (await response.json()) as AuthLoginResponse
  const accessToken = data.access_token || data.accessToken
  if (!accessToken) {
    throw new Error('Missing access token in response')
  }

  const user = data.user as ApiUser
  if (!user?.id) {
    throw new Error('Missing user in response')
  }

  const company = data.company as ApiCompany | undefined
  const companyId = company?.id || user.companyId
  if (!companyId) {
    throw new Error('Missing company id in response')
  }

  persistApiSession(accessToken, user)
  persistCompanyId(companyId)

  return { accessToken, user, company, companyId, authResponse: data }
}

export const createCompanyApi = async (
  payload: { name: string; industry: string; size: string; ownerId?: string },
  accessToken: string
): Promise<Company> => {
  const response = await fetch(COMPANIES_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to create company')
  }

  return response.json()
}

export const updateCompanyApi = async (
  companyId: string,
  payload: Partial<Pick<Company, 'name' | 'industry' | 'size' | 'currency' | 'timezone' | 'workingHours'>>,
  accessToken: string
): Promise<Company> => {
  let response: Response
  try {
    response = await fetch(`${COMPANIES_PATH}/${encodeURIComponent(companyId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('API /companies PUT network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to update company')
  }

  const data = await response.json().catch(() => null)
  return (data?.data || data?.company || data) as Company
}

export const fetchCompanyApi = async (companyId: string, accessToken: string): Promise<Company> => {
  let response: Response
  try {
    response = await fetch(`${COMPANIES_PATH}/${encodeURIComponent(companyId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    console.error('API /companies GET network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to fetch company')
  }

  const data = await response.json().catch(() => null)
  return (data?.data || data?.company || data) as Company
}

export const createEmployeeApi = async (
  payload: {
    employeeId: string
    companyId: string
    name: string
    email: string
    startDate: string
    employmentType: string
    gender: string
  },
  accessToken: string
): Promise<Employee> => {
  let response: Response
  try {
    response = await fetch(EMPLOYEES_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('API /employees POST network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to create employee')
  }

  const data = await response.json().catch(() => null)
  return (data?.data || data?.employee || data) as Employee
}

export const fetchEmployeesApi = async (accessToken: string): Promise<Employee[]> => {
  let response: Response
  try {
    response = await fetch(EMPLOYEES_PATH, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    console.error('API /employees GET network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to fetch employees')
  }

  const data = await response.json().catch(() => null)
  const list = data?.data || data?.employees || data
  return Array.isArray(list) ? (list as Employee[]) : []
}

export const fetchEmployeeApi = async (employeeId: string, accessToken: string): Promise<Employee | null> => {
  let response: Response
  try {
    response = await fetch(`${EMPLOYEES_PATH}/${encodeURIComponent(employeeId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    console.error('API /employees/:id GET network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to fetch employee')
  }

  const data = await response.json().catch(() => null)
  const employee = (data?.data || data?.employee || data) as Employee | null
  return employee && typeof employee === 'object' ? employee : null
}

export const updateEmployeeApi = async (
  employeeId: string,
  payload: {
    companyId: string
    employeeId?: string
    name?: string
    email?: string
    department?: string
    roleId?: string
    startDate?: string
    employmentType?: string
    reportingManager?: string
    gender?: string
    salary?: number
  },
  accessToken: string
): Promise<Employee> => {
  let response: Response
  try {
    response = await fetch(`${EMPLOYEES_PATH}/${encodeURIComponent(employeeId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('API /employees PUT network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to update employee')
  }

  const data = await response.json().catch(() => null)
  const employee = (data?.data || data?.employee || data) as Employee | null
  if (!employee || typeof employee !== 'object') {
    return {
      id: employeeId,
      companyId: payload.companyId,
      employeeId: employeeId,
      name: 'Employee',
      email: '',
      position: '',
      department: '',
      roleId: '',
      startDate: new Date().toISOString().split('T')[0],
      employmentType: 'Full-time',
      reportingManager: 'Unassigned',
      gender: 'Prefer not to say',
      salary: 0,
      createdAt: new Date().toISOString()
    }
  }
  return employee
}

export const deleteEmployeeApi = async (employeeId: string, accessToken: string): Promise<void> => {
  let response: Response
  try {
    response = await fetch(`${EMPLOYEES_PATH}/${encodeURIComponent(employeeId)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    console.error('API /employees DELETE network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to delete employee')
  }
}

export const createDepartmentApi = async (
  payload: { companyId: string; name: string; desc?: string; managerId?: string },
  accessToken: string
): Promise<Department> => {
  const response = await fetch(DEPARTMENTS_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to create department')
  }

  const data = await response.json()
  return (data?.data || data?.department || data) as Department
}

export const fetchDepartmentsApi = async (companyId: string, accessToken: string): Promise<Department[]> => {
  const url = new URL(DEPARTMENTS_PATH)
  url.searchParams.set('companyId', companyId)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to fetch departments')
  }

  const data = await response.json()
  const list = data?.data || data?.departments || data
  return Array.isArray(list) ? (list as Department[]) : []
}

export const deleteDepartmentApi = async (departmentId: string, accessToken: string): Promise<void> => {
  let response: Response
  try {
    response = await fetch(`${DEPARTMENTS_PATH}/${encodeURIComponent(departmentId)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    console.error('API /departments DELETE network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to delete department')
  }
}

export const updateDepartmentApi = async (
  departmentId: string,
  payload: { companyId: string; name?: string; desc?: string },
  accessToken: string
): Promise<Department> => {
  let response: Response
  try {
    response = await fetch(`${DEPARTMENTS_PATH}/${encodeURIComponent(departmentId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('API /departments PUT network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to update department')
  }

  const data = await response.json().catch(() => null)
  const department = (data?.data || data?.department || data) as Department | null
  if (!department || typeof department !== 'object') {
    return {
      id: departmentId,
      companyId: payload.companyId,
      name: payload.name || 'Department',
      description: payload.desc,
      createdAt: new Date().toISOString()
    }
  }
  return department
}

export const createRoleApi = async (
  payload: { title: string; description: string; companyId: string },
  accessToken: string
): Promise<Role> => {
  let response: Response
  try {
    response = await fetch(ROLES_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('API /roles POST network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to create role')
  }

  const data = await response.json().catch(() => null)
  return (data?.data || data?.role || data) as Role
}

export const fetchRolesApi = async (accessToken: string): Promise<Role[]> => {
  let response: Response
  try {
    response = await fetch(ROLES_PATH, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    console.error('API /roles GET network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to fetch roles')
  }

  const data = await response.json().catch(() => null)
  const list = data?.data || data?.roles || data
  return Array.isArray(list) ? (list as Role[]) : []
}

export const fetchRoleApi = async (roleId: string, accessToken: string): Promise<Role | null> => {
  let response: Response
  try {
    response = await fetch(`${ROLES_PATH}/${encodeURIComponent(roleId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    console.error('API /roles/:id GET network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to fetch role')
  }

  const data = await response.json().catch(() => null)
  const role = (data?.data || data?.role || data) as Role | null
  return role && typeof role === 'object' ? role : null
}

export const updateRoleApi = async (
  roleId: string,
  payload: { description?: string; companyId: string; title?: string },
  accessToken: string
): Promise<Role> => {
  let response: Response
  try {
    response = await fetch(`${ROLES_PATH}/${encodeURIComponent(roleId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('API /roles PUT network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to update role')
  }

  const data = await response.json().catch(() => null)
  const role = (data?.data || data?.role || data) as Role | null
  if (!role || typeof role !== 'object') {
    return {
      id: roleId,
      companyId: payload.companyId,
      title: payload.title || 'Role',
      description: payload.description || '',
      createdAt: new Date().toISOString()
    }
  }
  return role
}

export const deleteRoleApi = async (roleId: string, accessToken: string): Promise<void> => {
  let response: Response
  try {
    response = await fetch(`${ROLES_PATH}/${encodeURIComponent(roleId)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    console.error('API /roles DELETE network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to delete role')
  }
}

export const createLeaveTypeApi = async (
  payload: { name: string; unit: string; quota: number; companyId: string; code?: string; employmentType?: string },
  accessToken: string
): Promise<LeaveType> => {
  let response: Response
  try {
    response = await fetch(LEAVE_TYPES_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('API /leave-types POST network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to create leave type')
  }

  const data = await response.json().catch(() => null)
  return (data?.data || data?.leaveType || data) as LeaveType
}

export const fetchLeaveTypesApi = async (accessToken: string): Promise<LeaveType[]> => {
  let response: Response
  try {
    response = await fetch(LEAVE_TYPES_PATH, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    console.error('API /leave-types GET network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to fetch leave types')
  }

  const data = await response.json().catch(() => null)
  const list = data?.data || data?.leaveTypes || data
  return Array.isArray(list) ? (list as LeaveType[]) : []
}

export const fetchLeaveTypeApi = async (leaveTypeId: string, accessToken: string): Promise<LeaveType | null> => {
  let response: Response
  try {
    response = await fetch(`${LEAVE_TYPES_PATH}/${encodeURIComponent(leaveTypeId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    console.error('API /leave-types/:id GET network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to fetch leave type')
  }

  const data = await response.json().catch(() => null)
  const leaveType = (data?.data || data?.leaveType || data) as LeaveType | null
  return leaveType && typeof leaveType === 'object' ? leaveType : null
}

export const updateLeaveTypeApi = async (
  leaveTypeId: string,
  payload: {
    quota?: number
    companyId: string
    name?: string
    unit?: string
    code?: string
    employmentType?: string
  },
  accessToken: string
): Promise<LeaveType> => {
  let response: Response
  try {
    response = await fetch(`${LEAVE_TYPES_PATH}/${encodeURIComponent(leaveTypeId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('API /leave-types PUT network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to update leave type')
  }

  const data = await response.json().catch(() => null)
  const leaveType = (data?.data || data?.leaveType || data) as LeaveType | null
  if (!leaveType || typeof leaveType !== 'object') {
    return {
      id: leaveTypeId,
      companyId: payload.companyId,
      name: payload.name || 'Leave Type',
      code: payload.code || 'LT',
      unit: (payload.unit as LeaveType['unit']) || 'Day',
      quota: payload.quota ?? 0,
      employmentType: (payload.employmentType as LeaveType['employmentType']) || 'Full-time',
      createdAt: new Date().toISOString()
    }
  }
  return leaveType
}

export const deleteLeaveTypeApi = async (leaveTypeId: string, accessToken: string): Promise<void> => {
  let response: Response
  try {
    response = await fetch(`${LEAVE_TYPES_PATH}/${encodeURIComponent(leaveTypeId)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    console.error('API /leave-types DELETE network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to delete leave type')
  }
}

export const createLeaveApi = async (
  payload: {
    employeeId: string
    date: string
    type: string
    unit?: string
    amount?: number
    companyId: string
  },
  accessToken: string
): Promise<LeaveRecord> => {
  let response: Response
  try {
    response = await fetch(LEAVES_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('API /leaves POST network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to create leave')
  }

  const data = await response.json().catch(() => null)
  return (data?.data || data?.leave || data) as LeaveRecord
}

export const fetchLeavesApi = async (accessToken: string): Promise<LeaveRecord[]> => {
  let response: Response
  try {
    response = await fetch(LEAVES_PATH, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    console.error('API /leaves GET network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to fetch leaves')
  }

  const data = await response.json().catch(() => null)
  const list = data?.data || data?.leaves || data
  return Array.isArray(list) ? (list as LeaveRecord[]) : []
}

export const createFeedbackCardApi = async (
  payload: {
    title: string
    subject: string
    questions: { prompt: string; type: string; weight?: number }[]
    companyId: string
  },
  accessToken: string
): Promise<FeedbackCard> => {
  let response: Response
  try {
    response = await fetch(FEEDBACK_CARDS_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('API /feedback-cards POST network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to create feedback card')
  }

  const data = await response.json().catch(() => null)
  return (data?.data || data?.feedbackCard || data) as FeedbackCard
}

export const fetchFeedbackCardsApi = async (accessToken: string): Promise<FeedbackCard[]> => {
  let response: Response
  try {
    response = await fetch(FEEDBACK_CARDS_PATH, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    console.error('API /feedback-cards GET network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to fetch feedback cards')
  }

  const data = await response.json().catch(() => null)
  const list = data?.data || data?.feedbackCards || data
  return Array.isArray(list) ? (list as FeedbackCard[]) : []
}

export const fetchFeedbackCardApi = async (cardId: string, accessToken: string): Promise<FeedbackCard | null> => {
  let response: Response
  try {
    response = await fetch(`${FEEDBACK_CARDS_PATH}/${encodeURIComponent(cardId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    console.error('API /feedback-cards/:id GET network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to fetch feedback card')
  }

  const data = await response.json().catch(() => null)
  const card = (data?.data || data?.feedbackCard || data) as FeedbackCard | null
  return card && typeof card === 'object' ? card : null
}

export const updateFeedbackCardApi = async (
  cardId: string,
  payload: {
    companyId: string
    title?: string
    subject?: string
    questions?: { prompt: string; type: string; weight?: number }[]
  },
  accessToken: string
): Promise<FeedbackCard> => {
  let response: Response
  try {
    response = await fetch(`${FEEDBACK_CARDS_PATH}/${encodeURIComponent(cardId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('API /feedback-cards PUT network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to update feedback card')
  }

  const data = await response.json().catch(() => null)
  const card = (data?.data || data?.feedbackCard || data) as FeedbackCard | null
  if (!card || typeof card !== 'object') {
    return {
      id: cardId,
      companyId: payload.companyId,
      title: payload.title || 'Feedback Card',
      subject: (payload.subject as FeedbackCard['subject']) || 'Team Member',
      questions: [],
      createdAt: new Date().toISOString()
    }
  }
  return card
}

export const deleteFeedbackCardApi = async (cardId: string, accessToken: string): Promise<void> => {
  let response: Response
  try {
    response = await fetch(`${FEEDBACK_CARDS_PATH}/${encodeURIComponent(cardId)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    console.error('API /feedback-cards DELETE network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to delete feedback card')
  }
}

export const createFeedbackEntryApi = async (
  payload: {
    cardId: string
    subjectId?: string
    subjectName?: string
    answers: { questionId: string; answer: string }[]
    companyId: string
  },
  accessToken: string
): Promise<FeedbackEntry> => {
  let response: Response
  try {
    response = await fetch(FEEDBACK_ENTRIES_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('API /feedback-entries POST network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to create feedback entry')
  }

  const data = await response.json().catch(() => null)
  return (data?.data || data?.feedbackEntry || data) as FeedbackEntry
}

export const fetchFeedbackEntriesApi = async (accessToken: string): Promise<FeedbackEntry[]> => {
  let response: Response
  try {
    response = await fetch(FEEDBACK_ENTRIES_PATH, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    console.error('API /feedback-entries GET network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to fetch feedback entries')
  }

  const data = await response.json().catch(() => null)
  const list = data?.data || data?.feedbackEntries || data
  return Array.isArray(list) ? (list as FeedbackEntry[]) : []
}

export const fetchFeedbackEntryApi = async (entryId: string, accessToken: string): Promise<FeedbackEntry | null> => {
  let response: Response
  try {
    response = await fetch(`${FEEDBACK_ENTRIES_PATH}/${encodeURIComponent(entryId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    console.error('API /feedback-entries/:id GET network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to fetch feedback entry')
  }

  const data = await response.json().catch(() => null)
  const entry = (data?.data || data?.feedbackEntry || data) as FeedbackEntry | null
  return entry && typeof entry === 'object' ? entry : null
}

export const updateFeedbackEntryApi = async (
  entryId: string,
  payload: { answers: { questionId: string; answer: string }[]; companyId: string },
  accessToken: string
): Promise<FeedbackEntry> => {
  let response: Response
  try {
    response = await fetch(`${FEEDBACK_ENTRIES_PATH}/${encodeURIComponent(entryId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('API /feedback-entries PUT network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to update feedback entry')
  }

  const data = await response.json().catch(() => null)
  const entry = (data?.data || data?.feedbackEntry || data) as FeedbackEntry | null
  if (!entry || typeof entry !== 'object') {
    return {
      id: entryId,
      companyId: payload.companyId,
      type: 'Team Member',
      cardId: '',
      subjectId: undefined,
      subjectName: undefined,
      authorId: undefined,
      authorName: undefined,
      answers: payload.answers.map((answer) => ({
        questionId: answer.questionId,
        score: 0,
        comment: answer.answer
      })),
      createdAt: new Date().toISOString()
    }
  }
  return entry
}

export const deleteFeedbackEntryApi = async (entryId: string, accessToken: string): Promise<void> => {
  let response: Response
  try {
    response = await fetch(`${FEEDBACK_ENTRIES_PATH}/${encodeURIComponent(entryId)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    console.error('API /feedback-entries DELETE network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to delete feedback entry')
  }
}

export const createHolidayApi = async (
  payload: { date: string; name: string; companyId: string },
  accessToken: string
): Promise<Holiday> => {
  let response: Response
  try {
    response = await fetch(HOLIDAYS_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('API /holidays POST network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to create holiday')
  }

  const data = await response.json().catch(() => null)
  return (data?.data || data?.holiday || data) as Holiday
}

export const fetchHolidaysApi = async (accessToken: string): Promise<Holiday[]> => {
  let response: Response
  try {
    response = await fetch(HOLIDAYS_PATH, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    console.error('API /holidays GET network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to fetch holidays')
  }

  const data = await response.json().catch(() => null)
  const list = data?.data || data?.holidays || data
  return Array.isArray(list) ? (list as Holiday[]) : []
}

export const deleteHolidayApi = async (holidayId: string, accessToken: string): Promise<void> => {
  let response: Response
  try {
    response = await fetch(`${HOLIDAYS_PATH}/${encodeURIComponent(holidayId)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    console.error('API /holidays DELETE network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to delete holiday')
  }
}

export const createJobApi = async (
  payload: { title: string; status: string; employmentType?: string; companyId: string },
  accessToken: string
): Promise<Job> => {
  let response: Response
  try {
    response = await fetch(JOBS_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('API /jobs POST network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to create job')
  }

  const data = await response.json().catch(() => null)
  return (data?.data || data?.job || data) as Job
}

export const fetchJobsApi = async (accessToken: string): Promise<Job[]> => {
  let response: Response
  try {
    response = await fetch(JOBS_PATH, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    console.error('API /jobs GET network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to fetch jobs')
  }

  const data = await response.json().catch(() => null)
  const list = data?.data || data?.jobs || data
  return Array.isArray(list) ? (list as Job[]) : []
}

export const fetchJobApi = async (jobId: string, accessToken: string): Promise<Job | null> => {
  let response: Response
  try {
    response = await fetch(`${JOBS_PATH}/${encodeURIComponent(jobId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    console.error('API /jobs/:id GET network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to fetch job')
  }

  const data = await response.json().catch(() => null)
  const job = (data?.data || data?.job || data) as Job | null
  return job && typeof job === 'object' ? job : null
}

export const updateJobApi = async (
  jobId: string,
  payload: { status?: string; companyId: string; title?: string; employmentType?: string },
  accessToken: string
): Promise<Job> => {
  let response: Response
  try {
    response = await fetch(`${JOBS_PATH}/${encodeURIComponent(jobId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('API /jobs PUT network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to update job')
  }

  const data = await response.json().catch(() => null)
  const job = (data?.data || data?.job || data) as Job | null
  if (!job || typeof job !== 'object') {
    return {
      id: jobId,
      companyId: payload.companyId,
      title: payload.title || 'Job',
      employmentType: payload.employmentType as Job['employmentType'],
      salary: { min: 0, max: 0, currency: 'USD' },
      experience: '',
      status: (payload.status as Job['status']) || 'open',
      createdAt: new Date().toISOString()
    }
  }
  return job
}

export const deleteJobApi = async (jobId: string, accessToken: string): Promise<void> => {
  let response: Response
  try {
    response = await fetch(`${JOBS_PATH}/${encodeURIComponent(jobId)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    console.error('API /jobs DELETE network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to delete job')
  }
}

export const createApplicantApi = async (
  payload: { fullName: string; email: string; status: string; appliedDate: string; companyId: string },
  accessToken: string
): Promise<Applicant> => {
  let response: Response
  try {
    response = await fetch(APPLICANTS_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('API /applicants POST network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to create applicant')
  }

  const data = await response.json().catch(() => null)
  return (data?.data || data?.applicant || data) as Applicant
}

export const fetchApplicantsApi = async (accessToken: string): Promise<Applicant[]> => {
  let response: Response
  try {
    response = await fetch(APPLICANTS_PATH, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    console.error('API /applicants GET network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to fetch applicants')
  }

  const data = await response.json().catch(() => null)
  const list = data?.data || data?.applicants || data
  return Array.isArray(list) ? (list as Applicant[]) : []
}

export const fetchApplicantApi = async (applicantId: string, accessToken: string): Promise<Applicant | null> => {
  let response: Response
  try {
    response = await fetch(`${APPLICANTS_PATH}/${encodeURIComponent(applicantId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    console.error('API /applicants/:id GET network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to fetch applicant')
  }

  const data = await response.json().catch(() => null)
  const applicant = (data?.data || data?.applicant || data) as Applicant | null
  return applicant && typeof applicant === 'object' ? applicant : null
}

export const updateApplicantApi = async (
  applicantId: string,
  payload: { status?: string; companyId: string },
  accessToken: string
): Promise<Applicant> => {
  let response: Response
  try {
    response = await fetch(`${APPLICANTS_PATH}/${encodeURIComponent(applicantId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('API /applicants PUT network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to update applicant')
  }

  const data = await response.json().catch(() => null)
  const applicant = (data?.data || data?.applicant || data) as Applicant | null
  if (!applicant || typeof applicant !== 'object') {
    return {
      id: applicantId,
      companyId: payload.companyId,
      fullName: 'Applicant',
      email: '',
      phone: '',
      positionApplied: '',
      yearsOfExperience: 0,
      currentSalary: 0,
      expectedSalary: 0,
      noticePeriod: '',
      status: (payload.status as Applicant['status']) || 'new',
      appliedDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    }
  }
  return applicant
}

export const deleteApplicantApi = async (applicantId: string, accessToken: string): Promise<void> => {
  let response: Response
  try {
    response = await fetch(`${APPLICANTS_PATH}/${encodeURIComponent(applicantId)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    console.error('API /applicants DELETE network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to delete applicant')
  }
}
