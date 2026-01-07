import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

class FunctionalRequirementService {
  async list(projectId, { status } = {}) {
    const where = { projectId };
    if (status) where.status = status;
    
    return prisma.functionalRequirement.findMany({
      where,
      include: {
        history: true,
        analyst: true,
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
          orderBy: { version: 'desc' }
        },
        analyst: true,
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
      'validations', 'expectedOutputs', 'systemMessages', 'notes'
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
       
       await prisma.functionalRequirementHistory.create({
         data: {
           requirementId: id,
           version: existing.version,
           diff: JSON.stringify(diff),
           changedBy: userId
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
