import { PrismaCollaboratorRepository } from '../../infrastructure/repositories/PrismaCollaboratorRepository.js'

export class CollaboratorService {
    constructor() {
        this.repository = new PrismaCollaboratorRepository()
    }
    
    async getAll() {
        return this.repository.findAll()
    }
    
    async getById(id) {
        return this.repository.findById(id)
    }
    
    async create(data) {
        if (data.joinDate) {
             data.joinDate = new Date(data.joinDate).toISOString()
        }
        return this.repository.create(data)
    }
    
    async update(id, data) {
        if (data.joinDate) {
             data.joinDate = new Date(data.joinDate).toISOString()
        }
        return this.repository.update(id, data)
    }
    
    async delete(id) {
        return this.repository.delete(id)
    }
    
    async addSkill(collaboratorId, skillId, level) {
         return this.repository.addSkill(collaboratorId, skillId, level)
    }
    
    async removeSkill(collaboratorId, skillId) {
        return this.repository.removeSkill(collaboratorId, skillId)
    }

    async addHardware(data) {
        return this.repository.addHardware(data)
    }

    async removeHardware(id) {
        return this.repository.removeHardware(id)
    }

    async updateHolidayCalendar(data) {
        return this.repository.updateHolidayCalendar(data)
    }

    async addCareerObjective(collaboratorId, year, quarter, description, skillId, targetLevel) {
        return this.repository.addCareerObjective({
            collaboratorId,
            year,
            quarter,
            description,
            status: 'PENDING',
            skillId,
            targetLevel
        })
    }

    async updateCareerObjective(id, status) {
        return this.repository.updateCareerObjective(id, { status })
    }

    async deleteCareerObjective(id) {
        return this.repository.deleteCareerObjective(id)
    }

    async addMeeting(collaboratorId, date, notes) {
        return this.repository.addMeeting({
            collaboratorId,
            date: new Date(date),
            notes
        })
    }

    async updateMeeting(id, data) {
        if (data.date) {
            data.date = new Date(data.date)
        }
        return this.repository.updateMeeting(id, data)
    }

    async deleteMeeting(id) {
        return this.repository.deleteMeeting(id)
    }

    async addMeetingActionItem(meetingId, description) {
        return this.repository.addActionItem({
            meetingId,
            description,
            status: 'PENDING'
        })
    }

    async updateMeetingActionItem(id, data) {
        return this.repository.updateActionItem(id, data)
    }

    async deleteMeetingActionItem(id) {
        return this.repository.deleteActionItem(id)
    }
}
