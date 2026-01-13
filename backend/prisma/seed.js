
import { prisma } from '../src/infrastructure/database/client.js';

async function main() {
  try {
    const sadmin = await prisma.user.upsert({
      where: { email: 'sadmin' },
      update: {},
      create: {
        email: 'sadmin',
        password: 'sadmin',
      }
    });
    const user = await prisma.user.upsert({
      where: { email: 'admin@workload.com' },
      update: {},
      create: {
        email: 'admin@workload.com',
        password: 'admin'
      }
    });


    const org = await prisma.organization.upsert({
      where: { tag: 'principal' },
      update: {},
      create: {
        name: 'Principal Organization',
        tag: 'principal'
      }
    });

    const roles = ['Front', 'Back', 'Desig', 'TL', 'BM', 'Manual tester', 'Automation Tester', 'Full Stack', ].map(name => ({ name, organizationId: org.id }));
    await prisma.role.createMany({ data: roles, skipDuplicates: true });
    
    const skills = ['JavaScript', 'Vue.js', 'Node.js', 'Python', 'Java', 'TypeScript', '.NET', 'CSS', 'Indesign', 'Figma', 'Lead', 'manual testing', 'automation testing', 'postgressql', 'MySQL', 'SQL server', 'mySql', ].map(name => ({ name, organizationId: org.id }));
    await prisma.skill.createMany({ data: skills, skipDuplicates: true });

    const workCenter = await prisma.workCenter.upsert({
        where: { name: 'Madrid HQ' }, // Assuming name is unique or we can use another unique field. 
        // Checking schema: WorkCenter has id, name. Name is likely not unique constraint unless defined. 
        // Error says: Unique constraint failed on the fields: (`name`). So yes, name is unique.
        update: {},
        create: {
            name: 'Madrid HQ',
            countryCode: 'ES',
            organizationId: org.id
        }
    });

    // Super Admin Collaborator (Must be Role 0)
    await prisma.collaborator.upsert({
        where: { userId: sadmin.id }, 
        update: { systemRole: 0 },
        create: {
            userId: sadmin.id,
            organizationId: org.id,
            userName: 'sadmin',
            firstName: 'Super',
            lastName: 'Admin',
            contractedHours: 0,
            systemRole: 0,
            joinDate: new Date(),
            isActive: true,
            workCenterId: workCenter.id
        }
    });

    const adminCollaborator = await prisma.collaborator.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        organizationId: org.id,
        userName: 'admin',
        firstName: 'System',
        lastName: 'Admin',
        contractedHours: 40,
        systemRole: 1,
        joinDate: new Date(),
        isActive: true,
        workCenterId: workCenter.id
      }
    });

    const usersData = [
      { email: 'bguerra@workload.com', firstName: 'Bruno', lastName: 'Guerra', userName: 'bguerra', skills: [{ name: 'SQL server', level: 4 }, { name: '.NET', level: 3 }] },
      { email: 'jiro@workload.com', firstName: 'Jesus', lastName: 'de IRO', userName: 'jiro', skills: [{ name: 'manual testing', level: 2 }, { name: 'Lead', level: 1 }] },
      { email: 'eoicnenev@workload.com', firstName: 'Ernesto', lastName: 'Oicnenev', userName: 'eoicnenev', skills: [{ name: 'Node.js', level: 4 }, { name: 'postgressql', level: 3 }, { name: 'Lead', level: 3 }] },
      { email: 'rperabaja@workload.com', firstName: 'Rodrigo', lastName: 'Perabaja', userName: 'rperabaja', skills: [{ name: 'Full Stack', level: 4 }, { name: 'Node.js', level: 3 }, { name: 'Vue.js', level: 2 }, { name: '.NET', level: 2 }, { name: 'TypeScript', level: 3 }] },
      { email: 'jario@workload.com', firstName: 'Javi', lastName: 'Ario', userName: 'jario', skills: [{ name: '.NET', level: 2 }, { name: 'MySQL', level: 2 }] },
      { email: 'aless@workload.com', firstName: 'Angel', lastName: 'less', userName: 'aless', skills: [{ name: 'Figma', level: 3 }, { name: 'Indesign', level: 2 }] },
      { email: 'wsulanga@workload.com', firstName: 'Wen', lastName: 'sulanga', userName: 'wsulanga', skills: [{ name: 'Node.js', level: 2 }, { name: 'Python', level: 1 }] },
      { email: 'jorg@workload.com', firstName: 'Jor', lastName: 'G', userName: 'jorg', skills: [{ name: 'Node.js', level: 3 }, { name: 'Vue.js', level: 3 }, { name: 'postgressql', level: 2 }] },
      { email: 'abraza@workload.com', firstName: 'Antuan', lastName: 'Brazano', userName: 'abraza', skills: [{ name: 'Vue.js', level: 3 }, { name: 'JavaScript', level: 2 }, { name: 'Python', level: 1 }] }
    ];

    for (const collabData of usersData) {
      const collabUser = await prisma.user.upsert({
        where: { email: collabData.email },
        update: {},
        create: {
          email: collabData.email,
          password: 'password'
        }
      });

      const collaborator = await prisma.collaborator.upsert({
        where: { userId: collabUser.id },
        update: {},
        create: {
          userName: collabData.userName,
          firstName: collabData.firstName,
          lastName: collabData.lastName,
          organizationId: org.id,
          userId: collabUser.id,
          workCenterId: workCenter.id,
          contractedHours: 40,
          joinDate: new Date(),
          isActive: true
        }
      });

      for (const skill of collabData.skills) {
        const skillRecord = await prisma.skill.findFirst({
          where: { name: skill.name, organizationId: org.id }
        });
        if (skillRecord) {
            // Find existing
          const existingSkill = await prisma.collaboratorSkill.findFirst({
              where: { collaboratorId: collaborator.id, skillId: skillRecord.id }
          })
          
          if (!existingSkill) {
               await prisma.collaboratorSkill.create({
                data: {
                  collaboratorId: collaborator.id,
                  skillId: skillRecord.id,
                  level: skill.level
                }
              });
          }
        }
      }
    }
    
    const milestoneTypes = [
        { name: 'Reunion semanal', color: '#001eff', organizationId: org.id },
        { name: 'Delivery', color: '#ff0000', organizationId: org.id }
    ];
    await prisma.milestoneType.createMany({ data: milestoneTypes, skipDuplicates: true });

    const technologies = ['PostgreSQL', 'Docker', 'AWS'].map(name => ({ name, organizationId: org.id }));
    await prisma.technology.createMany({ data: technologies, skipDuplicates: true });

    const hierarchyTypes = [
        { name: 'TL', rank: 1, organizationId: org.id },
        { name: 'PL', rank: 2, organizationId: org.id },
        { name: 'BM', rank: 3, organizationId: org.id }
    ];
    await prisma.hierarchyType.createMany({ data: hierarchyTypes, skipDuplicates: true });

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
    await prisma.workPackageStatus.createMany({ data: workPackageStatuses, skipDuplicates: true });

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
