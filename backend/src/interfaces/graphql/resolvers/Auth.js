import { prisma } from '../../../infrastructure/database/client.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'; // Ensure this is in .env in prod

export const authResolvers = {
  Mutation: {
    login: async (_, { input }) => {
      const { username, password } = input;
      
      // 1. Find Global User (Treat username as email)
      const user = await prisma.user.findUnique({
        where: { email: username }
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // 2. Check Password
      // TODO: Use bcrypt in production
      if (user.password !== password) {
        throw new Error('Invalid credentials');
      }

      // 3. Find Collaborator profiles (Organization Memberships)
      const collaborators = await prisma.collaborator.findMany({
        where: { userId: user.id },
        include: { organization: true }
      });

      if (!collaborators.length) {
         throw new Error('User is not associated with any organization');
      }

      // 4. Select Default Organization (First one for now)
      // Future: Allow user to select org if multiple (Multi-step login or header selection)
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
        user: activeProfile // Return the Collaborator profile the frontend expects
      };
    }
  },
  Query: {
    me: async (_, __, context) => {
      if (!context.user) return null;
      return prisma.collaborator.findUnique({
        where: { id: context.user.userId }
      });
    }
  }
};
