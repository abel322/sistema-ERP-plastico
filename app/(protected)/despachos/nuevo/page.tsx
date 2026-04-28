'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Truck, Package, CheckCircle } from 'lucide-react';
import { FormInput } from '@/components/forms/form-input';
import { FormTextarea } from '@/components/forms/form-textarea';

interface ProductoTerminado {
  id: string;
  cantidadTotal: number;
  cantidadDisponible: number;
  unidad: string;
  tipoProducto: string;
  areaOrigen: string;
  descripcion: string | null;
  estado: string;
  cliente: { 
    id: string; 
    nombre: string; 
    direccion?: string;
  };
  produccion: {
    id: string;
    fecha: string;
    maquina: {
      nombre: string;
    };
  };
}

const areaNombres: Record<string, string> = {
  'Extrusion': 'Extrusión',
  'Sellado': 'Sellado',
  'Serigrafia': 'Serigrafía',
  'Refilado': 'Refilado',
};

export default function NuevoDespachoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get('productoTerminadoId');
  
  const [loading, setLoading] = useState(false);
  const [loadingProductos, setLoadingProductos] = useState(true);
  const [error, setError] = useState('');
  const [productos, setProductos] = useState<ProductoTerminado[]>([]);
  const [selectedProducto, setSelectedProducto] = useState<ProductoTerminado | null>(null);

  const [formData, setFormData] = useState({
    productoTerminadoId: '',
    cantidadDespachada: '',
    unidad: 'Unidades',
    vehiculo: '',
    conductor: '',
    destino: '',
    guiaRemision: '',
    observaciones: '',
    fecha: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchProductosTerminados();
  }, []);

  useEffect(() => {
    if (preselectedId && productos.length > 0) {
      handleProductoChange(preselectedId);
    }
  }, [preselectedId, productos]);

  const fetchProductosTerminados = async () => {
    try {
      setLoadingProductos(true);
      const res = await fetch('/api/producto-terminado?estado=ListoDespacho&limit=100');
      const data = await res.json();
      setProductos(data.productos || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingProductos(false);
    }
  };

  const handleProductoChange = (productoId: string) => {
    const producto = productos.find((p) => p.id === productoId);
    setSelectedProducto(producto || null);
    if (producto) {
      setFormData({
        ...formData,
        productoTerminadoId: productoId,
        unidad: producto.unidad,
        destino: producto.cliente.direccion || '',
        cantidadDespachada: producto.cantidadDisponible.toString(),
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/despachos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear despacho');
      }

      router.push('/despachos');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/despachos"
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Nuevo Despacho</h1>
            <p className="text-sm text-gray-600">Registrar despacho de producto terminado</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-white p-4 shadow-md sm:p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>
            )}

            {/* Selección de Producto Terminado */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-medium text-emerald-900">
                <Package className="h-5 w-5" />
                Seleccionar Producto Terminado
              </h3>
              
              {loadingProductos ? (
                <div className="py-4 text-center text-gray-500">Cargando productos...</div>
              ) : productos.length === 0 ? (
                <div className="py-4 text-center">
                  <Package className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-gray-500">No hay productos listos para despacho</p>
                  <Link 
                    href="/producto-terminado" 
                    className="mt-2 inline-block text-emerald-600 hover:underline"
                  >
                    Ver todos los productos
                  </Link>
                </div>
              ) : (
                <>
                  <select
                    value={formData.productoTerminadoId}
                    onChange={(e) => handleProductoChange(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">Seleccione un producto terminado...</option>
                    {productos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.cliente.nombre} - {p.tipoProducto} - {p.cantidadDisponible} {p.unidad} ({areaNombres[p.areaOrigen]})
                      </option>
                    ))}
                  </select>

                  {selectedProducto && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 rounded-lg bg-white p-4 shadow-sm border border-emerald-100"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <CheckCircle className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{selectedProducto.cliente.nombre}</h4>
                          <p className="text-sm text-gray-500">{selectedProducto.descripcion || selectedProducto.tipoProducto}</p>
                          
                          <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                            <div>
                              <span className="text-gray-500">Tipo:</span>
                              <p className="font-medium">{selectedProducto.tipoProducto}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Área Origen:</span>
                              <p className="font-medium">{areaNombres[selectedProducto.areaOrigen]}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Total Producido:</span>
                              <p className="font-medium">{selectedProducto.cantidadTotal} {selectedProducto.unidad}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Disponible:</span>
                              <p className="font-semibold text-emerald-600">
                                {selectedProducto.cantidadDisponible} {selectedProducto.unidad}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Fecha de Despacho"
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                required
              />
              <FormInput
                label="Cantidad a Despachar"
                type="number"
                step="0.01"
                min="0.01"
                max={selectedProducto?.cantidadDisponible}
                value={formData.cantidadDespachada}
                onChange={(e) => setFormData({ ...formData, cantidadDespachada: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Vehículo (Placa)"
                value={formData.vehiculo}
                onChange={(e) => setFormData({ ...formData, vehiculo: e.target.value })}
                placeholder="Ej: ABC-123"
              />
              <FormInput
                label="Conductor"
                value={formData.conductor}
                onChange={(e) => setFormData({ ...formData, conductor: e.target.value })}
                placeholder="Nombre del conductor"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Destino"
                value={formData.destino}
                onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                placeholder="Dirección de entrega"
              />
              <FormInput
                label="Guía de Remisión"
                value={formData.guiaRemision}
                onChange={(e) => setFormData({ ...formData, guiaRemision: e.target.value })}
                placeholder="Número de guía"
              />
            </div>

            <FormTextarea
              label="Observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              rows={3}
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/despachos"
                className="rounded-lg border border-gray-300 px-4 py-2 text-center text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </Link>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || !formData.productoTerminadoId}
                className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-2 text-white shadow-lg hover:shadow-xl disabled:opacity-50 transition-all"
              >
                <Truck className="h-5 w-5" />
                {loading ? 'Guardando...' : 'Registrar Despacho'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </>
  );
}
