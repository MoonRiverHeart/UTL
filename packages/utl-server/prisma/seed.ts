import bcrypt from 'bcryptjs';
import prisma from '../src/db/client';

async function main() {
  const passwordHash = await bcrypt.hash('test123', 10);

  const user = await prisma.user.upsert({
    where: { username: 'test' },
    update: {},
    create: {
      username: 'test',
      passwordHash,
      email: 'test@example.com',
    },
  });

  console.log('Created test user:', { username: 'test', password: 'test123' });

  const workspace = await prisma.workspace.upsert({
    where: { id: 'default-workspace' },
    update: {},
    create: {
      id: 'default-workspace',
      name: '默认工作区',
      ownerId: user.id,
    },
  });

  console.log('Created default workspace:', workspace);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });