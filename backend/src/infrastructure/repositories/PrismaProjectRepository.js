import { prisma } from '../database/client.js'

export class PrismaProjectRepository {
    async findAll(organizationId, args = {}) {
        if (!organizationId) throw new Error("Organization Context Required");
        return prisma.project.findMany({
            where: { organizationId, ...args },
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

    async create({ name, contractedHours, organizationId }) {
        return prisma.project.create({
            data: { name, contractedHours, organizationId }
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

    async addRequirement({ projectId, roleId, resourceCount, monthlyHours }) {
        return prisma.projectRequirement.create({
            data: { projectId, roleId, resourceCount, monthlyHours },
            include: { role: true, skills: { include: { skill: true } } }
        })
    }

    async updateRequirement(id, data) {
        return prisma.projectRequirement.update({
            where: { id },
            data: {
                resourceCount: data.resourceCount,
                monthlyHours: data.monthlyHours
            },
            include: { role: true, skills: { include: { skill: true } } }
        })
    }

    async removeRequirement(id) {
        await prisma.projectRequirement.delete({ where: { id } })
        return true
    }

    async addRequirementSkill(requirementId, skillName, level, organizationId) {
        let skill = await prisma.skill.findUnique({ 
            where: { name_organizationId: { name: skillName, organizationId } } 
        })
        
        if (!skill) {
            skill = await prisma.skill.create({ data: { name: skillName, organizationId } })
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
