import type { Company, Department, Role, LeaveType, LeaveRecord, Holiday, Job, Applicant, Employee, EmployeeApi, EmployeeDocument, EmployeePersonalDetails, FeedbackCard, FeedbackEntry } from '@/types'

export type ApiUser = {
  id: string
  email?: string
  name?: string
  companyId?: string
  createdAt?: string
  role?: 'owner' | 'member'
  employeeId?: string
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
const DOCUMENTS_PATH = `${API_BASE_URL}/documents`
const USERS_PATH = `${API_BASE_URL}/users`
const ACCESS_TOKEN_KEY = 'hummaneApiAccessToken'
const API_USER_KEY = 'hummaneApiUser'
const COMPANY_ID_KEY = 'hummaneCompanyId'
const USER_ROLE_COOKIE = 'hummane_user_role'
const HAS_COMPANY_COOKIE = 'hummane_has_company'
const IS_AUTHENTICATED_COOKIE = 'hummane_is_authenticated'

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

const setCookie = (name: string, value: string, days: number = 7) => {
  if (typeof document === 'undefined') return
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
}

const removeCookie = (name: string) => {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
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
  // Mark as authenticated for middleware
  setCookie(IS_AUTHENTICATED_COOKIE, 'true')
  // Also store role in a cookie for middleware access
  if (user.role) {
    setCookie(USER_ROLE_COOKIE, user.role)
  }
}

export const persistCompanyId = (companyId: string) => {
  writeStorage(COMPANY_ID_KEY, companyId)
  // Mark that user has a company for middleware
  setCookie(HAS_COMPANY_COOKIE, 'true')
}

export const persistUserRole = (role: string) => {
  setCookie(USER_ROLE_COOKIE, role)
}

export const persistHasCompany = (hasCompany: boolean) => {
  if (hasCompany) {
    setCookie(HAS_COMPANY_COOKIE, 'true')
  } else {
    removeCookie(HAS_COMPANY_COOKIE)
  }
}

export const clearApiSession = () => {
  removeStorage(ACCESS_TOKEN_KEY)
  removeStorage(API_USER_KEY)
  removeStorage(COMPANY_ID_KEY)
  removeCookie(USER_ROLE_COOKIE)
  removeCookie(HAS_COMPANY_COOKIE)
  removeCookie(IS_AUTHENTICATED_COOKIE)
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
    throw new Error('Network error while contacting /auth/login')
  }

  if (!response.ok) {
    const text = await response.text()
    console.error('API /auth/login error:', response.status, text)
    let message = text
    try {
      const data = JSON.parse(text) as { message?: string; error?: string }
      message = data.message || data.error || text
    } catch {}
    const baseMessage = message || 'Failed to exchange Firebase token'
    throw new Error(`Auth service failed (${response.status}) at /auth/login: ${baseMessage}`)
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
  const companyId = company?.id || user.companyId || null

  persistApiSession(accessToken, user)
  if (companyId) {
    persistCompanyId(companyId)
  }

  return { accessToken, user, company, companyId, authResponse: data }
}

export type MeResponse = {
  id: string
  email: string
  name?: string
  companyId?: string
  role?: 'owner' | 'member'
  employeeId?: string
  createdAt?: string
}

export const fetchMeApi = async (accessToken: string): Promise<MeResponse> => {
  const USERS_ME_PATH = `${API_BASE_URL}/users/me`
  let response: Response
  try {
    response = await fetch(USERS_ME_PATH, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    console.error('API /users/me GET network error:', error)
    throw new Error('Network error while fetching user profile')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to fetch user profile')
  }

  const data = await response.json()
  return data as MeResponse
}

export type ApiKeyResponse = {
  apiKey: string
  createdAt?: string
  expiresAt?: string
}

export const fetchApiKeyApi = async (
  accessToken: string
): Promise<ApiKeyResponse | null> => {
  let response: Response
  try {
    response = await fetch(`${COMPANIES_PATH}/api-key`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    console.error('API /companies/api-key GET network error:', error)
    throw new Error('Network error while fetching API key')
  }

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to fetch API key')
  }

  const data = await response.json().catch(() => null)
  return (data?.data || data) as ApiKeyResponse
}

export const generateApiKeyApi = async (
  accessToken: string
): Promise<ApiKeyResponse> => {
  let response: Response
  try {
    response = await fetch(`${COMPANIES_PATH}/api-key`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    console.error('API /companies/api-key POST network error:', error)
    throw new Error('Network error while generating API key')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to generate API key')
  }

  const data = await response.json().catch(() => null)
  return (data?.data || data) as ApiKeyResponse
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
  payload: Partial<Pick<Company, 'name' | 'industry' | 'size' | 'currency' | 'timezone' | 'workingHours' | 'about'>>,
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
    userId?: string
    departmentId?: string
    reportingManagerId?: string
    roleId?: string
    name: string
    email: string
    startDate: string
    employmentType: string
    employmentMode?: string
    gender: string
    salary?: number
    photoUrl?: string
    dob?: string
    personalDetails?: EmployeePersonalDetails
  },
  accessToken: string
): Promise<Employee> => {
  console.info(
    `Employee create curl:\n` +
      `curl -X POST "${EMPLOYEES_PATH}" \\\n` +
      `  -H "Authorization: Bearer ${accessToken}" \\\n` +
      `  -H "Content-Type: application/json" \\\n` +
      `  -d '${JSON.stringify(payload)}'`
  )
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

export const fetchEmployeeApi = async (employeeId: string, accessToken: string): Promise<EmployeeApi | null> => {
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
  const employee = (data?.data || data?.employee || data) as EmployeeApi | null
  return employee && typeof employee === 'object' ? employee : null
}

export const updateEmployeeApi = async (
  employeeId: string,
  payload: {
    companyId: string
    employeeId?: string
    userId?: string
    departmentId?: string
    reportingManagerId?: string
    name?: string
    email?: string
    department?: string
    roleId?: string
    startDate?: string
    employmentType?: string
    employmentMode?: string
    reportingManager?: string
    gender?: string
    salary?: number
    // New fields
    photoUrl?: string
    dob?: string
    personalDetails?: EmployeePersonalDetails
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
      employmentMode: 'Onsite',
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
  payload: { companyId: string; name: string; description?: string; managerId?: string },
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
  payload: { companyId: string; name?: string; description?: string },
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
      description: payload.description,
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
  payload: { name: string; unit: string; quota: number; companyId: string; code?: string; employmentType?: string; color?: string },
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
    color?: string
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
    startDate: string
    endDate: string
    unit?: string
    amount?: number
    companyId: string
    note?: string
    leaveTypeId?: string
    documents?: { files: string[] }
  },
  accessToken: string
): Promise<LeaveRecord | LeaveRecord[]> => {
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
  return (data?.data || data?.leave || data) as LeaveRecord | LeaveRecord[]
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
  const list = data?.records || data?.data || data?.leaves || data
  return Array.isArray(list) ? (list as LeaveRecord[]) : []
}

export const fetchLeavesApiResponse = async (accessToken: string): Promise<unknown> => {
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

  const text = await response.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!response.ok) {
    const message = typeof data === 'object' && data && 'message' in data ? String((data as { message?: string }).message) : text
    throw new Error(message || 'Failed to fetch leaves')
  }

  return data
}

export const createFeedbackCardApi = async (
  payload: {
    title: string
    subject: string
    questions: { prompt: string; kind: 'score' | 'comment' | 'content'; weight?: number }[]
    companyId: string
  },
  accessToken: string
): Promise<FeedbackCard> => {
  const jsonBody = JSON.stringify(payload)

  // Log curl command for debugging
  const escapedBody = jsonBody.replace(/'/g, "'\\''")
  const curlCommand = `curl -X POST '${FEEDBACK_CARDS_PATH}' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer ${accessToken}' \\
  -d '${escapedBody}'`
  console.log('=== CURL COMMAND FOR CREATE FEEDBACK CARD ===')
  console.log(curlCommand)
  console.log('=== END CURL COMMAND ===')

  let response: Response
  try {
    response = await fetch(FEEDBACK_CARDS_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: jsonBody,
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
    questions?: { prompt: string; kind: 'score' | 'comment' | 'content'; weight?: number }[]
  },
  accessToken: string
): Promise<FeedbackCard> => {
  const jsonBody = JSON.stringify(payload)

  // Log curl command for debugging
  const escapedBody = jsonBody.replace(/'/g, "'\\''")
  const curlCommand = `curl -X PUT '${FEEDBACK_CARDS_PATH}/${encodeURIComponent(cardId)}' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer ${accessToken}' \\
  -d '${escapedBody}'`
  console.log('=== CURL COMMAND FOR UPDATE FEEDBACK CARD ===')
  console.log(curlCommand)
  console.log('=== END CURL COMMAND ===')

  let response: Response
  try {
    response = await fetch(`${FEEDBACK_CARDS_PATH}/${encodeURIComponent(cardId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: jsonBody,
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
    const rawText = await response.text()
    let parsed: { message?: string; action?: string } | null = null
    if (rawText) {
      try {
        parsed = JSON.parse(rawText) as { message?: string; action?: string }
      } catch {
        parsed = null
      }
    }
    if (parsed && (parsed.message || parsed.action)) {
      throw new Error(JSON.stringify({
        message: parsed.message || 'Failed to delete feedback card',
        action: parsed.action,
        status: response.status
      }))
    }
    if (response.status === 409) {
      throw new Error(JSON.stringify({
        message: 'Cannot delete feedback card with existing entries',
        action: 'This card has feedback entries. Delete those entries first, then try again.',
        status: response.status
      }))
    }
    throw new Error(rawText || 'Failed to delete feedback card')
  }
}

export const createFeedbackEntryApi = async (
  payload: {
    cardId: string
    subjectType: string
    subjectId?: string
    subjectName?: string
    authorId?: string
    type?: string
    answers: {
      questionId: string
      answer: string
      question: {
        id: string
        questionId: string
        prompt: string
        kind: 'score' | 'comment' | 'content'
        weight?: number
      }
    }[]
    companyId: string
  },
  accessToken: string
): Promise<FeedbackEntry> => {
  console.info(
    `\n📋 Feedback Entry Create - Copy this curl command:\n\n` +
      `curl -X POST "${FEEDBACK_ENTRIES_PATH}" \\\n` +
      `  -H "Authorization: Bearer ${accessToken}" \\\n` +
      `  -H "Content-Type: application/json" \\\n` +
      `  -d '${JSON.stringify(payload, null, 2)}'\n`
  )
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
  console.info('Feedback Entry Create response:', JSON.stringify(data, null, 2))
  return (data?.data || data?.feedbackEntry || data) as FeedbackEntry
}

export const fetchFeedbackEntriesApi = async (accessToken: string): Promise<FeedbackEntry[]> => {
  console.info(
    `\n📋 Feedback Entries Fetch - Copy this curl command:\n\n` +
      `curl -X GET "${FEEDBACK_ENTRIES_PATH}" \\\n` +
      `  -H "Authorization: Bearer ${accessToken}"\n`
  )
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
  console.info('Feedback Entries Fetch response:', JSON.stringify(data, null, 2))
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
  payload: {
    answers: {
      questionId: string
      answer: string
      question: {
        id: string
        questionId: string
        prompt: string
        kind: 'score' | 'comment' | 'content'
        weight?: number
      }
    }[]
    companyId: string
  },
  accessToken: string
): Promise<FeedbackEntry> => {
  console.info(
    `\n📋 Feedback Entry Update - Copy this curl command:\n\n` +
      `curl -X PUT "${FEEDBACK_ENTRIES_PATH}/${encodeURIComponent(entryId)}" \\\n` +
      `  -H "Authorization: Bearer ${accessToken}" \\\n` +
      `  -H "Content-Type: application/json" \\\n` +
      `  -d '${JSON.stringify(payload, null, 2)}'\n`
  )
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
  console.info('Feedback Entry Update response:', JSON.stringify(data, null, 2))
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
  payload: {
    title: string
    status: string
    employmentType?: string
    employmentMode?: string
    departmentId?: string
    roleId?: string
    city?: string
    country?: string
    salaryFrom?: number
    salaryTo?: number
    experience?: string
    requirement?: string
    companyId: string
  },
  accessToken: string
): Promise<Job> => {
  const bodyJson = JSON.stringify(payload, null, 2)
  console.info(
    `Create Job curl:\n` +
      `curl -X POST "${JOBS_PATH}" \\\n` +
      `  -H "Authorization: Bearer ${accessToken}" \\\n` +
      `  -H "Content-Type: application/json" \\\n` +
      `  -d '${bodyJson}'`
  )
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
  console.info('Create Job response:', JSON.stringify(data, null, 2))
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
  payload: {
    status?: string
    companyId: string
    title?: string
    employmentType?: string
    employmentMode?: string
    departmentId?: string
    roleId?: string
    city?: string
    country?: string
    salaryFrom?: number
    salaryTo?: number
    experience?: string
    requirement?: string
  },
  accessToken: string
): Promise<Job> => {
  const url = `${JOBS_PATH}/${encodeURIComponent(jobId)}`
  const bodyJson = JSON.stringify(payload, null, 2)
  console.info(
    `Update Job curl:\n` +
      `curl -X PUT "${url}" \\\n` +
      `  -H "Authorization: Bearer ${accessToken}" \\\n` +
      `  -H "Content-Type: application/json" \\\n` +
      `  -d '${bodyJson}'`
  )
  let response: Response
  try {
    response = await fetch(url, {
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
  console.info('Update Job response:', JSON.stringify(data, null, 2))
  const job = (data?.data || data?.job || data) as Job | null
  if (!job || typeof job !== 'object') {
    return {
      id: jobId,
      companyId: payload.companyId,
      title: payload.title || 'Job',
      employmentType: payload.employmentType as Job['employmentType'],
      employmentMode: payload.employmentMode as Job['employmentMode'],
      salary: { min: 0, max: 0, currency: 'USD' },
      experience: '',
      requirement: payload.requirement ?? '',
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
  payload: {
    fullName: string
    email: string
    status: string
    appliedDate: string
    companyId: string
    documents?: { files: string[] }
    linkedinUrl?: string
    phone?: string
    positionApplied?: string
    yearsOfExperience?: number
    currentSalary?: number
    expectedSalary?: number
    noticePeriod?: string
    jobId?: string
  },
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

export interface ApplicantsFetchDebugInfo {
  curl: string
  response: unknown
  applicants: Applicant[]
}

export const fetchApplicantsApi = async (accessToken: string, jobId?: string): Promise<Applicant[]> => {
  const result = await fetchApplicantsApiWithDebug(accessToken, jobId)
  return result.applicants
}

export const fetchApplicantsApiWithDebug = async (accessToken: string, jobId?: string): Promise<ApplicantsFetchDebugInfo> => {
  const url = jobId ? `${APPLICANTS_PATH}?jobId=${encodeURIComponent(jobId)}` : APPLICANTS_PATH
  const curl = `curl -X GET "${url}" \\\n  -H "Authorization: Bearer ${accessToken}"`
  let response: Response
  try {
    response = await fetch(url, {
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
  const applicants = Array.isArray(list) ? (list as Applicant[]) : []
  return { curl, response: data, applicants }
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

export const fetchApplicantApiResponse = async (applicantId: string, accessToken: string): Promise<unknown> => {
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

  const text = await response.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!response.ok) {
    const message = typeof data === 'object' && data && 'message' in data ? String((data as { message?: string }).message) : text
    throw new Error(message || 'Failed to fetch applicant')
  }

  return data
}

export const updateApplicantApi = async (
  applicantId: string,
  payload: {
    status?: string
    companyId: string
    assignments?: {
      status: Applicant['status']
      employeeId: string
    }[]
  },
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

export const createDocumentApi = async (
  payload: {
    employeeId: string
    name: string
    type: string
    dataUrl: string
    companyId: string
  },
  accessToken: string
): Promise<EmployeeDocument> => {
  let response: Response
  try {
    response = await fetch(DOCUMENTS_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('API /documents POST network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to create document')
  }

  const data = await response.json().catch(() => null)
  return (data?.data || data?.document || data) as EmployeeDocument
}

export const fetchDocumentsApi = async (accessToken: string, employeeId?: string): Promise<EmployeeDocument[]> => {
  let response: Response
  const url = employeeId ? `${DOCUMENTS_PATH}?employeeId=${encodeURIComponent(employeeId)}` : DOCUMENTS_PATH
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    console.error('API /documents GET network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to fetch documents')
  }

  const data = await response.json().catch(() => null)
  const list = data?.data || data?.documents || data
  return Array.isArray(list) ? (list as EmployeeDocument[]) : []
}

export const deleteDocumentApi = async (documentId: string, accessToken: string): Promise<void> => {
  let response: Response
  try {
    response = await fetch(`${DOCUMENTS_PATH}/${encodeURIComponent(documentId)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    console.error('API /documents DELETE network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to delete document')
  }
}

export type ApiUserItem = {
  id: string
  email: string
  name?: string
  role?: string
  createdAt?: string
  updatedAt?: string
}

export const fetchUsersApi = async (accessToken: string): Promise<ApiUserItem[]> => {
  let response: Response
  try {
    response = await fetch(USERS_PATH, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    console.error('API /users GET network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to fetch users')
  }

  const data = await response.json().catch(() => null)
  const list = data?.data || data?.users || data
  return Array.isArray(list) ? (list as ApiUserItem[]) : []
}

export const inviteUserApi = async (
  payload: { companyId: string; email: string; role: 'owner' | 'member'; employeeId?: string },
  accessToken: string
): Promise<void> => {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/invitations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('API /invitations POST network error:', error)
    throw new Error('Network error while contacting the API')
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to invite user')
  }
}
