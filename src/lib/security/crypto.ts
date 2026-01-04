import bcrypt from 'bcryptjs'

/**
 * Security utilities for password hashing and verification
 * Using bcryptjs for secure password hashing
 */

const SALT_ROUNDS = 10

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
    try {
        const salt = await bcrypt.genSalt(SALT_ROUNDS)
        const hashedPassword = await bcrypt.hash(password, salt)
        return hashedPassword
    } catch (error) {
        console.error('Error hashing password:', error)
        throw new Error('Failed to hash password')
    }
}

/**
 * Verify a password against a hash
 * @param password - Plain text password
 * @param hash - Hashed password to compare against
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
        const isMatch = await bcrypt.compare(password, hash)
        return isMatch
    } catch (error) {
        console.error('Error verifying password:', error)
        return false
    }
}

/**
 * Sanitize string input to prevent XSS attacks
 * @param input - User input string
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
    if (typeof input !== 'string') return ''
    
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .slice(0, 10000) // Limit length to prevent DoS
}

/**
 * Sanitize rich text HTML input while preserving formatting tags.
 * Removes scripts, iframes, event handlers, and javascript: URLs.
 */
export function sanitizeRichText(input: string): string {
    if (typeof input !== 'string') return ''

    return input
        .trim()
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
        .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
        .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '')
        .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
        .replace(/javascript:/gi, '')
        .slice(0, 50000)
}

/**
 * Sanitize email input
 * @param email - Email address
 * @returns Sanitized and normalized email
 */
export function sanitizeEmail(email: string): string {
    if (typeof email !== 'string') return ''
    
    return email
        .trim()
        .toLowerCase()
        .slice(0, 254) // Max email length per RFC
}

/**
 * Generate a secure random token
 * @param length - Length of the token
 * @returns Random token string
 */
export function generateToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let token = ''
    
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length)
        token += chars[randomIndex]
    }
    
    return token
}

/**
 * Validate that a string is safe (no script injection attempts)
 * @param input - String to validate
 * @returns True if safe, false otherwise
 */
export function isSafeString(input: string): boolean {
    if (typeof input !== 'string') return false
    
    // Check for common XSS patterns
    const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i, // Event handlers like onclick=
        /<iframe/i,
        /eval\(/i,
    ]
    
    return !dangerousPatterns.some(pattern => pattern.test(input))
}
