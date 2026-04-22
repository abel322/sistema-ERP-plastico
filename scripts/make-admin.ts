import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Por favor proporciona un email');
    console.log('Uso: npm run make-admin <email>');
    process.exit(1);
  }

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { rol: 'admin' },
    });

    console.log('✅ Usuario actualizado a administrador:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Nombre: ${user.nombre}`);
    console.log(`   Rol: ${user.rol}`);
  } catch (error) {
    console.error('❌ Error al actualizar usuario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();
