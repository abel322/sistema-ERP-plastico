'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormTextarea } from '@/components/forms/form-textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const ESTADOS = [
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'EnTransito', label: 'En Tránsito' },
  { value: 'Entregado', label: 'Entregado' },
  { value: 'Cancelado', label: 'Cancelado' },
];

export default function EditarDespachoPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    estado: '',
    vehiculo: '',
    conductor: '',
    destino: '',
    guiaRemision: '',
    observaciones: '',
  });

  const [despachoInfo, setDespachoInfo] = useState<any>(null);

  useEffect(() => {
    fetchDespacho();
  }, [params.id]);

  const fetchDespacho = async () => {
    try {
      const res = await fetch(`/api/despachos/${params.id}`);
      if (!res.ok) throw new Error('Despacho no encontrado');
      const data = await res.json();
      setDespachoInfo(data);
      setFormData({
        estado: data.estado,
        vehiculo: data.vehiculo || '',
        conductor: data.conductor || '',
        destino: data.destino || '',
        guiaRemision: data.guiaRemision || '',
        observaciones: data.observaciones || '',
      });
    } catch (error) {
      console.error('Error:', error);
      setError('No se pudo cargar el despacho');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/despachos/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al actualizar');
      }

      router.push('/despachos');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

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
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Editar Despacho</h1>
            <p className="text-sm text-gray-600">Actualizar información del despacho</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-white p-4 shadow-md sm:p-6"
        >
          {/* Info del despacho */}
          {despachoInfo && (
            <div className="mb-6 rounded-lg bg-gray-50 p-4">
              <h3 className="mb-3 font-medium text-gray-900">Información del Despacho</h3>
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <span className="text-gray-500">Fecha:</span>
                  <p className="font-medium">{formatDate(despachoInfo.fecha)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Cliente:</span>
                  <p className="font-medium">{despachoInfo.cliente?.nombre}</p>
                </div>
                <div>
                  <span className="text-gray-500">Cantidad:</span>
                  <p className="font-medium">{despachoInfo.cantidadDespachada} {despachoInfo.unidad}</p>
                </div>
                {despachoInfo.entregadoAt && (
                  <div>
                    <span className="text-gray-500">Entregado:</span>
                    <p className="font-medium text-green-600">{formatDate(despachoInfo.entregadoAt)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>
            )}

            <FormSelect
              label="Estado"
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              required
            >
              {ESTADOS.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </FormSelect>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Vehículo (Placa)"
                value={formData.vehiculo}
                onChange={(e) => setFormData({ ...formData, vehiculo: e.target.value })}
              />
              <FormInput
                label="Conductor"
                value={formData.conductor}
                onChange={(e) => setFormData({ ...formData, conductor: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Destino"
                value={formData.destino}
                onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
              />
              <FormInput
                label="Guía de Remisión"
                value={formData.guiaRemision}
                onChange={(e) => setFormData({ ...formData, guiaRemision: e.target.value })}
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
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </>
  );
}
