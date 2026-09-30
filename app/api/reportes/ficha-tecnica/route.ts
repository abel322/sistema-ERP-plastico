import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productoId = searchParams.get('productoId');

    if (!productoId) {
      return NextResponse.json({ error: 'ID de producto requerido' }, { status: 400 });
    }

    const producto = await prisma.productoCliente.findUnique({
      where: { id: productoId },
      include: {
        cliente: true,
        peletizado: true,
        parametrosSellado: {
          orderBy: { turno: 'asc' },
        },
      },
    });

    if (!producto) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    const formato = searchParams.get('formato');

    if (formato === 'csv') {
      const regDia: any = producto.parametrosSellado?.find(p => p.turno === 'DIA') || producto;
      const regTarde: any = producto.parametrosSellado?.find(p => p.turno === 'TARDE') || regDia;

      const headers = ['Sección', 'Parámetro', 'Valor'];
      const rows: string[][] = [
        // SECCIÓN 1: Identificación y Datos Generales
        ['GENERAL', 'Nombre Producto', producto.nombreProducto],
        ['GENERAL', 'Código Producto', producto.codigoProducto || 'N/A'],
        ['GENERAL', 'Cliente', producto.cliente?.nombre || 'N/A'],
        ['GENERAL', 'RIF Cliente', producto.cliente?.rif || 'N/A'],
        ['GENERAL', 'Tipo Producto', producto.tipoProducto],
        ['GENERAL', 'Tipo Bolsa', producto.tipoBolsa || '-'],
        ['GENERAL', 'Material Base', producto.material || 'N/A'],
        ['GENERAL', 'Unidad de Venta', producto.unidadVenta],
        ['GENERAL', 'Ancho (cm)', String(producto.ancho ?? '-')],
        ['GENERAL', 'Largo (cm)', String(producto.largo ?? '-')],
        ['GENERAL', 'Calibre (µ)', String(producto.calibre ?? '-')],
        ['GENERAL', 'Fuelle (cm)', String(producto.anchoFuelle ?? producto.fuelleASA ?? '-')],
        ['GENERAL', 'Peso Unitario (g)', String(producto.pesoPorUnidad ?? '-')],
        ['GENERAL', 'Lleva Impresión', producto.conImpresion ? 'SÍ' : 'NO'],
        ['GENERAL', 'Lleva Pigmento', producto.conPigmento ? 'SÍ' : 'NO'],
        ['GENERAL', 'Lleva Postizo', producto.llevaPostizo ? 'SÍ' : 'NO'],

        // SECCIÓN 2: Formulación (Tolva)
        ['FORMULACION', 'Molido (%)', String(producto.molido ?? 0)],
        ['FORMULACION', 'Peletizado Nombre', producto.peletizado?.nombre || '-'],
        ['FORMULACION', 'Peletizado (%)', String(producto.peletizadoPorcentaje ?? 0)],
        ['FORMULACION', 'FB7000 (%)', String(producto.formFB7000 ?? '-')],
        ['FORMULACION', '3003 (%)', String(producto.form3003 ?? '-')],
        ['FORMULACION', 'Lineal (%)', String(producto.formLineal ?? '-')],
        ['FORMULACION', '0240 (%)', String(producto.form0240 ?? '-')],
        ['FORMULACION', '0348 (%)', String(producto.form0348 ?? '-')],
        ['FORMULACION', '7000F (%)', String(producto.form7000F ?? '-')],
        ['FORMULACION', 'Deslizante (%)', String(producto.formDeslizante ?? '-')],
        ['FORMULACION', 'Masterbatch Blanco (%)', String(producto.formMasterbachBlanco ?? '-')],
        ['FORMULACION', 'Masterbatch Negro (%)', String(producto.formMasterbachNegro ?? '-')],
        ['FORMULACION', 'Masterbatch Azul (%)', String(producto.formMasterbachAzul ?? '-')],
        ['FORMULACION', 'Masterbatch Amarillo (%)', String(producto.formMasterbachAmarillo ?? '-')],

        // SECCIÓN 3: Extrusión
        ['EXTRUSION', 'Máquina Extrusora', String(producto.extMaquinaExtrusora ?? '-')],
        ['EXTRUSION', 'Diámetro Cabezal (mm)', String(producto.extDiametroCabezal ?? '-')],
        ['EXTRUSION', 'Ancho Bobina (cm)', String(producto.anchoBobina ?? '-')],
        ['EXTRUSION', 'Temp. Ambiente (°C)', String(producto.extTemperaturaAmbiente ?? '-')],
        ['EXTRUSION', 'Motor Principal', String(producto.extMotorPrincipal ?? '-')],
        ['EXTRUSION', 'Tracción', String(producto.extTraccion ?? '-')],
        ['EXTRUSION', 'Soplador Principal', String(producto.extSopladorPrincipal ?? '-')],
        ['EXTRUSION', 'Abertura Blower', String(producto.extAberturaBlower ?? '-')],
        ['EXTRUSION', 'Cuello Globo', String(producto.extCuelloGlobo ?? '-')],
        ['EXTRUSION', 'Temp. Cuello Globo (°C)', String(producto.extTemperaturaCuelloGlobo ?? '-')],
        ['EXTRUSION', 'Tracción Rebobinador', String(producto.extTraccionRebobinador ?? '-')],
        ['EXTRUSION', 'Winding 1', String(producto.extRebobinadorWinding1 ?? '-')],
        ['EXTRUSION', 'Winding 2', String(producto.extRebobinadorWinding2 ?? '-')],
        ['EXTRUSION', 'Intensidad Tratador', String(producto.extIntensidadTratador ?? producto.intensidadTratador ?? '-')],
        ['EXTRUSION', 'Flujo Blower', String(producto.extOrientacionFlujoBlower ?? '-')],
        ['EXTRUSION', 'Flujo Blower Interno', String(producto.extOrientacionFlujoBlowerInterno ?? '-')],
        ['EXTRUSION', 'Flujo Blower Externo', String(producto.extOrientacionFlujoBlowerExterno ?? '-')],
        ...Array.from({ length: 20 }, (_, i) => [
          'EXTRUSION_TEMPS',
          `Temperatura Zona ${i + 1} (°C)`,
          String((producto as any)[`extTemperaturaZ${i + 1}`] ?? '-'),
        ]),

        // SECCIÓN 3: Serigrafía
        ['SERIGRAFIA', 'Tipo Impresión', producto.tipoImpresion || '-'],
        ['SERIGRAFIA', 'Cilindro (cm)', producto.cilindro || '-'],
        ['SERIGRAFIA', 'Repeticiones Imagen', String(producto.repeticionesImagen ?? '-')],
        ['SERIGRAFIA', 'Tratador Serigrafía', String(producto.serigrafiaTratadorIntensidad ?? '-')],
        ['SERIGRAFIA', 'Color 1', producto.color1 || '-'],
        ['SERIGRAFIA', 'Color 2', producto.color2 || '-'],
        ['SERIGRAFIA', 'Color 3', producto.color3 || '-'],
        ['SERIGRAFIA', 'Color 4', producto.color4 || '-'],
        ['SERIGRAFIA', 'Color 5', producto.color5 || '-'],
        ['SERIGRAFIA', 'Color 6', producto.color6 || '-'],

        // SECCIÓN 4: Sellado Día y Tarde
        ['SELLADO_DIA', 'Temperatura Superior (°C)', String(regDia.temperaturaSuperior ?? regDia.sldTempSuperior ?? '-')],
        ['SELLADO_DIA', 'Temperatura Inferior (°C)', String(regDia.temperaturaInferior ?? regDia.sldTempInferior ?? '-')],
        ['SELLADO_DIA', 'Temperatura Válvula (°C)', String(regDia.temperaturaValvula ?? regDia.sldTempValvula ?? '-')],
        ['SELLADO_DIA', 'Temperatura Cuchilla (°C)', String(regDia.temperaturaCuchilla ?? regDia.sldTempCuchilla ?? '-')],
        ['SELLADO_DIA', 'Presellado A (°C)', String(regDia.preselladoA ?? regDia.sldPresellado_A ?? '-')],
        ['SELLADO_DIA', 'Presellado B (°C)', String(regDia.preselladoB ?? regDia.sldPresellado_B ?? '-')],
        ['SELLADO_DIA', 'Temperatura Ambiente (°C)', String(regDia.temperaturaAmbiente ?? regDia.sldTemperaturaAmbiente ?? '-')],
        ['SELLADO_DIA', 'Tiempo Límite / Soldador (ms)', String(regDia.tiempoLimite ?? regDia.sldTiempoLimite ?? '-')],
        ['SELLADO_DIA', 'Microperforaciones', String(regDia.microperforaciones ?? regDia.sldMicroperforaciones ?? '-')],
        ['SELLADO_DIA', 'Muleteado', String(regDia.muleteado ?? regDia.sldMuleteado ?? '-')],
        ['SELLADO_DIA', 'Presión Troquel Válvula (PSI)', String(regDia.presionTroquelValvula ?? regDia.sldPresionTroquelValvula ?? '-')],
        ['SELLADO_DIA', 'Velocidad (GPM)', String(regDia.gpm ?? regDia.sldGPM ?? '-')],
        ['SELLADO_DIA', 'Ciclo de Trabajo (%)', String(regDia.cicloTrabajo ?? regDia.sldCicloTrabajo ?? '-')],
        ['SELLADO_DIA', 'Velocidad Transportador (cm)', String(regDia.velocidadTransportador ?? regDia.sldVelocidadTransportador ?? '-')],
        ['SELLADO_DIA', 'Rodillo Ancho Válvula (cm)', String(regDia.rodilloAnchoValvula ?? regDia.sldRodilloAnchoValvula ?? '-')],
        ['SELLADO_DIA', 'Presión Balancín 1 (bar)', String(regDia.presionBalancin1 ?? regDia.sldPresionBalancin1 ?? '-')],
        ['SELLADO_DIA', 'Presión Balancín 2 (bar)', String(regDia.presionBalancin2 ?? regDia.sldPresionBalancin2 ?? '-')],
        ['SELLADO_DIA', 'Presión Balancín 3 (bar)', String(regDia.presionBalancin3 ?? regDia.sldPresionBalancin3 ?? '-')],
        ['SELLADO_DIA', 'Soplar Inicio', String(regDia.soplarInicio ?? regDia.sldSoplarInicio ?? '-')],
        ['SELLADO_DIA', 'Soplar Terminar', String(regDia.soplarTerminar ?? regDia.sldSoplarTerminar ?? '-')],

        ['SELLADO_TARDE', 'Temperatura Superior (°C)', String(regTarde.temperaturaSuperior ?? regTarde.sldTempSuperior ?? '-')],
        ['SELLADO_TARDE', 'Temperatura Inferior (°C)', String(regTarde.temperaturaInferior ?? regTarde.sldTempInferior ?? '-')],
        ['SELLADO_TARDE', 'Temperatura Válvula (°C)', String(regTarde.temperaturaValvula ?? regTarde.sldTempValvula ?? '-')],
        ['SELLADO_TARDE', 'Temperatura Cuchilla (°C)', String(regTarde.temperaturaCuchilla ?? regTarde.sldTempCuchilla ?? '-')],
        ['SELLADO_TARDE', 'Presellado A (°C)', String(regTarde.preselladoA ?? regTarde.sldPresellado_A ?? '-')],
        ['SELLADO_TARDE', 'Presellado B (°C)', String(regTarde.preselladoB ?? regTarde.sldPresellado_B ?? '-')],
        ['SELLADO_TARDE', 'Temperatura Ambiente (°C)', String(regTarde.temperaturaAmbiente ?? regTarde.sldTemperaturaAmbiente ?? '-')],
        ['SELLADO_TARDE', 'Tiempo Límite / Soldador (ms)', String(regTarde.tiempoLimite ?? regTarde.sldTiempoLimite ?? '-')],
        ['SELLADO_TARDE', 'Microperforaciones', String(regTarde.microperforaciones ?? regTarde.sldMicroperforaciones ?? '-')],
        ['SELLADO_TARDE', 'Muleteado', String(regTarde.muleteado ?? regTarde.sldMuleteado ?? '-')],
        ['SELLADO_TARDE', 'Presión Troquel Válvula (PSI)', String(regTarde.presionTroquelValvula ?? regTarde.sldPresionTroquelValvula ?? '-')],
        ['SELLADO_TARDE', 'Velocidad (GPM)', String(regTarde.gpm ?? regTarde.sldGPM ?? '-')],
        ['SELLADO_TARDE', 'Ciclo de Trabajo (%)', String(regTarde.cicloTrabajo ?? regTarde.sldCicloTrabajo ?? '-')],
        ['SELLADO_TARDE', 'Velocidad Transportador (cm)', String(regTarde.velocidadTransportador ?? regTarde.sldVelocidadTransportador ?? '-')],
        ['SELLADO_TARDE', 'Rodillo Ancho Válvula (cm)', String(regTarde.rodilloAnchoValvula ?? regTarde.sldRodilloAnchoValvula ?? '-')],
        ['SELLADO_TARDE', 'Presión Balancín 1 (bar)', String(regTarde.presionBalancin1 ?? regTarde.sldPresionBalancin1 ?? '-')],
        ['SELLADO_TARDE', 'Presión Balancín 2 (bar)', String(regTarde.presionBalancin2 ?? regTarde.sldPresionBalancin2 ?? '-')],
        ['SELLADO_TARDE', 'Presión Balancín 3 (bar)', String(regTarde.presionBalancin3 ?? regTarde.sldPresionBalancin3 ?? '-')],
        ['SELLADO_TARDE', 'Soplar Inicio', String(regTarde.soplarInicio ?? regTarde.sldSoplarInicio ?? '-')],
        ['SELLADO_TARDE', 'Soplar Terminar', String(regTarde.soplarTerminar ?? regTarde.sldSoplarTerminar ?? '-')],

        // SECCIÓN 5: Ajustes Mecánicos y Geometría
        ['MECANICA', 'Altura Cabezal Ext. Derecho (cm)', String(regDia.alturaCabezalExtDerecho ?? producto.sldAlturaCabezalExtDerecho ?? '-')],
        ['MECANICA', 'Altura Cabezal Ext. Izquierdo (cm)', String(regDia.alturaCabezalExtIzquierdo ?? producto.sldAlturaCabezalExtIzquierdo ?? '-')],
        ['MECANICA', 'Banda Transportadora (cm)', String(regDia.bandaTransportadora ?? producto.sldBandaTransportadora ?? '-')],
        ['MECANICA', 'Medida Portabobina (cm)', String(regDia.medidaPortabobina ?? producto.sldMedidaPortabobina ?? '-')],
        ['MECANICA', 'Ajuste Sensor Fail', String(regDia.ajusteSensorFail ?? producto.sldAjusteSensorFail ?? '-')],
        ['MECANICA', 'Ancho Válvula (cm)', String(producto.anchoValvula ?? '-')],
        ['MECANICA', 'Ancho Solapa (cm)', String(producto.anchoSolapa ?? '-')],
        ['MECANICA', 'Fuelle Sup. Izquierdo (cm)', String(regDia.fuelleSuperiorIzquierdo ?? producto.fuelleSuperiorIzquierdo ?? '-')],
        ['MECANICA', 'Fuelle Sup. Derecho (cm)', String(regDia.fuelleSuperiorDerecho ?? producto.fuelleSuperiorDerecho ?? '-')],
        ['MECANICA', 'Fuelle Inf. Izquierdo (cm)', String(regDia.fuelleInferiorIzquierdo ?? producto.fuelleInferiorIzquierdo ?? '-')],
        ['MECANICA', 'Fuelle Inf. Derecho (cm)', String(regDia.fuelleInferiorDerecho ?? producto.fuelleInferiorDerecho ?? '-')],
        ['MECANICA', 'Ancho Bolsa Después Triángulo (cm)', String(regDia.anchoBolsaDespuesTriangulo ?? producto.anchoBolsaDespuesTriangulo ?? '-')],
        ['MECANICA', 'Distancia Barra Roscada Triángulo (cm)', String(regDia.distanciaBarraRoscadaTriangulo ?? producto.distanciaBarraRoscadaTriangulo ?? '-')],
        ['MECANICA', 'Longitud Bolsa (cm)', String(regDia.longitudBolsa ?? producto.longitudBolsa ?? '-')],
        ['MECANICA', 'Ángulo Alimentación Bolsa (°)', String(regDia.feedingBagAngle ?? producto.feedingBagAngle ?? '-')],
        ['MECANICA', 'Distancia Sensor Registro Color (cm)', String(regDia.distanciaSensorRegistroColor ?? producto.distanciaSensorRegistroColor ?? '-')],
        ['MECANICA', 'Distancia Sensor Movimiento (cm)', String(regDia.distanciaSensorMovimiento ?? producto.distanciaSensorMovimiento ?? '-')],
        ['MECANICA', 'Distancia Presellado (cm)', String(regDia.distanciaPresellado ?? producto.distanciaPresellado ?? '-')],
        ['MECANICA', 'Presión Soplado Arriba (bar)', String(regDia.presionSopladoArriba ?? producto.sldPresionSopladoArriba ?? '-')],
        ['MECANICA', 'Presión Soplado Abajo (bar)', String(regDia.presionSopladoAbajo ?? producto.sldPresionSopladoAbajo ?? '-')],
        ['MECANICA', 'Presión Rodillo Servo L (bar)', String(regDia.presionRodilloServoL ?? producto.sldPresionRodilloServoL ?? '-')],
        ['MECANICA', 'Presión Rodillo Servo R (bar)', String(regDia.presionRodilloServoR ?? producto.sldPresionRodilloServoR ?? '-')],
        ['MECANICA', 'Tornillo Espárrago', String(regDia.tornilloEsparrago ?? producto.sldTornilloEsparrago ?? '-')],
        ['MECANICA', 'Tornillo Amortiguador Cabezal A', String(regDia.tornilloAmortiguadorCabezalA ?? producto.tornilloAmortiguadorCabezalA ?? '-')],
        ['MECANICA', 'Tornillo Amortiguador Cabezal B', String(regDia.tornilloAmortiguadorCabezalB ?? producto.tornilloAmortiguadorCabezalB ?? '-')],
        ['MECANICA', 'Tornillo Amortiguador Cabezal C', String(regDia.tornilloAmortiguadorCabezalC ?? producto.tornilloAmortiguadorCabezalC ?? '-')],
        ['MECANICA', 'Tornillo Der Mov Horiz Cabezal Der', String(regDia.tornilloDerMovHorizCabezalDer ?? producto.tornilloDerMovHorizCabezalDer ?? '-')],
        ['MECANICA', 'Tornillo Izq Mov Horiz Cabezal Der', String(regDia.tornilloIzqMovHorizCabezalDer ?? producto.tornilloIzqMovHorizCabezalDer ?? '-')],
        ['MECANICA', 'Tornillo Der Mov Horiz Cabezal Izq', String(regDia.tornilloDerMovHorizCabezalIzq ?? producto.tornilloDerMovHorizCabezalIzq ?? '-')],
        ['MECANICA', 'Tornillo Izq Mov Horiz Cabezal Izq', String(regDia.tornilloIzqMovHorizCabezalIzq ?? producto.tornilloIzqMovHorizCabezalIzq ?? '-')],
      ];

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename=ficha_tecnica_${producto.codigoProducto || productoId}.csv`,
        },
      });
    }

    return NextResponse.json(producto);
  } catch (error) {
    console.error('Error al obtener datos para ficha técnica:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos' },
      { status: 500 }
    );
  }
}
