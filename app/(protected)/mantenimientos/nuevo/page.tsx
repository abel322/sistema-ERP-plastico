'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Wrench } from 'lucide-react';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormTextarea } from '@/components/forms/form-textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Maquina {
  id: string;
  nombre: string;
  area: string;
  activa: boolean;
}

export default function NuevoMantenimientoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [formData, setFormData] = useState({
    maquinaId: '',
    tipo: 'Preventivo',
    descripcion: '',
    fechaProgramada: '',
    responsable: '',
    costo: '',
    observaciones: ''
  });

  useEffect(() => {
    const fetchMaquinas = async () => {
      try {
        const res = await fetch('/api/maquinas?activa=true');
        const data = await res.json();
        setMaquinas(data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoadingData(false);
      }
    };
    fetchMaquinas();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/mantenimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          costo: formData.costo ? parseFloat(formData.costo) : null
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al programar mantenimiento');
      }

      router.push('/mantenimientos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al programar mantenimiento');
    } finally {
      setLoading(false);
    }
  };

  // Agrupar máquinas por área
  const maquinasPorArea = maquinas.reduce((acc, m) => {
    if (!acc[m.area]) acc[m.area] = [];
    acc[m.area].push(m);
    return acc;
  }, {} as Record<string, Maquina[]>);

  if (loadingData) {
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
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Programar Mantenimiento</h1>
            <p className="text-sm text-gray-600">Crear nuevo registro de mantenimiento</p>
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

          <FormSelect
            label="Máquina"
            value={formData.maquinaId}
            onChange={(e) => setFormData({ ...formData, maquinaId: e.target.value })}
            required
          >
            <option value="">Seleccionar máquina</option>
            {Object.entries(maquinasPorArea).map(([area, maquinasArea]) => (
              <optgroup key={area} label={area}>
                {maquinasArea.map(m => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </optgroup>
            ))}
          </FormSelect>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormSelect
              label="Tipo de Mantenimiento"
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              required
              options={[
                { value: 'Preventivo', label: 'Preventivo' },
                { value: 'Correctivo', label: 'Correctivo' },
                { value: 'Calibracion', label: 'Calibración' }
              ]}
            />
            <FormInput
              label="Fecha Programada"
              type="date"
              value={formData.fechaProgramada}
              onChange={(e) => setFormData({ ...formData, fechaProgramada: e.target.value })}
              required
            />
          </div>

          <FormTextarea
            label="Descripción"
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            required
            rows={3}
            placeholder="Describa el trabajo a realizar..."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              label="Responsable"
              value={formData.responsable}
              onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
              required
              placeholder="Nombre del técnico"
            />
            <FormInput
              label="Costo Estimado"
              type="number"
              step="0.01"
              min="0"
              value={formData.costo}
              onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <FormTextarea
            label="Observaciones"
            value={formData.observaciones}
            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            rows={2}
            placeholder="Observaciones adicionales..."
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
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Guardando...' : 'Programar'}
            </button>
          </div>
        </motion.form>
      </div>
    </>
  );
}
