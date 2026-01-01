
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PrismaCollaboratorRepository } from '../../../../src/infrastructure/repositories/PrismaCollaboratorRepository.js'
import { prisma } from '../../../../src/infrastructure/database/client.js'

vi.mock('../../../../src/infrastructure/database/client.js', () => ({
  prisma: {
    collaborator: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    collaboratorSkill: { upsert: vi.fn(), delete: vi.fn() },
    collaboratorSkillHistory: { create: vi.fn() },
    hardware: { create: vi.fn(), delete: vi.fn() },
    holidayCalendar: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
    collaboratorCareerObjective: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    collaboratorMeeting: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    meetingActionItem: { create: vi.fn(), update: vi.fn(), delete: vi.fn() }
  }
}))

describe('PrismaCollaboratorRepository', () => {
  let repository

  beforeEach(() => {
    vi.clearAllMocks()
    repository = new PrismaCollaboratorRepository()
  })

  describe('Core', () => {
      it('findAll', async () => {
          await repository.findAll('org-1')
          expect(prisma.collaborator.findMany).toHaveBeenCalledWith({
              where: { organizationId: 'org-1' },
              include: expect.anything()
          })
      })
      
      it('findAll requires org context', async () => {
          await expect(repository.findAll()).rejects.toThrow('Organization Context Required')
      })

      it('findById', async () => {
          await repository.findById('c-1')
          expect(prisma.collaborator.findUnique).toHaveBeenCalledWith({
              where: { id: 'c-1' },
              include: expect.anything()
          })
      })
      
      it('create', async () => {
          const data = { name: 'John' }
          await repository.create(data)
          expect(prisma.collaborator.create).toHaveBeenCalledWith({
              data,
              include: expect.anything()
          })
      })

      it('update', async () => {
          const data = { name: 'John Doe' }
          await repository.update('c-1', data)
          expect(prisma.collaborator.update).toHaveBeenCalledWith({
              where: { id: 'c-1' },
              data,
              include: expect.anything()
          })
      })

      it('delete', async () => {
          await repository.delete('c-1')
          expect(prisma.collaborator.delete).toHaveBeenCalledWith({ where: { id: 'c-1' } })
      })
  })

  describe('Skills', () => {
      it('addSkill', async () => {
          prisma.collaborator.findUnique.mockResolvedValue({ id: 'c-1' })
          await repository.addSkill('c-1', 's-1', 5)
          
          expect(prisma.collaboratorSkill.upsert).toHaveBeenCalledWith({
              where: { collaboratorId_skillId: { collaboratorId: 'c-1', skillId: 's-1' } },
              update: { level: 5 },
              create: { collaboratorId: 'c-1', skillId: 's-1', level: 5 }
          })
          expect(prisma.collaboratorSkillHistory.create).toHaveBeenCalledWith({
              data: { collaboratorId: 'c-1', skillId: 's-1', level: 5 }
          })
          expect(prisma.collaborator.findUnique).toHaveBeenCalled()
      })

      it('removeSkill', async () => {
          await repository.removeSkill('c-1', 's-1')
           expect(prisma.collaboratorSkill.delete).toHaveBeenCalledWith({
              where: { collaboratorId_skillId: { collaboratorId: 'c-1', skillId: 's-1' } }
          })
      })
  })

  describe('Hardware', () => {
      it('addHardware', async () => {
          await repository.addHardware({ name: 'Laptop' })
          expect(prisma.hardware.create).toHaveBeenCalled()
      })
  })

  describe('HolidayCalendar', () => {
      it('updateHolidayCalendar update existing', async () => {
          prisma.holidayCalendar.findUnique.mockResolvedValue({ id: 'h-1' })
          await repository.updateHolidayCalendar({ collaboratorId: 'c-1', year: 2023, holidays: [] })
          expect(prisma.holidayCalendar.update).toHaveBeenCalled()
      })

      it('updateHolidayCalendar create new', async () => {
          prisma.holidayCalendar.findUnique.mockResolvedValue(null)
          await repository.updateHolidayCalendar({ collaboratorId: 'c-1', year: 2023, holidays: [] })
          expect(prisma.holidayCalendar.create).toHaveBeenCalled()
      })
  })

  describe('CareerObjective', () => {
      it('CRUD', async () => {
          await repository.addCareerObjective({ title: 'Goal' })
          expect(prisma.collaboratorCareerObjective.create).toHaveBeenCalled()

          await repository.updateCareerObjective('co-1', { title: 'New' })
          expect(prisma.collaboratorCareerObjective.update).toHaveBeenCalled()

          await repository.deleteCareerObjective('co-1')
          expect(prisma.collaboratorCareerObjective.delete).toHaveBeenCalled()
      })
  })

  describe('Meetings & Action Items', () => {
      it('Meeting CRUD', async () => {
          await repository.addMeeting({ title: 'Mtg' })
          expect(prisma.collaboratorMeeting.create).toHaveBeenCalled()
          
          await repository.updateMeeting('m-1', { title: 'Mtg2' })
          expect(prisma.collaboratorMeeting.update).toHaveBeenCalled()
          
          await repository.deleteMeeting('m-1')
          expect(prisma.collaboratorMeeting.delete).toHaveBeenCalled()
      })

      it('Action Item CRUD', async () => {
          await repository.addActionItem({ description: 'Do it' })
          expect(prisma.meetingActionItem.create).toHaveBeenCalled()
          
          await repository.updateActionItem('ai-1', { description: 'Done' })
          expect(prisma.meetingActionItem.update).toHaveBeenCalled()
          
          await repository.deleteActionItem('ai-1')
          expect(prisma.meetingActionItem.delete).toHaveBeenCalled()
      })
  })
})
