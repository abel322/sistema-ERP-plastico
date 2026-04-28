import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Iniciando limpieza de base de datos ---')

    // El orden es importante debido a las relaciones (Foreign Keys)
    // Primero las tablas que dependen de otras (las que tienen las FKs)

    const tables = [
        'LogActividad',
        'SesionUsuario',
        'Notificacion',
        'ConfiguracionNotificacion',
        'DetalleFactura',
        'Factura',
        'DetalleOrdenCompra',
        'OrdenCompra',
        'NoConformidad',
        'ResultadoParametro',
        'InspeccionCalidad',
        'ParametroCalidad',
        'Muestra',
        'MejoraContinua',
        'Mantenimiento',
        'MovimientoInventario',
        'Inventario',
        'Peletizado',
        'RegistroProduccion',
        'Despacho',
        'ProductoTerminado',
        'Produccion',
        'Pedido',
        'Maquina',
        'Proveedor',
        'Cliente',
    ]

    for (const table of tables) {
        try {
            // @ts-ignore - Prisma no siempre reconoce los nombres de las tablas dinámicamente
            const count = await prisma[table.charAt(0).toLowerCase() + table.slice(1)].deleteMany({})
            console.log(`✓ Tabla ${table} limpiada (${count.count} registros eliminados)`)
        } catch (error: any) {
            console.error(`✗ Error limpiando tabla ${table}:`, error.message)
        }
    }

    console.log('--- Limpieza completada con éxito ---')
    console.log('Se han conservado las tablas: User, Account, Session, VerificationToken')
}

main()
    .catch((e) => {
        console.error('Error durante la ejecución:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
