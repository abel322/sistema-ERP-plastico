/**
 * Script de Migración: Cliente → Cliente + ProductoCliente
 * 
 * Este script migra la estructura antigua donde cada cliente tenía
 * especificaciones técnicas embebidas, a la nueva estructura donde:
 * - Cliente: Solo datos generales (nombre, RIF, contacto, etc.)
 * - ProductoCliente: Especificaciones técnicas de cada producto
 * 
 * IMPORTANTE: Ejecutar ANTES de eliminar campos del modelo Cliente
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrarClientes() {
  console.log('🚀 Iniciando migración de Clientes a ProductoCliente...\n');
  
  try {
    // 1. Obtener todos los clientes existentes usando Prisma Client
    console.log('📊 Obteniendo clientes existentes...');
    const clientesAntiguos = await prisma.cliente.findMany();
    
    console.log(`✅ Encontrados ${clientesAntiguos.length} clientes\n`);
    
    if (clientesAntiguos.length === 0) {
      console.log('ℹ️  No hay clientes para migrar');
      return;
    }
    
    // 2. Crear ProductoCliente para cada cliente
    let migrados = 0;
    let errores = 0;
    
    for (const clienteAntiguo of clientesAntiguos) {
      try {
        // Generar nombre del producto basado en especificaciones
        let nombreProducto = clienteAntiguo.producto || 'Producto Principal';
        
        // Si no tiene nombre, generar uno descriptivo
        if (!clienteAntiguo.producto) {
          const tipo = clienteAntiguo.tipoProducto || 'Producto';
          const ancho = clienteAntiguo.ancho ? `${clienteAntiguo.ancho}cm` : '';
          const largo = clienteAntiguo.largo ? `x${clienteAntiguo.largo}cm` : '';
          nombreProducto = `${tipo} ${ancho}${largo}`.trim();
        }
        
        console.log(`  Migrando: ${clienteAntiguo.nombre} - ${nombreProducto}`);
        
        // Crear ProductoCliente usando Prisma Client (maneja ENUMs automáticamente)
        await prisma.productoCliente.create({
          data: {
            clienteId: clienteAntiguo.id,
            nombreProducto: nombreProducto,
            codigoProducto: null,
            activo: true,
            
            // Especificaciones básicas
            tipoProducto: clienteAntiguo.tipoProducto,
            conImpresion: clienteAntiguo.conImpresion,
            ancho: clienteAntiguo.ancho,
            largo: clienteAntiguo.largo,
            calibre: clienteAntiguo.calibre,
            diametroAnchoBolsa: clienteAntiguo.diametroAnchoBolsa,
            pesoPorUnidad: clienteAntiguo.pesoPorUnidad,
            color: clienteAntiguo.color,
            material: clienteAntiguo.material,
            unidadVenta: clienteAntiguo.unidadVenta,
            
            // Especificaciones adicionales
            anchoBobina: clienteAntiguo.anchoBobina,
            anchoValvula: clienteAntiguo.anchoValvula,
            anchoSolapa: clienteAntiguo.anchoSolapa,
            anchoFuelle: clienteAntiguo.anchoFuelle,
            intensidadTratador: clienteAntiguo.intensidadTratador,
            pesoMaximoBobina: clienteAntiguo.pesoMaximoBobina,
            perforacion: clienteAntiguo.perforacion,
            muleteado: clienteAntiguo.muleteado,
            tipoRefilado: clienteAntiguo.tipoRefilado,
            bolsasPorRollo: clienteAntiguo.bolsasPorRollo,
            rollosPorBulto: clienteAntiguo.rollosPorBulto,
            tipoSellado: clienteAntiguo.tipoSellado,
            tipoSelladoEstructura: clienteAntiguo.tipoSelladoEstructura,
            repeticionesImagen: clienteAntiguo.repeticionesImagen,
            tipoBobinaCliente: clienteAntiguo.tipoBobinaCliente,
            laminaRebobinadorAncho: clienteAntiguo.laminaRebobinadorAncho,
            laminaRebobinadorCalibre: clienteAntiguo.laminaRebobinadorCalibre,
            
            // Formulación
            formFB7000: clienteAntiguo.formFB7000,
            form3003: clienteAntiguo.form3003,
            formLineal: clienteAntiguo.formLineal,
            form0240: clienteAntiguo.form0240,
            form0348: clienteAntiguo.form0348,
            form7000F: clienteAntiguo.form7000F,
            formDeslizante: clienteAntiguo.formDeslizante,
            formMasterbachBlanco: clienteAntiguo.formMasterbachBlanco,
            formMasterbachNegro: clienteAntiguo.formMasterbachNegro,
            formMasterbachAzul: clienteAntiguo.formMasterbachAzul,
            formMasterbachAmarillo: clienteAntiguo.formMasterbachAmarillo,
            
            // Serigrafía
            color1: clienteAntiguo.color1,
            color2: clienteAntiguo.color2,
            color3: clienteAntiguo.color3,
            color4: clienteAntiguo.color4,
            color5: clienteAntiguo.color5,
            color6: clienteAntiguo.color6,
            cilindro: clienteAntiguo.cilindro,
            tipoImpresion: clienteAntiguo.tipoImpresion,
            serigrafiaTratadorIntensidad: clienteAntiguo.serigrafiaTratadorIntensidad,
            
            // Parámetros de Extrusión
            extTemperaturaAmbiente: clienteAntiguo.extTemperaturaAmbiente,
            extMotorPrincipal: clienteAntiguo.extMotorPrincipal,
            extTraccion: clienteAntiguo.extTraccion,
            extSopladorPrincipal: clienteAntiguo.extSopladorPrincipal,
            extAberturaBlower: clienteAntiguo.extAberturaBlower,
            extCuelloGlobo: clienteAntiguo.extCuelloGlobo,
            extTemperaturaCuelloGlobo: clienteAntiguo.extTemperaturaCuelloGlobo,
            extTraccionRebobinador: clienteAntiguo.extTraccionRebobinador,
            extRebobinadorWinding1: clienteAntiguo.extRebobinadorWinding1,
            extRebobinadorWinding2: clienteAntiguo.extRebobinadorWinding2,
            extIntensidadTratador: clienteAntiguo.extIntensidadTratador,
            extTemperaturaZ1: clienteAntiguo.extTemperaturaZ1,
            extTemperaturaZ2: clienteAntiguo.extTemperaturaZ2,
            extTemperaturaZ3: clienteAntiguo.extTemperaturaZ3,
            extTemperaturaZ4: clienteAntiguo.extTemperaturaZ4,
            extTemperaturaZ5: clienteAntiguo.extTemperaturaZ5,
            extTemperaturaZ6: clienteAntiguo.extTemperaturaZ6,
            extTemperaturaZ7: clienteAntiguo.extTemperaturaZ7,
            extTemperaturaZ8: clienteAntiguo.extTemperaturaZ8,
            extTemperaturaZ9: clienteAntiguo.extTemperaturaZ9,
            extTemperaturaZ10: clienteAntiguo.extTemperaturaZ10,
            extTemperaturaZ11: clienteAntiguo.extTemperaturaZ11,
            extTemperaturaZ12: clienteAntiguo.extTemperaturaZ12,
            extTemperaturaZ13: clienteAntiguo.extTemperaturaZ13,
            extTemperaturaZ14: clienteAntiguo.extTemperaturaZ14,
            extTemperaturaZ15: clienteAntiguo.extTemperaturaZ15,
            extTemperaturaZ16: clienteAntiguo.extTemperaturaZ16,
            extTemperaturaZ17: clienteAntiguo.extTemperaturaZ17,
            extTemperaturaZ18: clienteAntiguo.extTemperaturaZ18,
            extTemperaturaZ19: clienteAntiguo.extTemperaturaZ19,
            extTemperaturaZ20: clienteAntiguo.extTemperaturaZ20,
            extOrientacionFlujoBlower: clienteAntiguo.extOrientacionFlujoBlower,
            
            // Parámetros de Sellado
            sldTipoSelladora: clienteAntiguo.sldTipoSelladora,
            sldCapacidadBolsa: clienteAntiguo.sldCapacidadBolsa,
            sldTemperaturaAmbiente: clienteAntiguo.sldTemperaturaAmbiente,
            sldTornilloEsparrago: clienteAntiguo.sldTornilloEsparrago,
            sldTempSuperior: clienteAntiguo.sldTempSuperior,
            sldTempInferior: clienteAntiguo.sldTempInferior,
            sldTempValvula: clienteAntiguo.sldTempValvula,
            sldPresellado_A: clienteAntiguo.sldPresellado_A,
            sldPresellado_B: clienteAntiguo.sldPresellado_B,
            sldTiempoLimite: clienteAntiguo.sldTiempoLimite,
            sldMicroperforaciones: clienteAntiguo.sldMicroperforaciones,
            sldMuleteado: clienteAntiguo.sldMuleteado,
            sldTempSuperiorLineaA: clienteAntiguo.sldTempSuperiorLineaA,
            sldTempInferiorLineaA: clienteAntiguo.sldTempInferiorLineaA,
            sldTempSuperiorLineaB: clienteAntiguo.sldTempSuperiorLineaB,
            sldTempInferiorLineaB: clienteAntiguo.sldTempInferiorLineaB,
            sldTempTroquel: clienteAntiguo.sldTempTroquel,
            sldTempSuperiorRecta: clienteAntiguo.sldTempSuperiorRecta,
            sldTempSuperiorCurva: clienteAntiguo.sldTempSuperiorCurva,
            sldTempCuchilla: clienteAntiguo.sldTempCuchilla,
            sldRodilloAnchoValvula: clienteAntiguo.sldRodilloAnchoValvula,
            sldGPM: clienteAntiguo.sldGPM,
            sldVelocidadTransportador: clienteAntiguo.sldVelocidadTransportador,
            sldCicloTrabajo: clienteAntiguo.sldCicloTrabajo,
            sldPresionVentosa: clienteAntiguo.sldPresionVentosa,
            sldTensionPrincipal: clienteAntiguo.sldTensionPrincipal,
            sldPresionBalancin1: clienteAntiguo.sldPresionBalancin1,
            sldPresionBalancin2: clienteAntiguo.sldPresionBalancin2,
            sldPresionBalancin3: clienteAntiguo.sldPresionBalancin3,
            sldPresionBalancinA1: clienteAntiguo.sldPresionBalancinA1,
            sldPresionBalancinA2: clienteAntiguo.sldPresionBalancinA2,
            sldPresionBalancinA3: clienteAntiguo.sldPresionBalancinA3,
            sldPresionBalancinA4: clienteAntiguo.sldPresionBalancinA4,
            sldPresionBalancinB1: clienteAntiguo.sldPresionBalancinB1,
            sldPresionBalancinB2: clienteAntiguo.sldPresionBalancinB2,
            sldPresionBalancinB3: clienteAntiguo.sldPresionBalancinB3,
            sldPresionBalancinB4: clienteAntiguo.sldPresionBalancinB4,
            sldAlturaCabezalExtDerecho: clienteAntiguo.sldAlturaCabezalExtDerecho,
            sldAlturaCabezalExtIzquierdo: clienteAntiguo.sldAlturaCabezalExtIzquierdo,
            sldBandaTransportadora: clienteAntiguo.sldBandaTransportadora,
            sldMedidaPortabobina: clienteAntiguo.sldMedidaPortabobina,
            sldAjusteSensorFail: clienteAntiguo.sldAjusteSensorFail,
            sldPresionSopladoArriba: clienteAntiguo.sldPresionSopladoArriba,
            sldPresionSopladoAbajo: clienteAntiguo.sldPresionSopladoAbajo,
            sldPresionRodilloServoL: clienteAntiguo.sldPresionRodilloServoL,
            sldPresionRodilloServoR: clienteAntiguo.sldPresionRodilloServoR,
            sldSoplarInicio: clienteAntiguo.sldSoplarInicio,
            sldSoplarTerminar: clienteAntiguo.sldSoplarTerminar,
            sldSiliconaInicioVentoza: clienteAntiguo.sldSiliconaInicioVentoza,
            sldSiliconaTerminarVentoza: clienteAntiguo.sldSiliconaTerminarVentoza,
          }
        });
        
        migrados++;
        console.log(`    ✅ Migrado exitosamente`);
        
      } catch (error) {
        errores++;
        console.error(`    ❌ Error migrando ${clienteAntiguo.nombre}:`, error);
      }
    }
    
    console.log(`\n📊 Resumen de migración:`);
    console.log(`   ✅ Migrados exitosamente: ${migrados}`);
    console.log(`   ❌ Errores: ${errores}`);
    console.log(`   📦 Total procesados: ${clientesAntiguos.length}\n`);
    
    if (migrados === clientesAntiguos.length) {
      console.log('🎉 ¡Migración completada exitosamente!');
      console.log('\n⚠️  SIGUIENTE PASO:');
      console.log('   1. Verificar que los datos en ProductoCliente sean correctos');
      console.log('   2. Actualizar las referencias en Pedidos, Producción, etc.');
      console.log('   3. Aplicar el schema final que elimina campos de Cliente\n');
    } else {
      console.log('⚠️  Hubo errores en la migración. Revisar antes de continuar.\n');
    }
    
  } catch (error) {
    console.error('❌ Error fatal en la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar migración
migrarClientes()
  .then(() => {
    console.log('✅ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script falló:', error);
    process.exit(1);
  });
