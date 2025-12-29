import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0
    }).format(amount)
}

export function formatDate(dateString: string): string {
    if (!dateString) return ''

    // Parse the date string - handle YYYY-MM-DD format
    const date = new Date(dateString)

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
