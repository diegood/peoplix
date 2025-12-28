
import { prisma } from '../src/infrastructure/database/client.js';

async function main() {
  console.log('Seeding database (User/Org Refactor)...');
  
  try {
    const user = await prisma.user.upsert({
      where: { email: 'admin@workload.com' },
      update: {},
      create: {
        email: 'admin@workload.com',
        password: 'admin'
      }
    });

    const org = await prisma.organization.create({
      data: {
        name: 'Principal Organization',
      }
    });

    const adminCollaborator = await prisma.collaborator.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        userName: 'admin',
        firstName: 'System',
        lastName: 'Admin',
        contractedHours: 40,
        systemRole: 1,
        joinDate: new Date(),
        isActive: true
      },
    });

    const roles = ['Frontender', 'Backender', 'Designer', 'Manager'].map(name => ({ name, organizationId: org.id }));
    await prisma.role.createMany({ data: roles });
    
    const skills = ['JavaScript', 'Vue.js', 'Node.js', 'Python', 'Java'].map(name => ({ name, organizationId: org.id }));
    await prisma.skill.createMany({ data: skills });
    
    const milestoneTypes = [
        { name: 'Meeting', color: 'bg-blue-400', organizationId: org.id },
        { name: 'Delivery', color: 'bg-green-400', organizationId: org.id }
    ];
    await prisma.milestoneType.createMany({ data: milestoneTypes });

    const technologies = ['PostgreSQL', 'Docker', 'AWS'].map(name => ({ name, organizationId: org.id }));
    await prisma.technology.createMany({ data: technologies });

    const hierarchyTypes = [
      { name: 'Line Management', rank: 1, organizationId: org.id },
      { name: 'Project Management', rank: 2, organizationId: org.id }
    ];
    await prisma.hierarchyType.createMany({ data: hierarchyTypes });

    await prisma.workCenter.create({
        data: {
            name: 'Madrid HQ',
            countryCode: 'ES',
            organizationId: org.id
        }
    });

    console.log('Seeded:', { user, org, adminCollaborator, config: 'Default Configs Created' });

  } catch (error) {
    console.error('Error seeding:', error);
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
