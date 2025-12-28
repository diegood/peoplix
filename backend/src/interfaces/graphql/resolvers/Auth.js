import { prisma } from '../../../infrastructure/database/client.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'; // Ensure this is in .env in prod

export const authResolvers = {
  Mutation: {
    login: async (_, { input }) => {
      const { username, password } = input;
      
      const user = await prisma.collaborator.findFirst({
        where: { userName: username }
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // TODO: Use bcrypt for password comparison in production
      if (user.password !== password) {
        throw new Error('Invalid credentials');
      }

      const token = jwt.sign(
        { userId: user.id, role: user.systemRole },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        token,
        user
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
