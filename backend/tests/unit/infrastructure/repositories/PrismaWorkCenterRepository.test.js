
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PrismaWorkCenterRepository } from '../../../../src/infrastructure/repositories/PrismaWorkCenterRepository.js'
import { prisma } from '../../../../src/infrastructure/database/client.js'

vi.mock('../../../../src/infrastructure/database/client.js', () => ({
  prisma: {
    workCenter: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    publicHolidayCalendar: { findMany: vi.fn(), upsert: vi.fn() }
  }
}))

describe('PrismaWorkCenterRepository', () => {
  let repository

  beforeEach(() => {
    vi.clearAllMocks()
    repository = new PrismaWorkCenterRepository()
  })

  it('findAll', async () => {
      await repository.findAll()
      expect(prisma.workCenter.findMany).toHaveBeenCalled()
  })

  it('findById', async () => {
      await repository.findById('wc-1')
      expect(prisma.workCenter.findUnique).toHaveBeenCalled()
  })

  it('create', async () => {
      await repository.create({ name: 'WC' })
      expect(prisma.workCenter.create).toHaveBeenCalled()
  })

  it('update', async () => {
      await repository.update('wc-1', { name: 'WC2' })
      expect(prisma.workCenter.update).toHaveBeenCalled()
  })

  it('delete', async () => {
      await repository.delete('wc-1')
      expect(prisma.workCenter.delete).toHaveBeenCalled()
  })

  it('findPublicHolidayCalendars', async () => {
      await repository.findPublicHolidayCalendars('wc-1')
      expect(prisma.publicHolidayCalendar.findMany).toHaveBeenCalledWith({ where: { workCenterId: 'wc-1' } })
  })

  it('savePublicHolidayCalendar', async () => {
      const data = { workCenterId: 'wc-1', year: 2023, holidays: [] }
      await repository.savePublicHolidayCalendar(data)
      expect(prisma.publicHolidayCalendar.upsert).toHaveBeenCalledWith(expect.objectContaining({
          where: { workCenterId_year: { workCenterId: 'wc-1', year: 2023 } },
          create: expect.objectContaining({ holidays: '[]' }),
          update: { holidays: '[]' }
      }))
  })
})
