export function agruparProduccionesPorLote(producciones: any[]) {
  const grupos: any[][] = [];
  const procesados = new Set<string>();

  // Mapa para búsqueda rápida por codigoLote
  const porCodigoLote = new Map<string, any[]>();
  producciones.forEach(p => {
    if (p.codigoLote) {
      if (!porCodigoLote.has(p.codigoLote)) porCodigoLote.set(p.codigoLote, []);
      porCodigoLote.get(p.codigoLote)!.push(p);
    }
  });

  // Funciones auxiliares para encontrar conexiones (arriba y abajo)
  function encontrarRelacionadas(prod: any) {
    const relacionadas: any[] = [prod];
    procesados.add(prod.id);

    const toProcess = [prod];

    while(toProcess.length > 0) {
      const actual = toProcess.pop();

      // Buscar hijos (producciones que tienen como loteOrigen el codigoLote del actual)
      if (actual.codigoLote) {
        const hijos = producciones.filter(p => !procesados.has(p.id) && p.loteOrigen === actual.codigoLote);
        hijos.forEach(h => {
          procesados.add(h.id);
          relacionadas.push(h);
          toProcess.push(h);
        });
      }

      // Buscar padres (producciones cuyo codigoLote es el loteOrigen del actual)
      if (actual.loteOrigen) {
        const padres = porCodigoLote.get(actual.loteOrigen) || [];
        padres.forEach(p => {
          if (!procesados.has(p.id)) {
            procesados.add(p.id);
            relacionadas.push(p);
            toProcess.push(p);
          }
        });
      }

      // Agrupar por pedidoId
      if (actual.pedidoId) {
        const hermanosPedido = producciones.filter(p => !procesados.has(p.id) && p.pedidoId === actual.pedidoId);
        hermanosPedido.forEach(h => {
          procesados.add(h.id);
          relacionadas.push(h);
          toProcess.push(h);
        });
      }

      // Agrupar por productoClienteId + fecha (mismo dia) si no hay pedidoId ni lote origen/codigoLote q conecten
      if (!actual.pedidoId && !actual.loteOrigen && actual.productoClienteId) {
        const fechaActual = new Date(actual.finalizadoAt).toDateString();
        const hermanosProductoFecha = producciones.filter(p =>
          !procesados.has(p.id) &&
          !p.pedidoId &&
          p.productoClienteId === actual.productoClienteId &&
          new Date(p.finalizadoAt).toDateString() === fechaActual
        );
        hermanosProductoFecha.forEach(h => {
          procesados.add(h.id);
          relacionadas.push(h);
          toProcess.push(h);
        });
      }
    }

    return relacionadas;
  }

  producciones.forEach(p => {
    if (!procesados.has(p.id)) {
      const grupo = encontrarRelacionadas(p);

      // Ordenar fases dentro del grupo
      // 1° Extrusión -> 2° Serigrafía -> 3° Refilado -> 4° Sellado
      const orderMap: Record<string, number> = {
        'Extrusion': 1,
        'Serigrafia': 2,
        'Refilado': 3,
        'Sellado': 4
      };

      grupo.sort((a, b) => (orderMap[a.area] || 99) - (orderMap[b.area] || 99));

      grupos.push(grupo);
    }
  });

  // Ordenar los grupos enteros por fecha del primer elemento (descendente, como estaban las producciones)
  grupos.sort((a, b) => {
    const minA = Math.max(...a.map(p => new Date(p.finalizadoAt).getTime()));
    const minB = Math.max(...b.map(p => new Date(p.finalizadoAt).getTime()));
    return minB - minA;
  });

  return grupos;
}
