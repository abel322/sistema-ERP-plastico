'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { TipoDosificacionMolido } from '@prisma/client';

export async function actualizarProductoCompleto(productoId: string, data: any) {
  try {
    if (!productoId) {
      return { success: false, error: 'ID de producto requerido' };
    }

    const f = data.formulacion || data || {};

    const tipoDosificacionMolido = (f.tipoDosificacionMolido === 'KILOGRAMOS'
      ? TipoDosificacionMolido.KILOGRAMOS
      : TipoDosificacionMolido.PORCENTAJE) as TipoDosificacionMolido;

    const peletizadoId = f.peletizadoId && f.peletizadoId !== '' ? f.peletizadoId : null;
    const peletizadoPorcentaje = Number(f.peletizadoPorcentaje ?? f.molido ?? 0);
    const peletizadoKgPor100 = Number(f.peletizadoKgPor100 ?? 0);
    const llevaResinaEnMolido = Boolean(f.llevaResinaEnMolido);
    const resinaMolidoId = f.resinaMolidoId && f.resinaMolidoId !== '' ? f.resinaMolidoId : null;
    const resinaMolidoKgPor100 = Number(f.resinaMolidoKgPor100 ?? 0);

    // Resinas Vírgenes (%)
    const p3003 = Number(f.p3003 ?? f.form3003 ?? 0);
    const lineal = Number(f.lineal ?? f.formLineal ?? 0);
    const fb7000 = Number(f.fb7000 ?? f.formFB7000 ?? 0);
    const p0240 = Number(f.p0240 ?? f.form0240 ?? 0);
    const p0348 = Number(f.p0348 ?? f.form0348 ?? 0);
    const p7000f = Number(f.p7000f ?? f.p7000F ?? f.form7000F ?? 0);

    // Aditivos (%)
    const deslizante = Number(f.deslizante ?? f.formDeslizante ?? 0);
    const masterbachBlanco = Number(f.masterbachBlanco ?? f.formMasterbachBlanco ?? 0);
    const masterbachNegro = Number(f.masterbachNegro ?? f.formMasterbachNegro ?? 0);
    const masterbachAzul = Number(f.masterbachAzul ?? f.formMasterbachAzul ?? 0);
    const masterbachAmarillo = Number(f.masterbachAmarillo ?? f.formMasterbachAmarillo ?? 0);

    await prisma.$transaction(async (tx) => {
      // 1. Actualizar datos en ProductoCliente
      const updateDataProducto: any = {
        tipoDosificacionMolido,
        peletizadoId,
        peletizadoPorcentaje,
        peletizadoKgPor100,
        llevaResinaEnMolido,
        resinaMolidoId,
        resinaMolidoKgPor100,
        molido: peletizadoPorcentaje,
        formFB7000: fb7000,
        form3003: p3003,
        formLineal: lineal,
        form0240: p0240,
        form0348: p0348,
        form7000F: p7000f,
        formDeslizante: deslizante,
        formMasterbachBlanco: masterbachBlanco,
        formMasterbachNegro: masterbachNegro,
        formMasterbachAzul: masterbachAzul,
        formMasterbachAmarillo: masterbachAmarillo,
      };

      if (data.nombreProducto || data.nombre) {
        updateDataProducto.nombreProducto = data.nombreProducto || data.nombre;
      }
      if (data.codigoProducto !== undefined) {
        updateDataProducto.codigoProducto = data.codigoProducto || null;
      }
      if (data.activo !== undefined) {
        updateDataProducto.activo = Boolean(data.activo);
      }
      if (data.tipoProducto) {
        updateDataProducto.tipoProducto = data.tipoProducto;
      }
      if (data.tipoBolsa !== undefined) {
        updateDataProducto.tipoBolsa = data.tipoBolsa || null;
      }
      if (data.material !== undefined) {
        updateDataProducto.material = data.material || null;
      }
      if (data.unidadVenta) {
        updateDataProducto.unidadVenta = data.unidadVenta;
      }
      if (data.conImpresion !== undefined) {
        updateDataProducto.conImpresion = Boolean(data.conImpresion);
      }
      if (data.conPigmento !== undefined) {
        updateDataProducto.conPigmento = Boolean(data.conPigmento);
      }

      await tx.productoCliente.update({
        where: { id: productoId },
        data: updateDataProducto,
      });

      // 2. Guardar o Actualizar Formulación (Upsert seguro)
      const formulacionPayload = {
        tipoDosificacionMolido,
        peletizadoId,
        peletizadoPorcentaje,
        peletizadoKgPor100,
        llevaResinaEnMolido,
        resinaMolidoId,
        resinaMolidoKgPor100,
        p3003,
        lineal,
        fb7000,
        p0240,
        p0348,
        p7000f,
        deslizante,
        masterbachBlanco,
        masterbachNegro,
        masterbachAzul,
        masterbachAmarillo,
      };

      await tx.formulacion.upsert({
        where: { productoId: productoId },
        create: {
          productoId: productoId,
          ...formulacionPayload,
        },
        update: formulacionPayload,
      });
    });

    revalidatePath(`/productos/${productoId}/editar-completo`);
    revalidatePath('/productos');
    revalidatePath('/produccion');

    return { success: true, message: 'Producto y formulación actualizados correctamente.' };
  } catch (error: any) {
    console.error('Error al actualizar producto:', error);
    return { success: false, error: error.message || 'Error al guardar formulación.' };
  }
}

export async function actualizarFormulacion(productoId: string, formulacion: any) {
  return actualizarProductoCompleto(productoId, { formulacion });
}

