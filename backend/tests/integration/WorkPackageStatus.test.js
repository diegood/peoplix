
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/infrastructure/database/client.js';
import { ConfigurationService } from '../../src/application/services/ConfigurationService.js';

describe('E2E: WorkPackageStatus Mutation', () => {
    let service;
    let organizationId;

    beforeAll(async () => {
        service = new ConfigurationService();
        const org = await prisma.organization.create({
            data: { 
                name: 'E2E Test Org ' + Date.now(),
                tag: 'ORG_WPS_' + Date.now()
            }
        });
        organizationId = org.id;
    });

    afterAll(async () => {
        if (organizationId) {
            await prisma.workPackageStatus.deleteMany({ where: { organizationId } }).catch(() => {});
            await prisma.organization.delete({ where: { id: organizationId } }).catch(() => {});
        }
        await prisma.$disconnect();
    });

    it('should create a new WorkPackageStatus successfully', async () => {
        const input = {
            organizationId,
            name: 'Status E2E',
            color: '#123456',
            order: 99
        };

        const result = await service.createWorkPackageStatus(input);

        expect(result).toHaveProperty('id');
        expect(result.name).toBe(input.name);
        expect(result.color).toBe(input.color);
        expect(result.order).toBe(input.order);
        expect(result.organizationId).toBe(organizationId);

        const dbRecord = await prisma.workPackageStatus.findUnique({
            where: { id: result.id }
        });
        expect(dbRecord).toBeDefined();
        expect(dbRecord.name).toBe('Status E2E');
    });

    it('should update the created WorkPackageStatus', async () => {
        const status = await service.createWorkPackageStatus({
            organizationId,
            name: 'To Update',
            color: '#000000',
            order: 1
        });
        const updated = await service.updateWorkPackageStatus(status.id, {
            name: 'Updated Name',
            color: '#ffffff'
        });

        expect(updated.name).toBe('Updated Name');
        expect(updated.color).toBe('#ffffff');

        const dbRecord = await prisma.workPackageStatus.findUnique({ where: { id: status.id } });
        expect(dbRecord.name).toBe('Updated Name');
    });

    it('should delete the WorkPackageStatus', async () => {
        const status = await service.createWorkPackageStatus({
            organizationId,
            name: 'To Delete',
            color: '#000000',
            order: 1
        });

        const result = await service.deleteWorkPackageStatus(status.id);

        expect(result).toBe(true);
        const dbRecord = await prisma.workPackageStatus.findUnique({ where: { id: status.id } });
        expect(dbRecord).toBeNull();
    });
});
