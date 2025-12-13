import { PrismaCollaboratorRepository } from '../../infrastructure/repositories/PrismaCollaboratorRepository.js';

export class CollaboratorService {
    constructor() {
        this.repository = new PrismaCollaboratorRepository();
    }
    
    getAll() {
        return this.repository.findAll();
    }
    
    create(data) {
        return this.repository.create(data);
    }
    
    addSkill(collaboratorId, skillName, level) {
        return this.repository.addSkill(collaboratorId, skillName, level);
    }
    
    removeSkill(collaboratorId, skillId) {
        return this.repository.removeSkill(collaboratorId, skillId);
    }
}
