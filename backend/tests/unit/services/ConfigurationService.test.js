
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigurationService } from '../../../src/application/services/ConfigurationService.js';

describe('ConfigurationService', () => {
    let service;
    let mocks;

    beforeEach(() => {
        vi.clearAllMocks();
        
        mocks = {
            roles: { findAll: vi.fn(), create: vi.fn(), delete: vi.fn() },
            skills: { findAll: vi.fn(), create: vi.fn(), delete: vi.fn() },
            technologies: { findAll: vi.fn(), create: vi.fn(), delete: vi.fn() },
            milestoneTypes: { findAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
            hierarchyTypes: { findAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
            customFields: { findAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), setValue: vi.fn() },
            collaboratorRepository: { findById: vi.fn() }
        };

        service = new ConfigurationService(mocks);
    });

    // Roles
    describe('Roles', () => {
        it('should getRoles', async () => {
            await service.getRoles('org-1');
            expect(mocks.roles.findAll).toHaveBeenCalledWith('org-1');
        });
        it('should createRole', async () => {
            await service.createRole('Admin', 'org-1');
            expect(mocks.roles.create).toHaveBeenCalledWith({ name: 'Admin', organizationId: 'org-1' });
        });
        it('should deleteRole', async () => {
            await service.deleteRole('role-1');
            expect(mocks.roles.delete).toHaveBeenCalledWith('role-1');
        });
    });

    // Skills
    describe('Skills', () => {
        it('should getSkills', async () => {
             await service.getSkills('org-1');
             expect(mocks.skills.findAll).toHaveBeenCalledWith('org-1');
        });
        it('should createSkill', async () => {
            await service.createSkill('Java', 'org-1');
            expect(mocks.skills.create).toHaveBeenCalledWith({ name: 'Java', organizationId: 'org-1' });
        });
        it('should deleteSkill', async () => {
             await service.deleteSkill('skill-1');
             expect(mocks.skills.delete).toHaveBeenCalledWith('skill-1');
        });
    });

    // Technologies
    describe('Technologies', () => {
        it('should getTechnologies', async () => {
            await service.getTechnologies('org-1');
             expect(mocks.technologies.findAll).toHaveBeenCalledWith('org-1');
        });
        it('should createTechnology', async () => {
             await service.createTechnology('Tech', 'org-1');
             expect(mocks.technologies.create).toHaveBeenCalledWith({ name: 'Tech', organizationId: 'org-1' });
        });
        it('should deleteTechnology', async () => {
            await service.deleteTechnology('tech-1');
            expect(mocks.technologies.delete).toHaveBeenCalledWith('tech-1');
        });
    });

    // Milestone Types
    describe('Milestone Types', () => {
        it('should getMilestoneTypes', async () => {
            await service.getMilestoneTypes('org-1');
            expect(mocks.milestoneTypes.findAll).toHaveBeenCalledWith('org-1');
        });
        it('should createMilestoneType', async () => {
             const data = { name: 'MS', organizationId: 'org-1' };
             await service.createMilestoneType(data);
             expect(mocks.milestoneTypes.create).toHaveBeenCalledWith(data);
        });
        it('should updateMilestoneType', async () => {
            const id = 'ms-1';
            const data = { name: 'Updated' };
            await service.updateMilestoneType(id, data);
            expect(mocks.milestoneTypes.update).toHaveBeenCalledWith(id, data);
        });
        it('should deleteMilestoneType', async () => {
             await service.deleteMilestoneType('ms-1');
             expect(mocks.milestoneTypes.delete).toHaveBeenCalledWith('ms-1');
        });
    });

    // Hierarchy Types
    describe('Hierarchy Types', () => {
        it('should getHierarchyTypes', async () => {
            await service.getHierarchyTypes('org-1');
            expect(mocks.hierarchyTypes.findAll).toHaveBeenCalledWith('org-1');
        });
        it('should createHierarchyType', async () => {
             const data = { name: 'HT', organizationId: 'org-1' };
             await service.createHierarchyType(data);
             expect(mocks.hierarchyTypes.create).toHaveBeenCalledWith(data);
        });
        it('should updateHierarchyType', async () => {
            const id = 'ht-1';
            const data = { name: 'Updated' };
            await service.updateHierarchyType(id, data);
            expect(mocks.hierarchyTypes.update).toHaveBeenCalledWith(id, data);
        });
        it('should deleteHierarchyType', async () => {
            await service.deleteHierarchyType('ht-1');
            expect(mocks.hierarchyTypes.delete).toHaveBeenCalledWith('ht-1');
        });
    });

    // Custom Fields
    describe('Custom Fields', () => {
        it('should getCustomFieldDefinitions', async () => {
            await service.getCustomFieldDefinitions('org-1');
            expect(mocks.customFields.findAll).toHaveBeenCalledWith('org-1');
        });
         it('should createCustomFieldDefinition', async () => {
             const data = { name: 'CF', organizationId: 'org-1' };
             await service.createCustomFieldDefinition(data);
             expect(mocks.customFields.create).toHaveBeenCalledWith(data);
        });
        it('should updateCustomFieldDefinition', async () => {
            const id = 'cf-1';
            const data = { name: 'Updated' };
            await service.updateCustomFieldDefinition(id, data);
            expect(mocks.customFields.update).toHaveBeenCalledWith(id, data);
        });
        it('should deleteCustomFieldDefinition', async () => {
            await service.deleteCustomFieldDefinition('cf-1');
            expect(mocks.customFields.delete).toHaveBeenCalledWith('cf-1');
        });
        it('should setCustomFieldValue and return collaborator', async () => {
             const data = { collaboratorId: 'collab-1', value: 'val' };
             await service.setCustomFieldValue(data);
             expect(mocks.customFields.setValue).toHaveBeenCalledWith(data);
             expect(mocks.collaboratorRepository.findById).toHaveBeenCalledWith('collab-1');
        });
    });
});
