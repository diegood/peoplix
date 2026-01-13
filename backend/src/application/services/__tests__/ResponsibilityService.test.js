import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ResponsibilityService } from '../ResponsibilityService.js'

describe('ResponsibilityService', () => {
    let service
    let mockRepository

    beforeEach(() => {
        mockRepository = {
            create: vi.fn(),
            delete: vi.fn(),
            findByProject: vi.fn()
        }
        service = new ResponsibilityService(mockRepository)
    })

    describe('create', () => {
        it('should call repository.create with correct data', async () => {
            const data = { role: 'RESPONSIBLE', projectId: 'p1' }
            await service.create(data)
            expect(mockRepository.create).toHaveBeenCalledWith(data)
        })
    })

    describe('delete', () => {
        it('should call repository.delete with correct id', async () => {
            await service.delete('r1')
            expect(mockRepository.delete).toHaveBeenCalledWith('r1')
        })
    })

    describe('getByProject', () => {
        it('should call repository.findByProject with correct projectId', async () => {
            await service.getByProject('p1')
            expect(mockRepository.findByProject).toHaveBeenCalledWith('p1')
        })
    })
})
