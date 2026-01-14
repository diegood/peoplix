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
        workPackages: true,
        originalRequirement: true,
        evolutions: true,
        relatedTo: {
          include: { to: true }
        },
        relatedFrom: {
          include: { from: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getById(id) {
    return prisma.functionalRequirement.findUnique({
      where: { id },
      include: {
        history: {
          orderBy: [
            { versionMajor: 'desc' },
            { versionMinor: 'desc' },
            { versionPatch: 'desc' }
          ],
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
        project: true,
        originalRequirement: true,
        evolutions: true,
        relatedTo: {
          include: { to: true }
        },
        relatedFrom: {
          include: { from: true }
        }
      }
    });
  }

  async create(data, userId) {
    const { projectId, ...rest } = data;
    
    const lastRequirement = await prisma.functionalRequirement.findFirst({
      where: { projectId },
      orderBy: { number: 'desc' },
      select: { number: true }
    });
    
    const nextNumber = (lastRequirement?.number || 0) + 1;
    
    return prisma.functionalRequirement.create({
      data: {
        ...rest,
        projectId,
        analystId: userId,
        status: 'DRAFT',
        versionMajor: 1,
        versionMinor: 0,
        versionPatch: 0,
        number: nextNumber
      }
    });
  }
  async update(id, data, user) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Requirement not found');

    const versionBump = data.versionBump;
    const updateData = { ...data };
    delete updateData.versionBump;

    if (existing.status === 'BLOCKED' && updateData.status !== 'BLOCKED') {
        const ADMIN_ROLE = 1;
        const isAdmin = user && (user.isSuperAdmin || user.role <= ADMIN_ROLE);
        
        if (!isAdmin) {
             throw new Error('Cannot modify a BLOCKED requirement. Only admins can unlock it.');
        }
    }

    const significantFields = [
      'title', 'description', 'generalDescription', 'actors', 
      'preconditions', 'expectedInputs', 'detailedFlow', 
      'validations', 'expectedOutputs', 'systemMessages', 'notes', 'status'
    ];

    let hasChanges = false;
    const diff = {};
    for (const field of significantFields) {
      if (updateData[field] !== undefined && updateData[field] !== existing[field]) {
        hasChanges = true;
        diff[field] = { old: existing[field], new: updateData[field] };
      }
    }

    if (hasChanges) {
       // Determinar bump de versión
       const bump = versionBump || 'patch';
       const major = existing.versionMajor ?? 1;
       const minor = existing.versionMinor ?? 0;
       const patch = existing.versionPatch ?? 0;

       if (bump === 'major') {
         updateData.versionMajor = major + 1;
         updateData.versionMinor = 0;
         updateData.versionPatch = 0;
       } else if (bump === 'minor') {
         updateData.versionMajor = major;
         updateData.versionMinor = minor + 1;
         updateData.versionPatch = 0;
       } else {
         updateData.versionMajor = major;
         updateData.versionMinor = minor;
         updateData.versionPatch = patch + 1;
       }

       const actingUserId = user?.id || user?.userId || user;

       if (actingUserId) { updateData.analystId = actingUserId }
       
       await prisma.functionalRequirementHistory.create({
         data: {
           requirementId: id,
           versionMajor: major,
           versionMinor: minor,
           versionPatch: patch,
           diff: JSON.stringify(diff),
           changedById: actingUserId
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

  async createEvolution(originalRequirementId, data, userId) {
    // Obtener el requisito original
    const original = await this.getById(originalRequirementId);
    if (!original) throw new Error('Original requirement not found');

    // El evolutivo hereda el projectId del original y clona toda la definición
    const evolutionData = {
      title: original.title,
      description: original.description,
      generalDescription: original.generalDescription,
      actors: original.actors,
      preconditions: original.preconditions,
      expectedInputs: original.expectedInputs,
      detailedFlow: original.detailedFlow,
      validations: original.validations,
      expectedOutputs: original.expectedOutputs,
      systemMessages: original.systemMessages,
      mockupUrl: original.mockupUrl,
      notes: original.notes,
      projectId: original.projectId,
      originalRequirementId,
      status: 'DRAFT',
      versionMajor: 1,
      versionMinor: 0,
      versionPatch: 0,
      analystId: userId
    };

    // Obtener el siguiente número para el proyecto
    const lastRequirement = await prisma.functionalRequirement.findFirst({
      where: { projectId: original.projectId },
      orderBy: { number: 'desc' },
      select: { number: true }
    });
    
    evolutionData.number = (lastRequirement?.number || 0) + 1;

    return prisma.functionalRequirement.create({
      data: evolutionData,
      include: {
        originalRequirement: true,
        analyst: {
          include: {
            collaborator: true
          }
        }
      }
    });
  }
}

export default new FunctionalRequirementService();
