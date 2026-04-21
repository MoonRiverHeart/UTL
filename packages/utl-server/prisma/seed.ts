import bcrypt from 'bcryptjs';
import prisma from '../src/db/client';

async function main() {
  const testPasswordHash = await bcrypt.hash('test123', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  const testUser = await prisma.user.upsert({
    where: { username: 'test' },
    update: {},
    create: {
      username: 'test',
      passwordHash: testPasswordHash,
      email: 'test@example.com',
      role: 'user',
    },
  });

  console.log('Created test user:', { username: 'test', password: 'test123', role: 'user' });

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPasswordHash,
      email: 'admin@example.com',
      role: 'admin',
    },
  });

  console.log('Created admin user:', { username: 'admin', password: 'admin123', role: 'admin' });

  const workspace = await prisma.workspace.upsert({
    where: { id: 'default-workspace' },
    update: {},
    create: {
      id: 'default-workspace',
      name: '默认工作区',
      ownerId: testUser.id,
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