'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Plus, Minus, RefreshCw } from 'lucide-react';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormTextarea } from '@/components/forms/form-textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Movimiento {
  id: string;
  tipo: string;
  cantidad: number;
  motivo: string | null;
  responsable: string;
  fecha: string;
}

export default function EditarInventarioPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [showMovimiento, setShowMovimiento] = useState(false);
  const [movimientoForm, setMovimientoForm] = useState({
    tipo: 'Entrada',
    cantidad: '',
    motivo: ''
  });
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    categoria: '',
    cantidad: 0,
    unidad: '',
    stockMinimo: '',
    stockMaximo: '',
    ubicacion: '',
    costo: '',
    proveedor: '',
    observaciones: ''
  });

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await fetch(`/api/inventario/${params.id}`);
        if (!res.ok) throw new Error('Item no encontrado');
        const data = await res.json();
        setFormData({
          nombre: data.nombre,
          codigo: data.codigo,
          categoria: data.categoria,
          cantidad: data.cantidad,
          unidad: data.unidad,
          stockMinimo: data.stockMinimo?.toString() || '',
          stockMaximo: data.stockMaximo?.toString() || '',
          ubicacion: data.ubicacion || '',
          costo: data.costo?.toString() || '',
          proveedor: data.proveedor || '',
          observaciones: data.observaciones || ''
        });
        setMovimientos(data.movimientos || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar item');
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [params.id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const res = await fetch(`/api/inventario/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          categoria: formData.categoria,
          unidad: formData.unidad,
          stockMinimo: formData.stockMinimo ? parseFloat(formData.stockMinimo) : 0,
          stockMaximo: formData.stockMaximo ? parseFloat(formData.stockMaximo) : null,
          ubicacion: formData.ubicacion || null,
          costo: formData.costo ? parseFloat(formData.costo) : null,
          proveedor: formData.proveedor || null,
          observaciones: formData.observaciones || null
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al actualizar item');
      }

      router.push('/inventario');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar item');
    } finally {
      setSaving(false);
    }
  };

  const handleMovimiento = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/inventario/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventarioId: params.id,
          tipo: movimientoForm.tipo,
          cantidad: parseFloat(movimientoForm.cantidad),
          motivo: movimientoForm.motivo
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al registrar movimiento');
      }

      // Recargar datos
      const itemRes = await fetch(`/api/inventario/${params.id}`);
      const data = await itemRes.json();
      setFormData(prev => ({ ...prev, cantidad: data.cantidad }));
      setMovimientos(data.movimientos || []);
      setShowMovimiento(false);
      setMovimientoForm({ tipo: 'Entrada', cantidad: '', motivo: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar movimiento');
    }
  };

  const tipoLabels: Record<string, string> = {
    Entrada: 'Entrada',
    Salida: 'Salida',
    Ajuste: 'Ajuste',
    Devolucion: 'Devolución'
  };

  if (loading) {
    return (
      <>
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/inventario" className="rounded-lg p-2 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Editar Item</h1>
            <p className="text-sm text-gray-600">{formData.codigo} - {formData.nombre}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Formulario principal */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="space-y-4 rounded-lg bg-white p-6 shadow-md lg:col-span-2"
          >
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Código"
                value={formData.codigo}
                disabled
                className="bg-gray-100"
              />
              <FormInput
                label="Nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormSelect
                label="Categoría"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                required
                options={[
                  { value: 'MateriaPrima', label: 'Materia Prima' },
                  { value: 'ProductoTerminado', label: 'Producto Terminado' },
                  { value: 'Insumo', label: 'Insumo' },
                  { value: 'Peletizado', label: 'Peletizado' }
                ]}
              />
              <FormInput
                label="Unidad"
                value={formData.unidad}
                onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                required
              />
            </div>

            <div className="rounded-lg bg-blue-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Stock Actual</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formData.cantidad} {formData.unidad}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMovimiento(true)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Registrar Movimiento
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Stock Mínimo"
                type="number"
                step="0.01"
                min="0"
                value={formData.stockMinimo}
                onChange={(e) => setFormData({ ...formData, stockMinimo: e.target.value })}
              />
              <FormInput
                label="Stock Máximo"
                type="number"
                step="0.01"
                min="0"
                value={formData.stockMaximo}
                onChange={(e) => setFormData({ ...formData, stockMaximo: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Ubicación"
                value={formData.ubicacion}
                onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
              />
              <FormInput
                label="Costo Unitario"
                type="number"
                step="0.01"
                min="0"
                value={formData.costo}
                onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
              />
            </div>

            <FormInput
              label="Proveedor"
              value={formData.proveedor}
              onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
            />

            <FormTextarea
              label="Observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              rows={3}
            />

            <div className="flex justify-end gap-3">
              <Link
                href="/inventario"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </motion.form>

          {/* Historial de movimientos */}
          <div className="rounded-lg bg-white p-4 shadow-md">
            <h3 className="mb-4 font-semibold text-gray-900">Últimos Movimientos</h3>
            {movimientos.length === 0 ? (
              <p className="text-sm text-gray-500">Sin movimientos registrados</p>
            ) : (
              <div className="space-y-3">
                {movimientos.slice(0, 10).map((mov) => (
                  <div key={mov.id} className="border-b border-gray-100 pb-2">
                    <div className="flex items-center justify-between">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${mov.tipo === 'Entrada' ? 'bg-green-100 text-green-800' :
                          mov.tipo === 'Salida' ? 'bg-red-100 text-red-800' :
                            mov.tipo === 'Ajuste' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                        }`}>
                        {tipoLabels[mov.tipo]}
                      </span>
                      <span className="text-sm font-medium">
                        {mov.tipo === 'Salida' ? '-' : '+'}{mov.cantidad}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(mov.fecha).toLocaleDateString('es-VE')}
                    </p>
                    {mov.motivo && (
                      <p className="text-xs text-gray-600">{mov.motivo}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal de movimiento */}
        {showMovimiento && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            >
              <h3 className="mb-4 text-lg font-semibold">Registrar Movimiento</h3>
              <form onSubmit={handleMovimiento} className="space-y-4">
                <FormSelect
                  label="Tipo de Movimiento"
                  value={movimientoForm.tipo}
                  onChange={(e) => setMovimientoForm({ ...movimientoForm, tipo: e.target.value })}
                  required
                  options={[
                    { value: 'Entrada', label: 'Entrada' },
                    { value: 'Salida', label: 'Salida' },
                    { value: 'Ajuste', label: 'Ajuste (nuevo stock)' },
                    { value: 'Devolucion', label: 'Devolución' }
                  ]}
                />
                <FormInput
                  label={movimientoForm.tipo === 'Ajuste' ? 'Nueva Cantidad' : 'Cantidad'}
                  type="number"
                  step="0.01"
                  min="0"
                  value={movimientoForm.cantidad}
                  onChange={(e) => setMovimientoForm({ ...movimientoForm, cantidad: e.target.value })}
                  required
                />
                <FormInput
                  label="Motivo"
                  value={movimientoForm.motivo}
                  onChange={(e) => setMovimientoForm({ ...movimientoForm, motivo: e.target.value })}
                  placeholder="Descripción del movimiento"
                />
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowMovimiento(false)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Registrar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
}
