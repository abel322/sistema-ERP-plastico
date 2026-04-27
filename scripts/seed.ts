import { PrismaClient, Rol, TipoProducto, UnidadVenta, EstadoPedido, Prioridad } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Limpiar datos existentes
  await prisma.pedido.deleteMany({});
  await prisma.cliente.deleteMany({});
  await prisma.user.deleteMany({});

  // Crear usuario admin de prueba
  const hashedPassword = await bcrypt.hash('johndoe123', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'john@doe.com',
      password: hashedPassword,
      nombre: 'Admin Usuario',
      rol: Rol.admin,
    },
  });
  console.log('✅ Usuario admin creado:', adminUser.email);

  // Crear usuario regular de prueba
  const usuarioPassword = await bcrypt.hash('usuario123', 10);
  const regularUser = await prisma.user.create({
    data: {
      email: 'usuario@empresa.com',
      password: usuarioPassword,
      nombre: 'Usuario Regular',
      rol: Rol.usuario,
    },
  });
  console.log('✅ Usuario regular creado:', regularUser.email);

  // Crear 5 clientes de ejemplo
  const clientes = await Promise.all([
    prisma.cliente.create({
      data: {
        nombre: 'Supermercados El Ahorro',
        rif: 'J-12345678-9',
        contacto: 'María González',
        telefono: '0212-555-1234',
        email: 'compras@elahorro.com',
        direccion: 'Av. Principal, Caracas, Venezuela',
        tipoProducto: TipoProducto.Bolsa,
        ancho: 30,
        largo: 40,
        calibre: 15,
        pesoPorUnidad: 0.025,
        color: 'Transparente',
        material: 'PEBD',
        unidadVenta: UnidadVenta.Unidades,
        observaciones: 'Cliente frecuente, pedidos semanales',
      },
    }),
    prisma.cliente.create({
      data: {
        nombre: 'Distribuidora Comercial La Estrella',
        rif: 'J-98765432-1',
        contacto: 'Carlos Ramírez',
        telefono: '0424-777-8899',
        email: 'ventas@laestrella.com',
        direccion: 'Zona Industrial Los Ruices, Caracas',
        tipoProducto: TipoProducto.Bobina,
        ancho: 60,
        largo: 100,
        calibre: 20,
        pesoPorUnidad: 2.5,
        color: 'Negro',
        material: 'PEAD',
        unidadVenta: UnidadVenta.Kilogramos,
        observaciones: 'Requiere factura con IVA',
      },
    }),
    prisma.cliente.create({
      data: {
        nombre: 'Panadería y Pastelería San José',
        rif: 'J-55566677-8',
        contacto: 'Ana Pérez',
        telefono: '0212-333-4567',
        email: 'contacto@sanjose.com',
        direccion: 'Calle Principal, La Candelaria, Caracas',
        tipoProducto: TipoProducto.Bolsa,
        ancho: 20,
        largo: 30,
        calibre: 10,
        pesoPorUnidad: 0.015,
        color: 'Blanco',
        material: 'PP',
        unidadVenta: UnidadVenta.Unidades,
        observaciones: 'Pedidos mensuales, pago de contado',
      },
    }),
    prisma.cliente.create({
      data: {
        nombre: 'Industrias Textiles del Centro',
        rif: 'J-11122233-4',
        contacto: 'Luis Hernández',
        telefono: '0243-888-9900',
        email: 'compras@textilcentro.com',
        direccion: 'Zona Industrial, Valencia, Carabobo',
        tipoProducto: TipoProducto.Bobina,
        ancho: 80,
        largo: 150,
        calibre: 25,
        pesoPorUnidad: 4.0,
        color: 'Azul',
        material: 'PEBD',
        unidadVenta: UnidadVenta.Metros,
        observaciones: 'Cliente corporativo, crédito 30 días',
      },
    }),
    prisma.cliente.create({
      data: {
        nombre: 'Farmacia y Droguería La Salud',
        rif: 'J-44455566-7',
        contacto: 'Patricia Morales',
        telefono: '0212-666-7788',
        email: 'administracion@lasalud.com',
        direccion: 'Centro Comercial Plaza Venezuela, Caracas',
        tipoProducto: TipoProducto.Bolsa,
        ancho: 25,
        largo: 35,
        calibre: 12,
        pesoPorUnidad: 0.02,
        color: 'Verde',
        material: 'PEAD',
        unidadVenta: UnidadVenta.Unidades,
        observaciones: 'Requiere logo impreso, pedidos quincenales',
      },
    }),
  ]);
  console.log('✅ 5 clientes creados');

  // Crear 10 pedidos de ejemplo con diferentes estados y prioridades
  const hoy = new Date();
  const pedidos = await Promise.all([
    // Pedido urgente pendiente - fecha de entrega en 2 días
    prisma.pedido.create({
      data: {
        clienteId: clientes[0].id,
        cantidadSolicitada: 5000,
        unidad: UnidadVenta.Unidades,
        fechaPedido: new Date(hoy.getTime() - 2 * 24 * 60 * 60 * 1000),
        fechaEntrega: new Date(hoy.getTime() + 2 * 24 * 60 * 60 * 1000),
        estado: EstadoPedido.Pendiente,
        prioridad: Prioridad.Alta,
        observaciones: 'Urgente para campaña promocional',
        cantidadProducida: 0,
      },
    }),
    // Pedido en proceso con producción parcial
    prisma.pedido.create({
      data: {
        clienteId: clientes[1].id,
        cantidadSolicitada: 200,
        unidad: UnidadVenta.Kilogramos,
        fechaPedido: new Date(hoy.getTime() - 5 * 24 * 60 * 60 * 1000),
        fechaEntrega: new Date(hoy.getTime() + 10 * 24 * 60 * 60 * 1000),
        estado: EstadoPedido.EnProceso,
        prioridad: Prioridad.Media,
        observaciones: 'Ya se inició producción',
        cantidadProducida: 120,
      },
    }),
    // Pedido completado reciente
    prisma.pedido.create({
      data: {
        clienteId: clientes[2].id,
        cantidadSolicitada: 3000,
        unidad: UnidadVenta.Unidades,
        fechaPedido: new Date(hoy.getTime() - 15 * 24 * 60 * 60 * 1000),
        fechaEntrega: new Date(hoy.getTime() - 2 * 24 * 60 * 60 * 1000),
        estado: EstadoPedido.Completado,
        prioridad: Prioridad.Media,
        observaciones: 'Entregado sin novedad',
        cantidadProducida: 3000,
      },
    }),
    // Pedido pendiente con prioridad media
    prisma.pedido.create({
      data: {
        clienteId: clientes[3].id,
        cantidadSolicitada: 500,
        unidad: UnidadVenta.Metros,
        fechaPedido: new Date(hoy.getTime() - 3 * 24 * 60 * 60 * 1000),
        fechaEntrega: new Date(hoy.getTime() + 20 * 24 * 60 * 60 * 1000),
        estado: EstadoPedido.Pendiente,
        prioridad: Prioridad.Media,
        observaciones: 'Cliente prefiere entrega completa',
        cantidadProducida: 0,
      },
    }),
    // Pedido urgente en proceso
    prisma.pedido.create({
      data: {
        clienteId: clientes[4].id,
        cantidadSolicitada: 2000,
        unidad: UnidadVenta.Unidades,
        fechaPedido: new Date(hoy.getTime() - 4 * 24 * 60 * 60 * 1000),
        fechaEntrega: new Date(hoy.getTime() + 4 * 24 * 60 * 60 * 1000),
        estado: EstadoPedido.EnProceso,
        prioridad: Prioridad.Alta,
        observaciones: 'Cliente llamó para confirmar fecha',
        cantidadProducida: 800,
      },
    }),
    // Pedido pendiente baja prioridad
    prisma.pedido.create({
      data: {
        clienteId: clientes[0].id,
        cantidadSolicitada: 10000,
        unidad: UnidadVenta.Unidades,
        fechaPedido: new Date(hoy.getTime() - 1 * 24 * 60 * 60 * 1000),
        fechaEntrega: new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000),
        estado: EstadoPedido.Pendiente,
        prioridad: Prioridad.Baja,
        observaciones: 'Stock para el próximo mes',
        cantidadProducida: 0,
      },
    }),
    // Pedido completado antiguo
    prisma.pedido.create({
      data: {
        clienteId: clientes[1].id,
        cantidadSolicitada: 150,
        unidad: UnidadVenta.Kilogramos,
        fechaPedido: new Date(hoy.getTime() - 45 * 24 * 60 * 60 * 1000),
        fechaEntrega: new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000),
        estado: EstadoPedido.Completado,
        prioridad: Prioridad.Media,
        observaciones: 'Pedido regular mensual',
        cantidadProducida: 150,
      },
    }),
    // Pedido en proceso con alta prioridad
    prisma.pedido.create({
      data: {
        clienteId: clientes[3].id,
        cantidadSolicitada: 800,
        unidad: UnidadVenta.Metros,
        fechaPedido: new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000),
        fechaEntrega: new Date(hoy.getTime() + 5 * 24 * 60 * 60 * 1000),
        estado: EstadoPedido.EnProceso,
        prioridad: Prioridad.Alta,
        observaciones: 'Producción avanzando según cronograma',
        cantidadProducida: 400,
      },
    }),
    // Pedido pendiente próximo a vencer
    prisma.pedido.create({
      data: {
        clienteId: clientes[2].id,
        cantidadSolicitada: 4000,
        unidad: UnidadVenta.Unidades,
        fechaPedido: new Date(hoy.getTime() - 6 * 24 * 60 * 60 * 1000),
        fechaEntrega: new Date(hoy.getTime() + 3 * 24 * 60 * 60 * 1000),
        estado: EstadoPedido.Pendiente,
        prioridad: Prioridad.Alta,
        observaciones: 'Necesita confirmación de inicio de producción',
        cantidadProducida: 0,
      },
    }),
    // Pedido completado este mes
    prisma.pedido.create({
      data: {
        clienteId: clientes[4].id,
        cantidadSolicitada: 1500,
        unidad: UnidadVenta.Unidades,
        fechaPedido: new Date(hoy.getTime() - 20 * 24 * 60 * 60 * 1000),
        fechaEntrega: new Date(hoy.getTime() - 5 * 24 * 60 * 60 * 1000),
        estado: EstadoPedido.Completado,
        prioridad: Prioridad.Media,
        observaciones: 'Cliente satisfecho con la calidad',
        cantidadProducida: 1500,
      },
    }),
  ]);
  console.log('✅ 10 pedidos creados');

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📊 Resumen:');
  console.log(`   - ${clientes.length} clientes`);
  console.log(`   - ${pedidos.length} pedidos`);
  console.log(`   - 2 usuarios (1 admin, 1 usuario regular)`);
  console.log('\n🔐 Credenciales de prueba:');
  console.log('   Admin: john@doe.com / johndoe123');
  console.log('   Usuario: usuario@empresa.com / usuario123');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
