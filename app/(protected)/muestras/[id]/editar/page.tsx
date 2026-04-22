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
  { value: 'Aprobada', label: 'Aprobada' },
  { value: 'Rechazada', label: 'Rechazada' },
];

export default function EditarMuestraPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    estado: '',
    descripcion: '',
    responsable: '',
    observaciones: '',
  });

  const [muestraInfo, setMuestraInfo] = useState<any>(null);

  useEffect(() => {
    fetchMuestra();
  }, [params.id]);

  const fetchMuestra = async () => {
    try {
      const res = await fetch(`/api/muestras/${params.id}`);
      if (!res.ok) throw new Error('Muestra no encontrada');
      const data = await res.json();
      setMuestraInfo(data);
      setFormData({
        estado: data.estado,
        descripcion: data.descripcion || '',
        responsable: data.responsable || '',
        observaciones: data.observaciones || '',
      });
    } catch (error) {
      console.error('Error:', error);
      setError('No se pudo cargar la muestra');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/muestras/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al actualizar');
      }

      router.push('/muestras');
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

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      Produccion: 'Producción',
      ClienteNuevo: 'Cliente Nuevo',
      Reclamo: 'Reclamo',
    };
    return tipos[tipo] || tipo;
  };

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/muestras"
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Editar Muestra</h1>
            <p className="text-sm text-gray-600">Actualizar información de la muestra</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-white p-4 shadow-md sm:p-6"
        >
          {/* Info de la muestra */}
          {muestraInfo && (
            <div className="mb-6 rounded-lg bg-gray-50 p-4">
              <h3 className="mb-3 font-medium text-gray-900">Información de la Muestra</h3>
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <span className="text-gray-500">Fecha:</span>
                  <p className="font-medium">{formatDate(muestraInfo.fecha)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Cliente:</span>
                  <p className="font-medium">{muestraInfo.cliente?.nombre}</p>
                </div>
                <div>
                  <span className="text-gray-500">Tipo:</span>
                  <p className="font-medium">{getTipoLabel(muestraInfo.tipo)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Cantidad:</span>
                  <p className="font-medium">{muestraInfo.cantidad} {muestraInfo.unidad}</p>
                </div>
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

            <FormInput
              label="Responsable"
              value={formData.responsable}
              onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
            />

            <FormTextarea
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows={2}
            />

            <FormTextarea
              label="Observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              rows={3}
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/muestras"
                className="rounded-lg border border-gray-300 px-4 py-2 text-center text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
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
