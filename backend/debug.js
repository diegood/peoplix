import 'dotenv/config';
import pkg from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import fs from 'fs';

const log = (msg) => {
    console.log(msg);
    fs.appendFileSync('debug_output.log', msg + '\n');
}

log('Starting debug script');
try {
    const { PrismaClient } = pkg;
    const { Pool } = pg;

    log('Loaded modules');
    
    const connectionString = process.env.DATABASE_URL;
    log('DATABASE_URL present: ' + (!!connectionString));
    
    if (!connectionString) {
        throw new Error('DATABASE_URL is missing');
    }

    const pool = new Pool({ connectionString });
    log('Pool created');
    
    const adapter = new PrismaPg(pool);
    log('Adapter created');
    
    const prisma = new PrismaClient({ adapter });
    log('PrismaClient created');
    
    async function main() {
        log('Connecting...');
        await prisma.$connect();
        log('Connected successfully!');
        await prisma.$disconnect();
    }
    
    main().catch(e => {
        log('Error in main: ' + e.message);
        log(e.stack);
        process.exit(1);
    });

} catch (err) {
    log('CRITICAL ERROR: ' + err.message);
    log(err.stack);
    process.exit(1);
}
