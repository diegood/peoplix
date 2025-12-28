
import { prisma } from './src/infrastructure/database/client.js';

async function main() {
  console.log('Testing Prisma Client...');
  try {
    // Check if we can allow 'userName' in where
    const user = await prisma.collaborator.findFirst({
      where: { userName: 'admin' }
    });
    console.log('Success! Found user:', user);
  } catch (error) {
    console.error('Error in debug script:', error.message);
    
    // Introspection (hacky way to check dmmf or properties if available, 
    // but message usually tells us enough)
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
