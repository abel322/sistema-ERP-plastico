import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener todos los productos de un cliente
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const clienteId = params.id;

    const productos = await prisma.productoCliente.findMany({
      where: { clienteId },
      orderBy: [
        { activo: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(productos);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return NextResponse.json(
      { error: 'Error al obtener productos' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo producto para un cliente
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Permitir que usuarios autenticados creen productos
    // (no se requiere rol específico)

    const clienteId = params.id;
    const body = await request.json();

    // Verificar que el cliente existe
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId }
    });

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Crear producto
    const producto = await prisma.productoCliente.create({
      data: {
        clienteId,
        // Campos básicos
        nombreProducto: body.nombreProducto,
        codigoProducto: body.codigoProducto || null,
        activo: body.activo !== undefined ? body.activo : true,
        tipoProducto: body.tipoProducto,
        conImpresion: body.conImpresion || false,
        material: body.material || null,
        unidadVenta: body.unidadVenta || 'Unidades',
        
        // Dimensiones
        ancho: body.ancho || null,
        largo: body.largo || null,
        calibre: body.calibre || null,
        anchoBobina: body.anchoBobina || null,
        diametroAnchoBolsa: body.diametroAnchoBolsa || null,
        pesoPorUnidad: body.pesoPorUnidad || null,
        
        // Campos de bolsa de pego/válvula
        anchoValvula: body.anchoValvula || null,
        anchoSolapa: body.anchoSolapa || null,
        anchoFuelle: body.anchoFuelle || null,
        
        // Atributos de sellado
        tipoSellado: body.tipoSellado || null,
        tipoSelladoEstructura: body.tipoSelladoEstructura || null,
        bolsasPorRollo: body.bolsasPorRollo || null,
        rollosPorBulto: body.rollosPorBulto || null,
        perforacion: body.perforacion || false,
        repeticionesImagen: body.repeticionesImagen || null,
        
        // Atributos de bobina
        tipoBobinaCliente: body.tipoBobinaCliente || null,
        pesoMaximoBobina: body.pesoMaximoBobina || null,
        intensidadTratador: body.intensidadTratador || null,
        tipoRefilado: (body.tipoRefilado === 'Ninguno' || !body.tipoRefilado) ? null : body.tipoRefilado,
        muleteado: body.muleteado || false,
        laminaRebobinadorAncho: body.laminaRebobinadorAncho || null,
        laminaRebobinadorCalibre: body.laminaRebobinadorCalibre || null,
        
        // Formulación
        formFB7000: body.formFB7000 || null,
        form3003: body.form3003 || null,
        formLineal: body.formLineal || null,
        form0240: body.form0240 || null,
        form0348: body.form0348 || null,
        form7000F: body.form7000F || null,
        formDeslizante: body.formDeslizante || null,
        formMasterbachBlanco: body.formMasterbachBlanco || null,
        formMasterbachNegro: body.formMasterbachNegro || null,
        formMasterbachAzul: body.formMasterbachAzul || null,
        formMasterbachAmarillo: body.formMasterbachAmarillo || null,
        
        // Serigrafía
        color1: body.color1 || null,
        color2: body.color2 || null,
        color3: body.color3 || null,
        color4: body.color4 || null,
        color5: body.color5 || null,
        color6: body.color6 || null,
        cilindro: body.cilindro || null,
        tipoImpresion: body.tipoImpresion || null,
        serigrafiaTratadorIntensidad: body.serigrafiaTratadorIntensidad || null,
        
        // Parámetros de Extrusión
        extMaquinaExtrusora: body.extMaquinaExtrusora || null,
        extTemperaturaAmbiente: body.extTemperaturaAmbiente || null,
        extMotorPrincipal: body.extMotorPrincipal || null,
        extTraccion: body.extTraccion || null,
        extSopladorPrincipal: body.extSopladorPrincipal || null,
        extAberturaBlower: body.extAberturaBlower || null,
        extCuelloGlobo: body.extCuelloGlobo || null,
        extTemperaturaCuelloGlobo: body.extTemperaturaCuelloGlobo || null,
        extTraccionRebobinador: body.extTraccionRebobinador || null,
        extRebobinadorWinding1: body.extRebobinadorWinding1 || null,
        extRebobinadorWinding2: body.extRebobinadorWinding2 || null,
        extIntensidadTratador: body.extIntensidadTratador || null,
        extOrientacionFlujoBlower: body.extOrientacionFlujoBlower || null,
        extOrientacionFlujoBlowerInterno: body.extOrientacionFlujoBlowerInterno || null,
        extOrientacionFlujoBlowerExterno: body.extOrientacionFlujoBlowerExterno || null,
        extTemperaturaZ1: body.extTemperaturaZ1 || null,
        extTemperaturaZ2: body.extTemperaturaZ2 || null,
        extTemperaturaZ3: body.extTemperaturaZ3 || null,
        extTemperaturaZ4: body.extTemperaturaZ4 || null,
        extTemperaturaZ5: body.extTemperaturaZ5 || null,
        extTemperaturaZ6: body.extTemperaturaZ6 || null,
        extTemperaturaZ7: body.extTemperaturaZ7 || null,
        extTemperaturaZ8: body.extTemperaturaZ8 || null,
        extTemperaturaZ9: body.extTemperaturaZ9 || null,
        extTemperaturaZ10: body.extTemperaturaZ10 || null,
        extTemperaturaZ11: body.extTemperaturaZ11 || null,
        extTemperaturaZ12: body.extTemperaturaZ12 || null,
        extTemperaturaZ13: body.extTemperaturaZ13 || null,
        extTemperaturaZ14: body.extTemperaturaZ14 || null,
        extTemperaturaZ15: body.extTemperaturaZ15 || null,
        extTemperaturaZ16: body.extTemperaturaZ16 || null,
        extTemperaturaZ17: body.extTemperaturaZ17 || null,
        extTemperaturaZ18: body.extTemperaturaZ18 || null,
        extTemperaturaZ19: body.extTemperaturaZ19 || null,
        extTemperaturaZ20: body.extTemperaturaZ20 || null,
        
        // Materia Prima Principal 1
        mpNombre: body.mpNombre || null,
        mpCodigo: body.mpCodigo || null,
        mpDensidad: body.mpDensidad || null,
        mpIndiceFluidez: body.mpIndiceFluidez || null,
        mpPaisFabricacion: body.mpPaisFabricacion || null,

        // Materia Prima Principal 2
        mpNombre2: body.mpNombre2 || null,
        mpCodigo2: body.mpCodigo2 || null,
        mpDensidad2: body.mpDensidad2 || null,
        mpIndiceFluidez2: body.mpIndiceFluidez2 || null,
        mpPaisFabricacion2: body.mpPaisFabricacion2 || null,

        // Materia Prima Principal 3
        mpNombre3: body.mpNombre3 || null,
        mpCodigo3: body.mpCodigo3 || null,
        mpDensidad3: body.mpDensidad3 || null,
        mpIndiceFluidez3: body.mpIndiceFluidez3 || null,
        mpPaisFabricacion3: body.mpPaisFabricacion3 || null,
        
        // Parámetros de Sellado
        sldTipoSelladora: body.sldTipoSelladora || null,
        sldCapacidadBolsa: body.sldCapacidadBolsa || null,
        sldTemperaturaAmbiente: body.sldTemperaturaAmbiente || null,
        sldTornilloEsparrago: body.sldTornilloEsparrago || null,
        sldTempSuperior: body.sldTempSuperior || null,
        sldTempInferior: body.sldTempInferior || null,
        sldTempValvula: body.sldTempValvula || null,
        sldPresellado_A: body.sldPresellado_A || null,
        sldPresellado_B: body.sldPresellado_B || null,
        sldTiempoLimite: body.sldTiempoLimite || null,
        sldMicroperforaciones: body.sldMicroperforaciones || null,
        sldMuleteado: body.sldMuleteado || null,
        sldTempSuperiorLineaA: body.sldTempSuperiorLineaA || null,
        sldTempInferiorLineaA: body.sldTempInferiorLineaA || null,
        sldTempSuperiorLineaB: body.sldTempSuperiorLineaB || null,
        sldTempInferiorLineaB: body.sldTempInferiorLineaB || null,
        sldTempTroquel: body.sldTempTroquel || null,
        sldTempSuperiorRecta: body.sldTempSuperiorRecta || null,
        sldTempSuperiorCurva: body.sldTempSuperiorCurva || null,
        sldTempCuchilla: body.sldTempCuchilla || null,
        sldRodilloAnchoValvula: body.sldRodilloAnchoValvula || null,
        sldGPM: body.sldGPM || null,
        sldVelocidadTransportador: body.sldVelocidadTransportador || null,
        sldCicloTrabajo: body.sldCicloTrabajo || null,
        sldPresionVentosa: body.sldPresionVentosa || null,
        sldTensionPrincipal: body.sldTensionPrincipal || null,
        sldPresionBalancin1: body.sldPresionBalancin1 || null,
        sldPresionBalancin2: body.sldPresionBalancin2 || null,
        sldPresionBalancin3: body.sldPresionBalancin3 || null,
        sldPresionBalancinA1: body.sldPresionBalancinA1 || null,
        sldPresionBalancinA2: body.sldPresionBalancinA2 || null,
        sldPresionBalancinA3: body.sldPresionBalancinA3 || null,
        sldPresionBalancinA4: body.sldPresionBalancinA4 || null,
        sldPresionBalancinB1: body.sldPresionBalancinB1 || null,
        sldPresionBalancinB2: body.sldPresionBalancinB2 || null,
        sldPresionBalancinB3: body.sldPresionBalancinB3 || null,
        sldPresionBalancinB4: body.sldPresionBalancinB4 || null,
        sldAlturaCabezalExtDerecho: body.sldAlturaCabezalExtDerecho || null,
        sldAlturaCabezalExtIzquierdo: body.sldAlturaCabezalExtIzquierdo || null,
        sldBandaTransportadora: body.sldBandaTransportadora || null,
        sldMedidaPortabobina: body.sldMedidaPortabobina || null,
        sldAjusteSensorFail: body.sldAjusteSensorFail || null,
        sldPresionSopladoArriba: body.sldPresionSopladoArriba || null,
        sldPresionSopladoAbajo: body.sldPresionSopladoAbajo || null,
        sldPresionRodilloServoL: body.sldPresionRodilloServoL || null,
        sldPresionRodilloServoR: body.sldPresionRodilloServoR || null,
        sldSoplarInicio: body.sldSoplarInicio || null,
        sldSoplarTerminar: body.sldSoplarTerminar || null,
        sldSiliconaInicioVentoza: body.sldSiliconaInicioVentoza || null,
        sldSiliconaTerminarVentoza: body.sldSiliconaTerminarVentoza || null,
      }
    });

    return NextResponse.json(producto, { status: 201 });
  } catch (error) {
    console.error('Error al crear producto:', error);
    return NextResponse.json(
      { error: 'Error al crear producto', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
