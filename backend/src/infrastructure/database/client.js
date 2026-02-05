import dotenv from 'dotenv'
const envFile = process.env.ENV_FILE || (process.env.NODE_ENV === 'production' ? '.env.production' : '.env')
dotenv.config({ path: envFile })
import pkg from '@prisma/client'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const { PrismaClient } = pkg

const { Pool } = pg

const connectionString = process.env.POOL_DATABASE_URL || process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

export const prisma = new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
    if (!prisma.collaborator) console.error('CRITICAL: prisma.collaborator is missing!')
}
