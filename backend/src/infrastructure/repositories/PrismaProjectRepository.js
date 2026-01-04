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
        let baseTag = name.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (baseTag.length < 3) baseTag = (baseTag + "PRO").substring(0, 3);
        
        let tag = baseTag;
        let counter = 1;
        
        while (true) {
            const existing = await prisma.project.findUnique({
                where: {
                    organizationId_tag: {
                        organizationId,
                        tag
                    }
                }
            });
            
            if (!existing) break;
            
            tag = `${baseTag}-${counter}`;
            counter++;
        }

        return prisma.project.create({
            data: { name, contractedHours, organizationId, tag }
        })
    }

    async update(id, data) {
        return prisma.project.update({
            where: { id },
            data
        })
    }

    async delete(id) {
        return prisma.$transaction(async (tx) => {
            // 1. Kanban Clean up
            await tx.kanbanCard.updateMany({
                where: { projectId: id },
                data: { parentCardId: null }
            })
            await tx.kanbanCard.deleteMany({ where: { projectId: id } })

            // 2. WorkPackages and Tasks
            const wps = await tx.workPackage.findMany({ where: { projectId: id }, select: { id: true } })
            const wpIds = wps.map(w => w.id)
            
            if (wpIds.length > 0) {
                const tasks = await tx.task.findMany({ where: { workPackageId: { in: wpIds } }, select: { id: true } })
                const taskIds = tasks.map(t => t.id)
                
                if (taskIds.length > 0) {
                    await tx.taskEstimation.deleteMany({ where: { taskId: { in: taskIds } } })
                    // Implicit many-to-many dependencies usually handle themselves or might require explicit cleanup if defined differently
                    await tx.task.deleteMany({ where: { workPackageId: { in: wpIds } } })
                }
                
                await tx.workPackageRecurrentEvent.deleteMany({ where: { workPackageId: { in: wpIds } } })
                // Check if WorkPackageHistory exists in schema (we verified it does)
                await tx.workPackageHistory.deleteMany({ where: { workPackageId: { in: wpIds } } })
                await tx.workPackage.deleteMany({ where: { projectId: id } })
            }

            // 3. Allocations
            const allocs = await tx.allocation.findMany({ where: { projectId: id }, select: { id: true } })
            const allocIds = allocs.map(a => a.id)
            
            if (allocIds.length > 0) {
                await tx.allocationRole.deleteMany({ where: { allocationId: { in: allocIds } } })
                await tx.allocationHierarchy.deleteMany({
                    where: { OR: [
                        { subordinateAllocId: { in: allocIds } },
                        { supervisorAllocId: { in: allocIds } }
                    ]}
                })
                await tx.allocation.deleteMany({ where: { projectId: id } })
            }

            // 4. Milestones & Sprints
            await tx.milestone.deleteMany({ where: { projectId: id } })
            await tx.sprint.deleteMany({ where: { projectId: id } })

            // 5. Requirements (Manually trigger to ensure Skills are gone if not recursive)
            const reqs = await tx.projectRequirement.findMany({ where: { projectId: id }, select: { id: true } })
            const reqIds = reqs.map(r => r.id)
            if (reqIds.length > 0) {
                await tx.requirementSkill.deleteMany({ where: { requirementId: { in: reqIds } } })
                await tx.projectRequirement.deleteMany({ where: { projectId: id } })
            }

            // 6. Finally Project
            await tx.project.delete({ where: { id } })
        })
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
