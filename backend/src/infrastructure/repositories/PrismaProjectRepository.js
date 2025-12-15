import { prisma } from '../database/client.js'

export class PrismaProjectRepository {
    async findAll(args = {}) {
        return prisma.project.findMany({
            include: {
                allocations: {
                    include: {
                        collaborator: { include: { skills: { include: { skill: true } } } },
                        roles: { include: { role: true } }
                    }
                },
                milestones: { include: { milestoneType: true } },
                sprints: true,
                requiredRoles: {
                    include: {
                        role: true,
                        skills: { include: { skill: true } }
                    }
                }
            },
            ...args
        })
    }

    async findById(id) {
        return prisma.project.findUnique({
            where: { id },
            include: {
                allocations: {
                    include: {
                        roles: { include: { role: true } }
                    }
                },
                milestones: { include: { milestoneType: true } },
                requiredRoles: { include: { role: true, skills: { include: { skill: true } } } }
            }
        })
    }

    async create({ name, contractedHours }) {
        return prisma.project.create({
            data: { name, contractedHours }
        })
    }

    async update(id, data) {
        return prisma.project.update({
            where: { id },
            data
        })
    }

    async delete(id) {
        await prisma.project.delete({ where: { id } })
        return true
    }

    // Requirements
    async addRequirement({ projectId, roleId, resourceCount, monthlyHours }) {
        return prisma.projectRequirement.create({
            data: { projectId, roleId, resourceCount, monthlyHours },
            include: { role: true, skills: { include: { skill: true } } }
        })
    }

    async removeRequirement(id) {
        await prisma.projectRequirement.delete({ where: { id } })
        return true
    }

    async addRequirementSkill(requirementId, skillName, level) {
         // Upsert logic from original resolver
        let skill = await prisma.skill.findUnique({ where: { name: skillName } })
        if (!skill) {
            skill = await prisma.skill.create({ data: { name: skillName } })
        }
        
        const existing = await prisma.requirementSkill.findFirst({
            where: { requirementId, skillId: skill.id }
        })
        
        let result;
        if (existing) {
            result = await prisma.requirementSkill.update({
                where: { id: existing.id },
                data: { level },
                include: { skill: true }
            })
        } else {
            result = await prisma.requirementSkill.create({
                data: { requirementId, skillId: skill.id, level },
                include: { skill: true }
            })
        }
        return result
    }

    async removeRequirementSkill(requirementId, skillId) {
        await prisma.requirementSkill.deleteMany({
            where: { requirementId, skillId }
        })
        return true
    }

    async createMilestone({ projectId, name, date, type, milestoneTypeId }) {
        return prisma.milestone.create({
            data: { projectId, name, date, type, milestoneTypeId },
            include: { milestoneType: true }
        })
    }

    async deleteMilestone(id) {
        await prisma.milestone.delete({ where: { id } })
        return true
    }
}
