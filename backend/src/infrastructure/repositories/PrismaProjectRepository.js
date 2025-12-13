import { prisma } from '../database/prisma.js';
import { Project } from '../../domain/entities/Project.js';
import { Allocation } from '../../domain/entities/Allocation.js';

import { Collaborator } from '../../domain/entities/Collaborator.js';

export class PrismaProjectRepository {
    async findAll() {
        const projects = await prisma.project.findMany({
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
            }
        }); 
        
        return projects.map(p => {
             const mappedAllocations = p.allocations ? p.allocations.map(a => {
                 const roles = a.roles ? a.roles.map(ar => ar.role) : [];
                 
                 let mappedCollaborator = null;
                 if (a.collaborator) {
                     const flatSkills = a.collaborator.skills ? a.collaborator.skills.map(cs => ({ ...cs.skill, level: cs.level })) : [];
                     mappedCollaborator = new Collaborator({ ...a.collaborator, skills: flatSkills });
                 }
                 
                 return new Allocation({ ...a, roles, collaborator: mappedCollaborator });
             }) : [];
             return new Project({ ...p, allocations: mappedAllocations });
        });
    }

    async findById(id) {
        const project = await prisma.project.findUnique({
            where: { id },
             include: {
                allocations: {
                   include: { 
                     collaborator: { include: { skills: { include: { skill: true } } } }, 
                     roles: { include: { role: true } } 
                   }
                },
                milestones: { include: { milestoneType: true } },
                requiredRoles: { include: { role: true, skills: { include: { skill: true } } } }
              }
        });
        
        if (!project) return null;
        
        const mappedAllocations = project.allocations ? project.allocations.map(a => {
             const roles = a.roles ? a.roles.map(ar => ar.role) : [];
             
             let mappedCollaborator = null;
             if (a.collaborator) {
                  const flatSkills = a.collaborator.skills ? a.collaborator.skills.map(cs => ({ ...cs.skill, level: cs.level })) : [];
                  mappedCollaborator = new Collaborator({ ...a.collaborator, skills: flatSkills });
             }

             return new Allocation({ ...a, roles, collaborator: mappedCollaborator });
        }) : [];
        
        return new Project({ ...project, allocations: mappedAllocations });
    }

    async create({ name, contractedHours }) {
        const project = await prisma.project.create({
            data: { name, contractedHours }
        });
        return new Project(project);
    }
    
    async update({ id, name, contractedHours }) {
         const project = await prisma.project.update({
             where: { id },
             data: { name, contractedHours }
         });
         return new Project(project);
    }
}
