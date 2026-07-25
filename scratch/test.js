const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Classes:', await prisma.class.findMany());
  console.log('Sessions:', await prisma.academicSession.findMany());
}

main().finally(() => prisma.$disconnect());
