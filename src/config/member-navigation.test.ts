import { describe, expect, it } from 'vitest'
import { memberNavigationItems } from './member-navigation'


describe('member navigation', () => {
    it('labels the resource request area as Resources', () => {
        expect(memberNavigationItems).toContainEqual(expect.objectContaining({
            name: 'Resources',
            href: '/member/resource-request',
        }))
        expect(memberNavigationItems.some((item) => item.name === 'Resource Request')).toBe(false)
    })
})
