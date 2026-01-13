import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

dotenv.config()
const { Pool } = pg

const connectionString = process.env.POOL_DATABASE_URL || process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Starting RASCI Verification...')

  try {
    const org = await prisma.organization.create({
      data: { 
          name: 'Test Org RASCI ' + Date.now(),
          tag: 'ORG_' + Math.floor(Math.random() * 100000)
      }
    })
    console.log('Created Org:', org.id)

    const proj = await prisma.project.create({
      data: { name: 'Test Project RASCI', organizationId: org.id, contractedHours: 100 }
    })
    console.log('Created Project:', proj.id)

    const collab = await prisma.collaborator.create({
        data: {
            userName: 'rasciUser_' + Date.now(),
            organization: { connect: { id: org.id } },
            contractedHours: 40,
            user: {
                create: {
                    email: 'rasci_' + Date.now() + '@test.com',
                    password: 'password123'
                }
            }
        }
    })
    
    const role = await prisma.role.create({ data: { name: 'Dev', organizationId: org.id }})

    const alloc = await prisma.allocation.create({
        data: {
            projectId: proj.id,
            collaboratorId: collab.id,
            dedicationPercentage: 100,
            startWeek: '2025-01',
            roles: { create: { roleId: role.id } }
        }
    })
    console.log('Created Allocation:', alloc.id)

    const wp = await prisma.workPackage.create({
        data: {
            name: 'WP1',
            projectId: proj.id
        }
    })
    console.log('Created WP:', wp.id)

    const resp = await prisma.responsibility.create({
        data: {
            projectId: proj.id,
            allocationId: alloc.id,
            workPackageId: wp.id,
            role: 'RESPONSIBLE'
        }
    })
    console.log('Created Responsibility:', resp)

    const projCheck = await prisma.project.findUnique({
        where: { id: proj.id },
        include: { responsibilities: true }
    })
    
    if (projCheck.responsibilities.length > 0 && projCheck.responsibilities[0].role === 'RESPONSIBLE') {
        console.log('SUCCESS: Responsibility found on Project.')
    } else {
        console.error('FAILURE: Responsibility not found on Project.')
    }

    // 7. Verify relation via Allocation
    const allocCheck = await prisma.allocation.findUnique({
        where: { id: alloc.id },
        include: { responsibilities: true }
    })
    console.log('Checks on Allocation:', allocCheck.responsibilities.length)

    // Clean up
    await prisma.project.delete({ where: { id: proj.id } }) // Cascade should delete Resp and Alloc
    await prisma.organization.delete({ where: { id: org.id } })
    console.log('Cleanup complete.')

  } catch (e) {
    console.error(e)
    process.exit(1)
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
  })
