
import { prisma } from '../src/infrastructure/database/client.js';

async function main() {
  console.log('Seeding database...');
  
  try {
    const admin = await prisma.collaborator.upsert({
      where: { userName: 'admin' },
      update: {
        systemRole: 1,
        password: 'admin'
      },
      create: {
        userName: 'admin',
        firstName: 'System',
        lastName: 'Admin',
        contractedHours: 40,
        systemRole: 1, // 1 = Admin
        password: 'admin',
        joinDate: new Date(),
        isActive: true
      },
    });
    console.log('Admin user seeded:', admin);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  });
