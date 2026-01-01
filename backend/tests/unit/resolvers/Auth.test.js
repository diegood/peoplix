
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authResolvers } from '../../../src/interfaces/graphql/resolvers/Auth.js';
import { prisma } from '../../../src/infrastructure/database/client.js';

// Mock the prisma client module
vi.mock('../../../src/infrastructure/database/client.js', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
        },
        collaborator: {
            findFirst: vi.fn(),
            findMany: vi.fn(),
        }
    }
}));

describe('Auth Resolvers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Mutation.login', () => {
        const login = authResolvers.Mutation.login;

        it('should login successfully with valid email', async () => {
            const input = { username: 'test@example.com', password: 'password123' };
            const user = { id: 'u1', email: 'test@example.com', password: 'password123' };
            const collaborators = [{ id: 'c1', userId: 'u1', organizationId: 'o1', systemRole: 1, organization: {} }];

            prisma.user.findUnique.mockResolvedValue(user);
            prisma.collaborator.findMany.mockResolvedValue(collaborators);

            const result = await login(null, { input });

            expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: input.username } });
            // Should NOT call findFirst (username fallback)
            expect(prisma.collaborator.findFirst).not.toHaveBeenCalled(); 
            expect(result).toHaveProperty('token');
            expect(result.user).toEqual(collaborators[0]);
        });

        it('should login successfully with valid username (fallback)', async () => {
            const input = { username: 'myuser', password: 'password123' };
            const user = { id: 'u2', email: 'real@example.com', password: 'password123' };
            const collaborators = [{ id: 'c2', userId: 'u2', organizationId: 'o1', systemRole: 1, organization: {} }];

            // 1. Fail email lookup
            prisma.user.findUnique.mockResolvedValue(null);
            
            // 2. Succeed username lookup
            prisma.collaborator.findFirst.mockResolvedValue({ 
                id: 'c2', 
                userName: 'myuser', 
                user: user 
            });

            // 3. Return profiles
            prisma.collaborator.findMany.mockResolvedValue(collaborators);

            const result = await login(null, { input });

            expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: input.username } });
            expect(prisma.collaborator.findFirst).toHaveBeenCalledWith({
                where: { userName: input.username },
                include: { user: true }
            });
            expect(result).toHaveProperty('token');
            expect(result.user).toEqual(collaborators[0]);
        });

        it('should throw error if user not found (email or username)', async () => {
            const input = { username: 'ghost', password: 'pw' };
            
            prisma.user.findUnique.mockResolvedValue(null);
            prisma.collaborator.findFirst.mockResolvedValue(null);

            await expect(login(null, { input })).rejects.toThrow('Invalid credentials');
        });

        it('should throw error if password does not match', async () => {
            const input = { username: 'test@example.com', password: 'wrongpassword' };
            const user = { id: 'u1', email: 'test@example.com', password: 'correctpassword' };

            prisma.user.findUnique.mockResolvedValue(user);

            await expect(login(null, { input })).rejects.toThrow('Invalid credentials');
        });

        it('should throw error if user has no organizations', async () => {
            const input = { username: 'test@example.com', password: 'password123' };
            const user = { id: 'u1', email: 'test@example.com', password: 'password123' };

            prisma.user.findUnique.mockResolvedValue(user);
            prisma.collaborator.findMany.mockResolvedValue([]); // No profiles

            await expect(login(null, { input })).rejects.toThrow('User is not associated with any organization');
        });
    });

    describe('Query.me', () => {
        const me = authResolvers.Query.me;

        it('should return collaborator if user context is present', async () => {
            const context = { user: { userId: 'u1', organizationId: 'o1' } };
            const collaborator = { id: 'c1', userId: 'u1', organizationId: 'o1' };
            
            prisma.collaborator.findFirst.mockResolvedValue(collaborator);
            
            const result = await me(null, null, context);
            
            expect(prisma.collaborator.findFirst).toHaveBeenCalledWith({
                where: { 
                    userId: 'u1', 
                    organizationId: 'o1' 
                }
            });
            expect(result).toEqual(collaborator);
        });

        it('should return null if user context is missing', async () => {
            const context = {}; // No user
            const result = await me(null, null, context);
            expect(result).toBeNull();
            expect(prisma.collaborator.findFirst).not.toHaveBeenCalled();
        });
    });
});
