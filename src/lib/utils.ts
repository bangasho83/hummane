import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency?: string): string {
    if (!currency) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount)
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0
    }).format(amount)
}

/**
 * Parse a date string (YYYY-MM-DD or ISO format) as a local date.
 * This avoids timezone issues where "2024-08-14" parsed as UTC midnight
 * shows as Aug 13 in timezones ahead of UTC.
 */
export function parseLocalDate(dateString: string): Date {
    if (!dateString) return new Date(NaN)

    // Extract just the date part (YYYY-MM-DD)
    const datePart = dateString.split('T')[0]
    const [year, month, day] = datePart.split('-').map(Number)

    // Create date using local timezone (month is 0-indexed)
    return new Date(year, month - 1, day)
}

/**
 * Get today's date as YYYY-MM-DD string in local timezone
 */
export function getLocalTodayKey(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export function formatDate(dateString: string): string {
    if (!dateString) return ''

    // Parse as local date to avoid timezone issues
    const date = parseLocalDate(dateString)

    // Check if date is valid
    if (isNaN(date.getTime())) {
        return dateString // Return original if invalid
    }

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}
