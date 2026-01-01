
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HolidayApiClient } from '../../../../src/infrastructure/external/HolidayApiClient.js'

describe('HolidayApiClient', () => {
    let client
    const originalFetch = global.fetch

    beforeEach(() => {
        client = new HolidayApiClient()
        global.fetch = vi.fn()
    })

    afterEach(() => {
        global.fetch = originalFetch
        vi.clearAllMocks()
    })

    it('should throw if year or countryCode missing', async () => {
        await expect(client.fetchPublicHolidays()).rejects.toThrow('Year and CountryCode are required')
        await expect(client.fetchPublicHolidays(2023)).rejects.toThrow('Year and CountryCode are required')
    })

    it('should fetch holidays successfully', async () => {
        const mockHolidays = [
            { date: '2023-01-01', localName: 'Año Nuevo', name: 'New Year', countryCode: 'ES' },
            { date: '2023-12-25', localName: 'Navidad', name: 'Christmas', countryCode: 'ES' }
        ]

        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => mockHolidays
        })

        const result = await client.fetchPublicHolidays(2023, 'ES')
        
        expect(global.fetch).toHaveBeenCalledWith('https://date.nager.at/api/v3/PublicHolidays/2023/ES')
        expect(result).toHaveLength(2)
        expect(result[0]).toEqual(mockHolidays[0])
    })

    it('should filter by region code if provided', async () => {
         const mockHolidays = [
            { date: '2023-05-02', localName: 'Fiesta Madrid', name: 'Madrid Day', countryCode: 'ES', counties: ['ES-MD'] },
            { date: '2023-09-11', localName: 'Diada', name: 'Catalonia Day', countryCode: 'ES', counties: ['ES-CT'] },
            { date: '2023-01-01', localName: 'Año Nuevo', name: 'New Year', countryCode: 'ES', counties: null } // National
        ]

        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => mockHolidays
        })

        const result = await client.fetchPublicHolidays(2023, 'ES', 'MD')
        
        // Should include Madrid day + National holiday
        expect(result).toHaveLength(2)
        expect(result.find(h => h.localName === 'Fiesta Madrid')).toBeDefined()
        expect(result.find(h => h.localName === 'Año Nuevo')).toBeDefined()
        expect(result.find(h => h.localName === 'Diada')).toBeUndefined()
    })

    it('should throw on API error response', async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            text: async () => 'Not valid country'
        })
        
        await expect(client.fetchPublicHolidays(2023, 'XX')).rejects.toThrow('API Error: 404 Not Found - Not valid country')
    })

    it('should throw on network error', async () => {
        global.fetch.mockRejectedValue(new Error('Network Error'))
        
        await expect(client.fetchPublicHolidays(2023, 'ES')).rejects.toThrow('Failed to fetch public holidays from')
    })
})
