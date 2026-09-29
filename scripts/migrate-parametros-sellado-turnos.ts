import { prisma } from '../lib/db';

async function main() {
  console.log('Migrando parámetros de sellado existentes a ParametrosSellado (turno DIA)...');
  const productos = await prisma.productoCliente.findMany({
    include: {
      parametrosSellado: true,
    },
  });

  let migrados = 0;
  for (const prod of productos) {
    const tieneSellado = prod.sldTipoSelladora || prod.sldTempSuperior || prod.sldTempInferior || prod.sldTempValvula;
    const yaTieneDia = prod.parametrosSellado.some(p => p.turno === 'DIA');

    if (tieneSellado && !yaTieneDia) {
      await prisma.parametrosSellado.create({
        data: {
          productoId: prod.id,
          turno: 'DIA',
          temperaturaSuperior: prod.sldTempSuperior !== null ? Number(prod.sldTempSuperior) : null,
          temperaturaInferior: prod.sldTempInferior !== null ? Number(prod.sldTempInferior) : null,
          temperaturaValvula: prod.sldTempValvula !== null ? Number(prod.sldTempValvula) : null,
          temperaturaCuchilla: prod.sldTempCuchilla !== null ? Number(prod.sldTempCuchilla) : null,
          preselladoA: prod.sldPresellado_A !== null ? Number(prod.sldPresellado_A) : null,
          preselladoB: prod.sldPresellado_B !== null ? Number(prod.sldPresellado_B) : null,
          temperaturaAmbiente: prod.sldTemperaturaAmbiente !== null ? Number(prod.sldTemperaturaAmbiente) : null,
          tornilloEsparrago: prod.sldTornilloEsparrago !== null ? Number(prod.sldTornilloEsparrago) : null,
          capacidadBolsa: prod.sldCapacidadBolsa !== null ? Number(prod.sldCapacidadBolsa) : null,
          tiempoLimite: prod.sldTiempoLimite !== null ? Number(prod.sldTiempoLimite) : null,
          microperforaciones: prod.sldMicroperforaciones,
          muleteado: prod.sldMuleteado,
          presionTroquelValvula: prod.sldPresionTroquelValvula,
          rodilloAnchoValvula: prod.sldRodilloAnchoValvula,
          gpm: prod.sldGPM,
          velocidadTransportador: prod.sldVelocidadTransportador,
          cicloTrabajo: prod.sldCicloTrabajo,
          presionBalancin1: prod.sldPresionBalancin1,
          presionBalancin2: prod.sldPresionBalancin2,
          presionBalancin3: prod.sldPresionBalancin3,
          alturaCabezalExtDerecho: prod.sldAlturaCabezalExtDerecho,
          alturaCabezalExtIzquierdo: prod.sldAlturaCabezalExtIzquierdo,
          bandaTransportadora: prod.sldBandaTransportadora,
          medidaPortabobina: prod.sldMedidaPortabobina,
          ajusteSensorFail: prod.sldAjusteSensorFail,
          tornilloDerMovHorizCabezalDer: prod.tornilloDerMovHorizCabezalDer,
          tornilloIzqMovHorizCabezalDer: prod.tornilloIzqMovHorizCabezalDer,
          tornilloDerMovHorizCabezalIzq: prod.tornilloDerMovHorizCabezalIzq,
          tornilloIzqMovHorizCabezalIzq: prod.tornilloIzqMovHorizCabezalIzq,
          tornilloAmortiguadorCabezalA: prod.tornilloAmortiguadorCabezalA,
          tornilloAmortiguadorCabezalB: prod.tornilloAmortiguadorCabezalB,
          tornilloAmortiguadorCabezalC: prod.tornilloAmortiguadorCabezalC,
          fuelleSuperiorIzquierdo: prod.fuelleSuperiorIzquierdo,
          fuelleSuperiorDerecho: prod.fuelleSuperiorDerecho,
          fuelleInferiorIzquierdo: prod.fuelleInferiorIzquierdo,
          fuelleInferiorDerecho: prod.fuelleInferiorDerecho,
          anchoBolsaDespuesTriangulo: prod.anchoBolsaDespuesTriangulo,
          distanciaBarraRoscadaTriangulo: prod.distanciaBarraRoscadaTriangulo,
          longitudBolsa: prod.longitudBolsa,
          feedingBagAngle: prod.feedingBagAngle,
          distanciaSensorRegistroColor: prod.distanciaSensorRegistroColor,
          distanciaSensorMovimiento: prod.distanciaSensorMovimiento,
          distanciaPresellado: prod.distanciaPresellado,
          presionSopladoArriba: prod.sldPresionSopladoArriba,
          presionSopladoAbajo: prod.sldPresionSopladoAbajo,
          presionRodilloServoL: prod.sldPresionRodilloServoL,
          presionRodilloServoR: prod.sldPresionRodilloServoR,
          soplarInicio: prod.sldSoplarInicio,
          soplarTerminar: prod.sldSoplarTerminar,
          selladoSiliconaLateralIniciar: prod.selladoSiliconaLateralIniciar,
          selladoSiliconaLateralFinal: prod.selladoSiliconaLateralFinal,
          tiempoPrecalentar: prod.tiempoPrecalentar,
          temporizador: prod.temporizador,
          plancha: prod.plancha,
          montajeBobina: prod.montajeBobina,
          disenoImpresionValvula: prod.disenoImpresionValvula,
          llevaPostizo: prod.llevaPostizo,
        },
      });
      migrados++;
    }
  }

  console.log(`Migración completada. Productos migrados a turno DIA: ${migrados}`);
}

main()
  .catch((e) => {
    console.error('Error en migración:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
