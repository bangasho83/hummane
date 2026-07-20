import { describe, expect, it } from 'vitest'
import { formatCurrency, getCurrencySymbol } from './utils'

describe('currency formatting', () => {
    it('uses the configured currency symbol', () => {
        expect(getCurrencySymbol('USD')).toBe('$')
        expect(formatCurrency(1250, 'USD')).toContain('$')
    })

    it('supports non-dollar company currencies', () => {
        expect(getCurrencySymbol('GBP')).toBe('£')
        expect(formatCurrency(1250, 'GBP')).toContain('£')
    })

    it('falls back safely for an invalid currency code', () => {
        expect(getCurrencySymbol('INVALID')).toBe('INVALID')
    })
})
