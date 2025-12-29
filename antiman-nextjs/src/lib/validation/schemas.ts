import { z } from 'zod'

/**
 * Validation schemas for all data models in the application
 * Using Zod for runtime type validation and sanitization
 */

// User validation schemas
export const signupSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be less than 100 characters')
        .trim(),
    email: z.string()
        .email('Invalid email address')
        .toLowerCase()
        .trim(),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password must be less than 100 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
})

export const loginSchema = z.object({
    email: z.string()
        .email('Invalid email address')
        .toLowerCase()
        .trim(),
    password: z.string()
        .min(1, 'Password is required')
})

// Company validation schemas
export const companySchema = z.object({
    name: z.string()
        .min(2, 'Company name must be at least 2 characters')
        .max(200, 'Company name must be less than 200 characters')
        .trim(),
    industry: z.string()
        .min(2, 'Industry must be at least 2 characters')
        .max(100, 'Industry must be less than 100 characters')
        .trim(),
    size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+'], {
        message: 'Please select a valid company size'
    })
})

// Employee validation schemas
export const employeeSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be less than 100 characters')
        .trim(),
    email: z.string()
        .email('Invalid email address')
        .toLowerCase()
        .trim(),
    position: z.string()
        .min(2, 'Position must be at least 2 characters')
        .max(100, 'Position must be less than 100 characters')
        .trim(),
    department: z.string()
        .min(1, 'Department is required')
        .trim(),
    startDate: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
        .refine((date) => {
            const d = new Date(date)
            return d instanceof Date && !isNaN(d.getTime())
        }, 'Invalid date'),
    salary: z.number()
        .positive('Salary must be a positive number')
        .max(10000000, 'Salary seems unreasonably high')
        .finite('Salary must be a valid number')
})

// Department validation schemas
export const departmentSchema = z.object({
    name: z.string()
        .min(2, 'Department name must be at least 2 characters')
        .max(100, 'Department name must be less than 100 characters')
        .trim(),
    description: z.string()
        .max(500, 'Description must be less than 500 characters')
        .trim()
        .optional()
})

// Leave record validation schemas
export const leaveRecordSchema = z.object({
    employeeId: z.string()
        .min(1, 'Employee ID is required'),
    date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
        .refine((date) => {
            const d = new Date(date)
            return d instanceof Date && !isNaN(d.getTime())
        }, 'Invalid date'),
    type: z.enum(['Sick', 'Vacation', 'Personal', 'Other'], {
        message: 'Please select a valid leave type'
    })
})

// Type exports for TypeScript
export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CompanyInput = z.infer<typeof companySchema>
export type EmployeeInput = z.infer<typeof employeeSchema>
export type DepartmentInput = z.infer<typeof departmentSchema>
export type LeaveRecordInput = z.infer<typeof leaveRecordSchema>

/**
 * Helper function to validate data and return formatted errors
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: boolean
    data?: T
    errors?: Record<string, string>
} {
    const result = schema.safeParse(data)

    if (result.success) {
        return { success: true, data: result.data }
    }

    const errors: Record<string, string> = {}
    result.error.issues.forEach((err) => {
        const path = err.path.join('.')
        errors[path] = err.message
    })

    return { success: false, errors }
}

