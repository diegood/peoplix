
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/infrastructure/database/client.js';
import { WorkCenterService } from '../../src/application/services/WorkCenterService.js';

describe('E2E: WorkCenter Mutation', () => {
    let service;
    let organizationId;
    let workCenterId;

    beforeAll(async () => {
        service = new WorkCenterService();
        // Setup: Create Organization
        const org = await prisma.organization.create({
            data: { 
                name: 'E2E WorkCenter Org ' + Date.now(),
                tag: 'ORG_WC_' + Date.now()
            }
        });
        organizationId = org.id;
    });

    afterAll(async () => {
        if (workCenterId) {
             await prisma.workCenter.delete({ where: { id: workCenterId } }).catch(() => {});
        }
        if (organizationId) {
            await prisma.organization.delete({ where: { id: organizationId } }).catch(() => {});
        }
        await prisma.$disconnect();
    });

    it('should create a new WorkCenter successfully', async () => {
        const input = {
            name: 'Test Setup WC',
            countryCode: 'ES',
            regionCode: 'MD',
            organizationId // Simulating Resolver injection
        };

        const result = await service.create(input);

        expect(result).toHaveProperty('id');
        expect(result.name).toBe(input.name);
        expect(result.countryCode).toBe(input.countryCode);
        expect(result.organizationId).toBe(organizationId);

        workCenterId = result.id;
    });

    it('should allow creating WorkCenter without region (National)', async () => {
         const input = {
            name: 'National WC',
            countryCode: 'FR',
            organizationId
        };
        const result = await service.create(input);
        expect(result.id).toBeDefined();
        expect(result.regionCode).toBeNull();
        
        // Cleanup this specific one
        await prisma.workCenter.delete({ where: { id: result.id } });
    });
});
