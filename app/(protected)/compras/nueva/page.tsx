'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingCart, ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormTextarea } from '@/components/forms/form-textarea';

interface Proveedor {
  id: string;
  nombre: string;
}

interface DetalleOrden {
  descripcion: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
}

export default function NuevaOrdenCompraPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  const [formData, setFormData] = useState({
    proveedorId: '',
    fechaEntrega: '',
    observaciones: '',
  });

  const [detalles, setDetalles] = useState<DetalleOrden[]>([
    { descripcion: '', cantidad: 0, unidad: 'Kg', precioUnitario: 0 },
  ]);

  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        const res = await fetch('/api/proveedores?limit=100&activo=true');
        if (res.ok) {
          const data = await res.json();
          setProveedores(data.proveedores);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    fetchProveedores();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDetalleChange = (index: number, field: keyof DetalleOrden, value: string | number) => {
    setDetalles((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const agregarDetalle = () => {
    setDetalles((prev) => [
      ...prev,
      { descripcion: '', cantidad: 0, unidad: 'Kg', precioUnitario: 0 },
    ]);
  };

  const eliminarDetalle = (index: number) => {
    if (detalles.length === 1) return;
    setDetalles((prev) => prev.filter((_, i) => i !== index));
  };

  const calcularSubtotal = () => {
    return detalles.reduce((sum, d) => sum + d.cantidad * d.precioUnitario, 0);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validar detalles
    const detallesValidos = detalles.filter(
      (d) => d.descripcion && d.cantidad > 0 && d.precioUnitario > 0
    );

    if (detallesValidos.length === 0) {
      setError('Debe agregar al menos un ítem válido');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          detalles: detallesValidos,
        }),
      });

      if (res.ok) {
        router.push('/compras');
      } else {
        const data = await res.json();
        setError(data.error || 'Error al crear orden');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = calcularSubtotal();
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/compras"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Compras
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
            <ShoppingCart className="h-7 w-7 sm:h-8 sm:w-8 text-orange-600" />
            Nueva Orden de Compra
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Datos generales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Datos Generales</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormSelect
                label="Proveedor"
                name="proveedorId"
                value={formData.proveedorId}
                onChange={handleChange}
                options={proveedores.map((p) => ({ value: p.id, label: p.nombre }))}
                required
                placeholder="Seleccione un proveedor"
              />
              <FormInput
                label="Fecha de Entrega Esperada"
                name="fechaEntrega"
                type="date"
                value={formData.fechaEntrega}
                onChange={handleChange}
              />
            </div>
            <div className="mt-4">
              <FormTextarea
                label="Observaciones"
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                rows={2}
                placeholder="Notas adicionales para el proveedor"
              />
            </div>
          </motion.div>

          {/* Detalles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Ítems de la Orden</h2>
              <button
                type="button"
                onClick={agregarDetalle}
                className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 text-sm"
              >
                <Plus className="h-4 w-4" />
                Agregar
              </button>
            </div>

            <div className="space-y-4">
              {detalles.map((detalle, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 sm:gap-3 items-end p-3 bg-gray-50 rounded-lg"
                >
                  <div className="col-span-12 sm:col-span-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Descripción
                    </label>
                    <input
                      type="text"
                      value={detalle.descripcion}
                      onChange={(e) => handleDetalleChange(index, 'descripcion', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                      placeholder="Descripción del ítem"
                      required
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cantidad</label>
                    <input
                      type="number"
                      value={detalle.cantidad || ''}
                      onChange={(e) => handleDetalleChange(index, 'cantidad', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Unidad</label>
                    <select
                      value={detalle.unidad}
                      onChange={(e) => handleDetalleChange(index, 'unidad', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="Kg">Kg</option>
                      <option value="Unidades">Unidades</option>
                      <option value="Metros">Metros</option>
                      <option value="Litros">Litros</option>
                    </select>
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Precio Unit.</label>
                    <input
                      type="number"
                      value={detalle.precioUnitario || ''}
                      onChange={(e) => handleDetalleChange(index, 'precioUnitario', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="col-span-10 sm:col-span-1 text-right sm:text-center">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Subtotal</label>
                    <p className="py-2 text-sm font-semibold text-gray-700">
                      ${(detalle.cantidad * detalle.precioUnitario).toFixed(2)}
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => eliminarDetalle(index)}
                      disabled={detalles.length === 1}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totales */}
            <div className="mt-6 border-t pt-4 space-y-2 text-right">
              <p className="text-sm text-gray-600">
                Subtotal: <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </p>
              <p className="text-sm text-gray-600">
                IVA (16%): <span className="font-semibold">${iva.toFixed(2)}</span>
              </p>
              <p className="text-lg text-gray-800">
                Total: <span className="font-bold text-orange-600">${total.toFixed(2)}</span>
              </p>
            </div>
          </motion.div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors font-medium"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Crear Orden
                </>
              )}
            </button>
            <Link
              href="/compras"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
