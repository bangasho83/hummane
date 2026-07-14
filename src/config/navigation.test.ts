import { describe, expect, it } from 'vitest'
import { navigationSections } from './navigation'

describe('admin navigation', () => {
    it('places Resources immediately after Team', () => {
        const teamItems = navigationSections.find((section) => section.label === 'Team')?.items
        const teamIndex = teamItems?.findIndex((item) => item.name === 'Team') ?? -1

        expect(teamIndex).toBeGreaterThanOrEqual(0)
        expect(teamItems?.[teamIndex + 1]).toMatchObject({
            name: 'Resources',
            href: '/resources',
        })
    })
})