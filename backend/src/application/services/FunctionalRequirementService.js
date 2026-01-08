import { prisma } from '../../infrastructure/database/client.js';

class FunctionalRequirementService {
  async list(projectId, { status } = {}) {
    const where = { projectId };
    if (status) where.status = status;
    
    return prisma.functionalRequirement.findMany({
      where,
      include: {
        history: {
          include: {
            changedBy: {
              include: {
                collaborator: true
              }
            }
          }
        },
        analyst: {
          include: {
            collaborator: true
          }
        },
        workPackages: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getById(id) {
    return prisma.functionalRequirement.findUnique({
      where: { id },
      include: {
        history: {
          orderBy: { version: 'desc' },
          include: {
            changedBy: {
              include: {
                collaborator: true
              }
            }
          }
        },
        analyst: {
          include: {
            collaborator: true
          }
        },
        workPackages: true,
        project: true
      }
    });
  }

  async create(data, userId) {
    const { projectId, ...rest } = data;
    
    return prisma.functionalRequirement.create({
      data: {
        ...rest,
        projectId,
        analystId: userId,
        status: 'DRAFT',
        version: 1
      }
    });
  }

  async update(id, data, userId) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Requirement not found');

    const significantFields = [
      'title', 'description', 'generalDescription', 'actors', 
      'preconditions', 'expectedInputs', 'detailedFlow', 
      'validations', 'expectedOutputs', 'systemMessages', 'notes', 'status'
    ];

    let hasChanges = false;
    const diff = {};
    for (const field of significantFields) {
      if (data[field] !== undefined && data[field] !== existing[field]) {
        hasChanges = true;
        diff[field] = { old: existing[field], new: data[field] };
      }
    }

    const updateData = { ...data };
    
    if (hasChanges) {
       updateData.version = existing.version + 1;
       if (userId) { updateData.analystId = userId}
       
       await prisma.functionalRequirementHistory.create({
         data: {
           requirementId: id,
           version: existing.version,
           diff: JSON.stringify(diff),
           changedById: userId
         }
       });
    }

    return prisma.functionalRequirement.update({
      where: { id },
      data: updateData
    });
  }

  async delete(id) {
    return prisma.functionalRequirement.delete({
      where: { id }
    });
  }
}

export default new FunctionalRequirementService();
