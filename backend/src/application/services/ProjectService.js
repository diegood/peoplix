import { PrismaProjectRepository } from '../../infrastructure/repositories/PrismaProjectRepository.js'
import { PrismaCollaboratorRepository } from '../../infrastructure/repositories/PrismaCollaboratorRepository.js'
import { PrismaAllocationRepository } from '../../infrastructure/repositories/PrismaAllocationRepository.js'

import { CollaboratorHierarchyService } from './CollaboratorHierarchyService.js'

export class ProjectService {
    constructor(repository, collaboratorRepository, allocationRepository, hierarchyService) {
        this.repository = repository || new PrismaProjectRepository()
        this.collaboratorRepository = collaboratorRepository || new PrismaCollaboratorRepository()
        this.allocationRepository = allocationRepository || new PrismaAllocationRepository()
        this.hierarchyService = hierarchyService || new CollaboratorHierarchyService()
    }
    
    async getAll(orgId, args) {
        return this.repository.findAll(orgId, args)
    }
    
    async getById(id) {
        return this.repository.findById(id)
    }
    
    async create(data) {
        const project = await this.repository.create(data)
        
        try {
            const adminCollaborators = await this.collaboratorRepository.findByRoleProperty(data.organizationId, { isAdministrative: true })
            const allocationMap = new Map() // collaboratorId -> allocationId

            for (const collaborator of adminCollaborators) {
                const adminRoles = collaborator.roles
                    .filter(cr => cr.role.isAdministrative)
                    .map(cr => cr.role)

                if (adminRoles.length > 0) {
                     const allocation = await this.allocationRepository.create({
                        projectId: project.id,
                        collaboratorId: collaborator.id,
                        dedicationPercentage: 0,
                        startWeek: new Date().toISOString().substring(0, 10),
                        roleId: adminRoles[0].id
                     })
                     
                     allocationMap.set(collaborator.id, allocation.id)

                     if (adminRoles.length > 1) {
                        for (let i = 1; i < adminRoles.length; i++) {
                            await this.allocationRepository.addRole(allocation.id, adminRoles[i].id)
                        }
                     }
                }
            }

            const orgHierarchy = await this.hierarchyService.getHierarchy(data.organizationId)
            for (const relation of orgHierarchy) {
                const supervisorAllocId = allocationMap.get(relation.supervisorId)
                const subordinateAllocId = allocationMap.get(relation.subordinateId)

                if (supervisorAllocId && subordinateAllocId) {
                    try {
                        await this.allocationRepository.addHierarchy(subordinateAllocId, supervisorAllocId, relation.hierarchyTypeId)
                    } catch (e) {
                        console.warn(`Failed to copy hierarchy for project ${project.id}:`, e)
                    }
                }
            }

        } catch (error) {
            console.error("Error creating administrative allocations:", error)
        }

        return project
    }
    
    async update(id, data) {
        return this.repository.update(id, data)
    }
    
    async delete(id) {
        return this.repository.delete(id)
    }
    
    async addRequirement(data) {
        return this.repository.addRequirement(data)
    }

    async updateRequirement(id, data) {
        return this.repository.updateRequirement(id, data)
    }

    async removeRequirement(id) {
        return this.repository.removeRequirement(id)
    }

    async addRequirementSkill(requirementId, skillName, level, orgId) {
        return this.repository.addRequirementSkill(requirementId, skillName, level, orgId)
    }

    async removeRequirementSkill(requirementId, skillId) {
        return this.repository.removeRequirementSkill(requirementId, skillId)
    }

    async createMilestone(data) {
        return this.repository.createMilestone(data)
    }

    async deleteMilestone(id) {
        return this.repository.deleteMilestone(id)
    }
}
