import { prisma } from '../database/client.js'

export class PrismaRoleRepository {
    async findAll(organizationId) { return prisma.role.findMany({ where: { organizationId } }) }
    async findById(id) { return prisma.role.findUnique({ where: { id } }) }
    async create(data) { return prisma.role.create({ data }) }
    async delete(id) { await prisma.role.delete({ where: { id } }); return true }
}

export class PrismaSkillRepository {
    async findAll(organizationId) { return prisma.skill.findMany({ where: { organizationId } }) }
    async findById(id) { return prisma.skill.findUnique({ where: { id } }) }
    async create(data) { return prisma.skill.create({ data }) }
    async delete(id) { await prisma.skill.delete({ where: { id } }); return true }
}

export class PrismaTechnologyRepository {
    async findAll(organizationId) { return prisma.technology.findMany({ where: { organizationId } }) }
    async create(data) { return prisma.technology.create({ data }) }
    async delete(id) { await prisma.technology.delete({ where: { id } }); return true }
}

export class PrismaMilestoneTypeRepository {
    async findAll(organizationId) { return prisma.milestoneType.findMany({ where: { organizationId }, orderBy: { name: 'asc' }}) }
    async create(data) { return prisma.milestoneType.create({ data }) }
    async update(id, data) { return prisma.milestoneType.update({ where: { id }, data }) }
    async delete(id) { 
        await prisma.milestoneType.delete({ where: { id } }); 
        return true 
    }
    async countUsage(id) {
        return prisma.milestone.count({ where: { milestoneTypeId: id }})
    }
}

export class PrismaHierarchyTypeRepository {
    async findAll(organizationId) { return prisma.hierarchyType.findMany({ where: { organizationId }, orderBy: { rank: 'asc' }}) }
    async create(data) { return prisma.hierarchyType.create({ data }) }
    async update(id, data) { return prisma.hierarchyType.update({ where: { id }, data }) }
    async delete(id) { await prisma.hierarchyType.delete({ where: { id } }); return true }
}

export class PrismaCustomFieldRepository {
    async findAll(organizationId) { return prisma.customFieldDefinition.findMany({ where: { organizationId }, orderBy: { order: 'asc' } }) }
    async create(data) { return prisma.customFieldDefinition.create({ data }) }
    async update(id, data) { return prisma.customFieldDefinition.update({ where: { id }, data }) }
    async delete(id) { await prisma.customFieldDefinition.delete({ where: { id } }); return true }
    
    async setValue({ collaboratorId, fieldDefinitionId, value }) {
        return prisma.customFieldValue.upsert({
            where: {
                collaboratorId_fieldDefinitionId: { collaboratorId, fieldDefinitionId }
            },
            update: { value },
            create: { collaboratorId, fieldDefinitionId, value },
            include: { fieldDefinition: true }
        })
    }
}
