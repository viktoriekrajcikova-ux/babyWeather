import { describe, it, expect } from 'vitest'
import { determinator } from './clothesDeterminer'

describe('getSuitableClothes', () => {
    it('vrátí pole oblečení', () => {
        const result = determinator.getSuitableClothes(25, 5, 'female')

        expect(Array.isArray(result)).toBe(true)
    })

    it('pro teplo vybere letní oblečení pro holčičku', () => {
        const result = determinator.getSuitableClothes(25, 5, 'female')
        const names = result.map(item => item.name)

        expect(names).toEqual(['shirt', 'skirt', 'hat', 'sandals'])
    })

    it('zahrne tričko přesně na spodní hranici 20 °C', () => {
        const result = determinator.getSuitableClothes(20, 5, 'female')
        const names = result.map(item => item.name)

        expect(names).toContain('shirt')
    })

    it('vyřadí tričko těsně pod hranicí (19 °C)', () => {
        const result = determinator.getSuitableClothes(19, 5, 'female')
        const names = result.map(item => item.name)

        expect(names).not.toContain('shirt')
    })

    it('v 1 roce dítě ještě dostane baby clothes', () => {
        const result = determinator.getSuitableClothes(25, 1, null)
        const names = result.map(item => item.name)

        expect(names).toContain('baby clothes')
    })

    it('od 2 let už baby clothes nedostane', () => {
        const result = determinator.getSuitableClothes(25, 2, null)
        const names = result.map(item => item.name)

        expect(names).not.toContain('baby clothes')
    })

    it('kluk dostane kraťasy, ne sukni', () => {
        const result = determinator.getSuitableClothes(25, 5, 'male')
        const names = result.map(item => item.name)

        expect(names).toContain('shorts')
        expect(names).not.toContain('skirt')
    })

    it('holka dostane sukni, ne kraťasy', () => {
        const result = determinator.getSuitableClothes(25, 5, 'female')
        const names = result.map(item => item.name)

        expect(names).toContain('skirt')
        expect(names).not.toContain('shorts')
    })
})
