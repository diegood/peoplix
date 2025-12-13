import { PrismaProjectRepository } from '../../infrastructure/repositories/PrismaProjectRepository.js';

export class ProjectService {
    constructor() {
        this.repository = new PrismaProjectRepository();
    }
    
    getAll() {
        return this.repository.findAll();
    }
    
    getById(id) {
        return this.repository.findById(id);
    }
    
    create(data) {
        return this.repository.create(data);
    }
    
    update(data) {
        return this.repository.update(data);
    }
}
