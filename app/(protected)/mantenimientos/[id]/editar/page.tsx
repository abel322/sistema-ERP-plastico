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

export default function EditarMantenimientoPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [maquinaNombre, setMaquinaNombre] = useState('');
  const [formData, setFormData] = useState({
    tipo: '',
    descripcion: '',
    fechaProgramada: '',
    fechaRealizada: '',
    responsable: '',
    costo: '',
    estado: '',
    observaciones: ''
  });

  useEffect(() => {
    const fetchMantenimiento = async () => {
      try {
        const res = await fetch(`/api/mantenimientos/${params.id}`);
        if (!res.ok) throw new Error('Mantenimiento no encontrado');
        const data = await res.json();
        setMaquinaNombre(data.maquina.nombre);
        setFormData({
          tipo: data.tipo,
          descripcion: data.descripcion,
          fechaProgramada: data.fechaProgramada.split('T')[0],
          fechaRealizada: data.fechaRealizada ? data.fechaRealizada.split('T')[0] : '',
          responsable: data.responsable,
          costo: data.costo?.toString() || '',
          estado: data.estado,
          observaciones: data.observaciones || ''
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar mantenimiento');
      } finally {
        setLoading(false);
      }
    };
    fetchMantenimiento();
  }, [params.id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const res = await fetch(`/api/mantenimientos/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: formData.estado,
          descripcion: formData.descripcion,
          responsable: formData.responsable,
          costo: formData.costo ? parseFloat(formData.costo) : null,
          observaciones: formData.observaciones || null,
          fechaRealizada: formData.fechaRealizada || null
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al actualizar mantenimiento');
      }

      router.push('/mantenimientos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar mantenimiento');
    } finally {
      setSaving(false);
    }
  };

  const tipoLabels: Record<string, string> = {
    Preventivo: 'Preventivo',
    Correctivo: 'Correctivo',
    Calibracion: 'Calibración'
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
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/mantenimientos" className="rounded-lg p-2 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Editar Mantenimiento</h1>
            <p className="text-sm text-gray-600">{maquinaNombre} - {tipoLabels[formData.tipo]}</p>
          </div>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-6 rounded-lg bg-white p-6 shadow-md"
        >
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
          )}

          <div className="rounded-lg bg-gray-50 p-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <span className="text-sm text-gray-500">Máquina:</span>
                <span className="ml-2 font-medium">{maquinaNombre}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Tipo:</span>
                <span className="ml-2 font-medium">{tipoLabels[formData.tipo]}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Fecha Programada:</span>
                <span className="ml-2 font-medium">
                  {new Date(formData.fechaProgramada).toLocaleDateString('es-VE')}
                </span>
              </div>
            </div>
          </div>

          <FormSelect
            label="Estado"
            value={formData.estado}
            onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
            required
            options={[
              { value: 'Programado', label: 'Programado' },
              { value: 'EnProceso', label: 'En Proceso' },
              { value: 'Completado', label: 'Completado' },
              { value: 'Cancelado', label: 'Cancelado' }
            ]}
          />

          <FormTextarea
            label="Descripción"
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            required
            rows={3}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              label="Responsable"
              value={formData.responsable}
              onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
              required
            />
            <FormInput
              label="Costo Real"
              type="number"
              step="0.01"
              min="0"
              value={formData.costo}
              onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
              placeholder="0.00"
            />
          </div>

          {(formData.estado === 'Completado' || formData.estado === 'EnProceso') && (
            <FormInput
              label="Fecha Realizada"
              type="date"
              value={formData.fechaRealizada}
              onChange={(e) => setFormData({ ...formData, fechaRealizada: e.target.value })}
            />
          )}

          <FormTextarea
            label="Observaciones"
            value={formData.observaciones}
            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            rows={3}
            placeholder="Notas sobre el trabajo realizado..."
          />

          <div className="flex justify-end gap-3">
            <Link
              href="/mantenimientos"
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
      </div>
    </>
  );
}
