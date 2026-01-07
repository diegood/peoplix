
import { prisma } from '../src/infrastructure/database/client.js';

async function main() {
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

    const roles = ['Front', 'Back', 'Desig', 'TL', 'BM'].map(name => ({ name, organizationId: org.id }));
    await prisma.role.createMany({ data: roles });
    
    const skills = ['JavaScript', 'Vue.js', 'Node.js', 'Python', 'Java', 'TypeScript', '.NET', 'CSS', 'Indesign', 'Figma', 'Lead'].map(name => ({ name, organizationId: org.id }));
    await prisma.skill.createMany({ data: skills });
    
    const milestoneTypes = [
        { name: 'Reunion semanal', color: 'bg-blue-400', organizationId: org.id },
        { name: 'Delivery', color: 'bg-green-400', organizationId: org.id }
    ];
    await prisma.milestoneType.createMany({ data: milestoneTypes });

    const technologies = ['PostgreSQL', 'Docker', 'AWS'].map(name => ({ name, organizationId: org.id }));
    await prisma.technology.createMany({ data: technologies });

    const hierarchyTypes = [
      { name: 'TL', rank: 1, organizationId: org.id },
      { name: 'PL', rank: 2, organizationId: org.id },
      { name: 'BM', rank: 3, organizationId: org.id }
    ];
    await prisma.hierarchyType.createMany({ data: hierarchyTypes });

    await prisma.workCenter.create({
        data: {
            name: 'Madrid HQ',
            countryCode: 'ES',
            organizationId: org.id
        }
    });

    const workPackageStatuses = [
        { name: 'a estimar', color: '#fbbf24', order: 1, organizationId: org.id },
        { name: 'Estimado', color: '#60a5fa', order: 2, organizationId: org.id },
        { name: 'Confirmado', color: '#34d399', order: 3, organizationId: org.id },
        { name: 'por hacer', color: '#e5e7eb', order: 4, organizationId: org.id },
        { name: 'en progreso', color: '#3b82f6', order: 5, organizationId: org.id },
        { name: 'hecho', color: '#22c55e', order: 6, organizationId: org.id },
        { name: 'UAT', color: '#a855f7', order: 7, organizationId: org.id },
        { name: 'finalizado', color: '#1f2937', order: 8, organizationId: org.id }
    ];
    await prisma.workPackageStatus.createMany({ data: workPackageStatuses });

    console.log('Creado todo esto a partir de seed:', { user, org, adminCollaborator, config: 'Con configuraciones por defecto' });

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
