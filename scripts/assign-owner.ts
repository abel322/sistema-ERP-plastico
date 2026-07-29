import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignOwner() {
  const targetEmail = process.argv[2];

  try {
    let user;
    if (targetEmail) {
      user = await prisma.user.findUnique({
        where: { email: targetEmail },
      });
      if (!user) {
        console.error(`❌ No se encontró ningún usuario con el correo: ${targetEmail}`);
        process.exit(1);
      }
    } else {
      user = await prisma.user.findFirst({
        orderBy: { createdAt: 'asc' },
      });
      if (!user) {
        console.error('❌ No hay ningún usuario registrado en la base de datos.');
        process.exit(1);
      }
    }

    console.log(`\n🔑 Asignando registros históricos con userId nulo al usuario:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Nombre: ${user.nombre}`);
    console.log(`   Email: ${user.email}`);
    console.log(`-------------------------------------------------------------`);

    const targetUserId = user.id;

    const updates = [
      { name: 'Cliente', fn: () => prisma.cliente.updateMany({ where: { userId: null }, data: { userId: targetUserId } }) },
      { name: 'ProductoCliente', fn: () => prisma.productoCliente.updateMany({ where: { userId: null }, data: { userId: targetUserId } }) },
      { name: 'Pedido', fn: () => prisma.pedido.updateMany({ where: { userId: null }, data: { userId: targetUserId } }) },
      { name: 'Maquina', fn: () => prisma.maquina.updateMany({ where: { userId: null }, data: { userId: targetUserId } }) },
      { name: 'Produccion', fn: () => prisma.produccion.updateMany({ where: { userId: null }, data: { userId: targetUserId } }) },
      { name: 'Despacho', fn: () => prisma.despacho.updateMany({ where: { userId: null }, data: { userId: targetUserId } }) },
      { name: 'ProductoTerminado', fn: () => prisma.productoTerminado.updateMany({ where: { userId: null }, data: { userId: targetUserId } }) },
      { name: 'Muestra', fn: () => prisma.muestra.updateMany({ where: { userId: null }, data: { userId: targetUserId } }) },
      { name: 'Peletizado', fn: () => prisma.peletizado.updateMany({ where: { userId: null }, data: { userId: targetUserId } }) },
      { name: 'Inventario', fn: () => prisma.inventario.updateMany({ where: { userId: null }, data: { userId: targetUserId } }) },
      { name: 'Factura', fn: () => prisma.factura.updateMany({ where: { userId: null }, data: { userId: targetUserId } }) },
      { name: 'Mantenimiento', fn: () => prisma.mantenimiento.updateMany({ where: { userId: null }, data: { userId: targetUserId } }) },
      { name: 'MejoraContinua', fn: () => prisma.mejoraContinua.updateMany({ where: { userId: null }, data: { userId: targetUserId } }) },
      { name: 'Proveedor', fn: () => prisma.proveedor.updateMany({ where: { userId: null }, data: { userId: targetUserId } }) },
      { name: 'OrdenCompra', fn: () => prisma.ordenCompra.updateMany({ where: { userId: null }, data: { userId: targetUserId } }) },
      { name: 'ProductoSobrante', fn: () => prisma.productoSobrante.updateMany({ where: { userId: null }, data: { userId: targetUserId } }) },
      { name: 'ParametroCalidad', fn: () => prisma.parametroCalidad.updateMany({ where: { userId: null }, data: { userId: targetUserId } }) },
      { name: 'InspeccionCalidad', fn: () => prisma.inspeccionCalidad.updateMany({ where: { userId: null }, data: { userId: targetUserId } }) },
    ];

    for (const item of updates) {
      try {
        const res = await item.fn();
        console.log(`   ✅ ${item.name}: ${res.count} registros actualizados.`);
      } catch (err: any) {
        console.error(`   ⚠️ ${item.name}: Error al actualizar - ${err.message}`);
      }
    }

    console.log(`-------------------------------------------------------------`);
    console.log(`🎉 Migración de registros completada con éxito.\n`);

  } catch (error) {
    console.error('❌ Error general durante la asignación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignOwner();
