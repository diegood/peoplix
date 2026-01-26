import { prisma } from '../../../infrastructure/database/client.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export const authResolvers = {
  Mutation: {
    login: async (_, { input }) => {
      const { firebaseToken, recaptchaToken } = input;
      
      // 1. Verify ReCAPTCHA
      const { RecaptchaClient } = await import('../../../infrastructure/external/RecaptchaClient.js');
      const recaptcha = new RecaptchaClient();
      const isRecaptchaValid = await recaptcha.validateToken(recaptchaToken, 'LOGIN');
      
      if (!isRecaptchaValid) {
        throw new Error('Security check failed. Please try again.');
      }

      // 2. Verify Firebase Token
      const { firebaseAdmin } = await import('../../../infrastructure/external/firebaseAdmin.js');
      let decodedToken;
      try {
        decodedToken = await firebaseAdmin.auth().verifyIdToken(firebaseToken);
      } catch (error) {
        console.error('Firebase Token Verification Failed:', error);
        throw new Error('Authentication failed');
      }

      const email = decodedToken.email;
      if (!email) {
        throw new Error('No email found in authentication token');
      }
      
      // 3. Find User locally
      let user = await prisma.user.findUnique({
        where: { email: email }
      });

      if (!user) {
          // Fallback: Check collaborator email if not in User table (legacy support or migration)
          const collaborator = await prisma.collaborator.findFirst({
              where: { userName: email }, // Assuming userName might match email in some cases or we search by email field if added
              include: { user: true }
          });
          
          if (collaborator && collaborator.user) {
              user = collaborator.user;
          }
      }

      if (!user) {
        // Auto-register the user using Firebase info
        const nameParts = (decodedToken.name || '').split(' ');
        const firstName = nameParts[0] || 'Unknown';
        const lastName = nameParts.slice(1).join(' ') || 'User';

        try {
            user = await prisma.user.create({
                data: {
                    email: email,
                    username: email, // Default username to email
                    password: 'firebase-login-no-password', // Dummy password
                    isSuperAdmin: false, // Default to normal user
                    // Create a default collaborator profile for the first organization found or a default one
                    // For now, we just create the User. The collaborator creation might need organization context.
                    // If we want to assign them to an org, we need to know which one.
                    // As a fallback, we create the user without collaborators first.
                }
            });
            console.log(`Auto-registered new user: ${email}`);
        } catch (createError) {
             console.error('Error auto-registering user:', createError);
             throw new Error('Failed to register user.');
        }
      }

      // Password check removed as we trust Firebase Authentication

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
          // If no collaborators found, the user is new or has no org.
          // We return an empty list but do NOT throw an error.
          // This allows them to login and reach the "Create Organization" page.
          if (collaborators.length) {
             availableOrganizations = collaborators.map(c => c.organization).filter(o => o.isActive);
          }
      }

      let activeProfile = collaborators[0] || null;
      
      if (!activeProfile) {
          // Provide a basic profile wrapper for users without an organization
          // This matches the GraphQL 'Collaborator' type structure loosely so the frontend doesn't crash,
          // but organization-specific fields will be null.
           activeProfile = {
             id: 'no-org-' + user.id,
             firstName: user.username || 'User', // Fallback
             lastName: '',
             userName: user.email,
             email: user.email,
             systemRole: 0, // 0 usually means SuperAdmin, but here we might need a "NoRole" or handle it on frontend. 
                            // Letting it be 0 might be dangerous if logic checks < 1. 2 is User.
                            // Let's use 2 (User) or a special code. Using 2 for safety.
             systemRole: user.isSuperAdmin ? 0 : 2,
             organization: null,
             organizationId: null,
             userId: user.id,
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
                 const targetOrg = await prisma.organization.findUnique({ where: { id: organizationId } });
                 if (!targetOrg) throw new Error('Organization not found');
                 if (!targetOrg.isActive) throw new Error('Organization is blocked');

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
  User: {
    collaborator: (parent, args, context) => {
        if (parent.collaborators && parent.collaborators.length > 0) {
             if (context.user && context.user.organizationId) {
                 return parent.collaborators.find(c => c.organizationId === context.user.organizationId) || parent.collaborators[0];
             }
             return parent.collaborators[0];
        }
        return null;
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
