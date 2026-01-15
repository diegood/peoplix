import { prisma } from '../../../infrastructure/database/client.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export const authResolvers = {
  Mutation: {
    login: async (_, { input }) => {
      const { username, password } = input;
      
      let user = await prisma.user.findUnique({
        where: { email: username }
      });

      if (!user) {
          const collaborator = await prisma.collaborator.findFirst({
              where: { userName: username },
              include: { user: true }
          });
          
          if (collaborator && collaborator.user) {
              user = collaborator.user;
          }
      }

      if (!user) {
        throw new Error('Invalid credentials');
      }

      if (user.password !== password) {
        throw new Error('Invalid credentials');
      }

      const collaborators = await prisma.collaborator.findMany({
        where: { userId: user.id },
        include: { organization: true }
      });

      let availableOrganizations = [];
      
      if (user.isSuperAdmin) {
          availableOrganizations = await prisma.organization.findMany({
              where: { isActive: true },
              orderBy: { name: 'asc' }
          });
      } else {
          if (!collaborators.length) {
             throw new Error('User is not associated with any organization');
          }
          availableOrganizations = collaborators.map(c => c.organization).filter(o => o.isActive);
      }

      let activeProfile = collaborators[0] || null;
      
      if (!activeProfile && user.isSuperAdmin) {
         activeProfile = {
             id: 'super-admin-' + user.id,
             firstName: 'Super',
             lastName: 'Admin',
             userName: user.email,
             email: user.email,
             systemRole: 0,
             organization: null,
             organizationId: null,
             roles: [],
             skills: [],
             allocations: []
         };
      }

      if (activeProfile && activeProfile.organization && !activeProfile.organization.isActive) {
          throw new Error('Organization is blocked. Contact support.');
      }

      const tokenPayload = { 
            userId: user.id, 
            organizationId: activeProfile?.organizationId || null,
            role: activeProfile?.systemRole ?? 0,
            isSuperAdmin: user.isSuperAdmin
      };

      const token = jwt.sign(
        tokenPayload,
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        token,
        user: activeProfile,
        availableOrganizations
      };
    },
    switchOrganization: async (_, { organizationId }, context) => {
        if (!context.user) throw new Error('Not authenticated');

        let collaborator = await prisma.collaborator.findFirst({
            where: {
                userId: context.user.userId,
                organizationId: organizationId
            },
            include: { organization: true }
        });

        const isSuperAdmin = context.user.isSuperAdmin;

        if (!collaborator) {
             if (isSuperAdmin) {
                 // Synthetic Collaborator for Super Admin viewing other orgs
                 const targetOrg = await prisma.organization.findUnique({ where: { id: organizationId } });
                 if (!targetOrg) throw new Error('Organization not found');
                 if (!targetOrg.isActive) throw new Error('Organization is blocked');

                  // Fetch the User record to get details
                  const userRecord = await prisma.user.findUnique({ where: { id: context.user.userId } });

                 collaborator = {
                     id: 'super-admin-' + context.user.userId,
                     firstName: 'Super',
                     lastName: 'Admin',
                     userName: userRecord?.email || 'admin',
                     email: userRecord?.email || 'admin',
                     systemRole: 0,
                     organization: targetOrg,
                     organizationId: targetOrg.id,
                     userId: context.user.userId, 
                     roles: [],
                     skills: [],
                     allocations: []
                 };
             } else {
                 throw new Error('User not part of this organization');
             }
        }
        
        if (!collaborator.organization.isActive) {
             throw new Error('Organization is blocked');
        }

        const tokenPayload = { 
            userId: context.user.userId, 
            organizationId: organizationId,
            role: collaborator.systemRole,
            isSuperAdmin: isSuperAdmin 
        };
        
        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
         
        let availableOrganizations = [];
        if (isSuperAdmin) {
             availableOrganizations = await prisma.organization.findMany({
                where: { isActive: true },
                orderBy: { name: 'asc' }
            });
        } else {
            const allCollaborators = await prisma.collaborator.findMany({
                where: { userId: context.user.userId },
                include: { organization: true }
            });
            availableOrganizations = allCollaborators.map(c => c.organization).filter(o => o.isActive);
        }
        
        return {
            token,
            user: collaborator,
            availableOrganizations
        };
    }
  },
  Query: {
    me: async (_, __, context) => {
      if (!context.user) return null;
      return prisma.collaborator.findFirst({
        where: { 
            userId: context.user.userId,
            organizationId: context.user.organizationId
        }
      });
    }
  }
};
