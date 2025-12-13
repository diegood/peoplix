
import 'dotenv/config'
import pkg from '@prisma/client'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const { PrismaClient } = pkg
const { Pool } = pg

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

async function main() {
    const types = [
        { name: 'TL', color: 'bg-blue-100 text-blue-700 border-blue-200', rank: 1 },
        { name: 'PL', color: 'bg-purple-100 text-purple-700 border-purple-200', rank: 2 },
        { name: 'SP', color: 'bg-orange-100 text-orange-700 border-orange-200', rank: 3 }
    ]

    for (const t of types) {
        await prisma.hierarchyType.upsert({
            where: { name: t.name },
            update: {},
            create: t
        })
    }
    console.log('Seeded default hierarchy types')
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
