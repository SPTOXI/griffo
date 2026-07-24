const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const configs = await prisma.systemConfig.findMany();
  console.log('--- SYSTEM CONFIGS ---');
  configs.forEach(c => console.log(c.key, '=', c.value));
  console.log('----------------------');
}

main().catch(console.error).finally(() => prisma.$disconnect());
