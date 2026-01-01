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

      if (!collaborators.length) {
         throw new Error('User is not associated with any organization');
      }

      const activeProfile = collaborators[0];

      const token = jwt.sign(
        { 
            userId: user.id, 
            organizationId: activeProfile.organizationId,
            role: activeProfile.systemRole 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        token,
        user: activeProfile
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
