import { prisma } from '../database/prisma.js';
import { Collaborator } from '../../domain/entities/Collaborator.js';
import { Allocation } from '../../domain/entities/Allocation.js';

export class PrismaCollaboratorRepository {
    async findAll() {
        const collaborators = await prisma.collaborator.findMany({
            include: {
                skills: { include: { skill: true } },
                allocations: true,
                 roles: { include: { role: true } }
            }
        });
        
        return collaborators.map(c => {
             const flatSkills = c.skills.map(cs => ({ ...cs.skill, level: cs.level }));
             const flatRoles = c.roles.map(cr => cr.role);
             
             const mappedAllocations = c.allocations ? c.allocations.map(a => new Allocation(a)) : [];
             
             return new Collaborator({ ...c, skills: flatSkills, roles: flatRoles, allocations: mappedAllocations });
        });
    }
    
    async create({ name, contractedHours }) {
        const c = await prisma.collaborator.create({
            data: { name, contractedHours }
        });
        return new Collaborator(c);
    }
    
    async addSkill(collaboratorId, skillName, level) {
        let skill = await prisma.skill.findUnique({ where: { name: skillName } })
        if (!skill) {
            skill = await prisma.skill.create({ data: { name: skillName } })
        }
        
        await prisma.collaboratorSkill.upsert({
            where: { collaboratorId_skillId: { collaboratorId, skillId: skill.id } },
            update: { level },
            create: { collaboratorId, skillId: skill.id, level }
        })
        
        return { ...skill, level };
    }
    
     async removeSkill(collaboratorId, skillId) {
         await prisma.collaboratorSkill.delete({
             where: { collaboratorId_skillId: { collaboratorId, skillId } }
         })
         return true;
     }

}
