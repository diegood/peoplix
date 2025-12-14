import { prisma } from '../database/client.js'

export class PrismaRoleRepository {
    async findAll() { return prisma.role.findMany() }
    async findById(id) { return prisma.role.findUnique({ where: { id } }) }
    async create(data) { return prisma.role.create({ data }) }
    async delete(id) { await prisma.role.delete({ where: { id } }); return true }
}

export class PrismaSkillRepository {
    async findAll() { return prisma.skill.findMany() }
    async findById(id) { return prisma.skill.findUnique({ where: { id } }) }
    async create(data) { return prisma.skill.create({ data }) }
    async delete(id) { await prisma.skill.delete({ where: { id } }); return true }
}

export class PrismaTechnologyRepository {
    async findAll() { return prisma.technology.findMany() }
    async create(data) { return prisma.technology.create({ data }) }
    async delete(id) { await prisma.technology.delete({ where: { id } }); return true }
}

export class PrismaMilestoneTypeRepository {
    async findAll() { return prisma.milestoneType.findMany({ orderBy: { name: 'asc' }}) }
    async create(data) { return prisma.milestoneType.create({ data }) }
    async update(id, data) { return prisma.milestoneType.update({ where: { id }, data }) }
    async delete(id) { 
        // Logic to check usage? Moved to Service usually. Repository just deletes.
        // But the resolver had a check. Service will handle the check.
        await prisma.milestoneType.delete({ where: { id } }); 
        return true 
    }
    // Specific check method for Service
    async countUsage(id) {
        return prisma.milestone.count({ where: { milestoneTypeId: id }})
    }
}

export class PrismaHierarchyTypeRepository {
    async findAll() { return prisma.hierarchyType.findMany({ orderBy: { rank: 'asc' }}) }
    async create(data) { return prisma.hierarchyType.create({ data }) }
    async update(id, data) { return prisma.hierarchyType.update({ where: { id }, data }) }
    async delete(id) { await prisma.hierarchyType.delete({ where: { id } }); return true }
}

export class PrismaCustomFieldRepository {
    async findAll() { return prisma.customFieldDefinition.findMany({ orderBy: { order: 'asc' } }) }
    async create(data) { return prisma.customFieldDefinition.create({ data }) }
    async update(id, data) { return prisma.customFieldDefinition.update({ where: { id }, data }) }
    async delete(id) { await prisma.customFieldDefinition.delete({ where: { id } }); return true }
    
    // Values
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
