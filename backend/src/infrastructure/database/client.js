import 'dotenv/config'
import pkg from '@prisma/client'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const { PrismaClient } = pkg
const { Pool } = pg

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

export const prisma = new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
    if (!prisma.collaborator) console.error('CRITICAL: prisma.collaborator is missing!')
}
