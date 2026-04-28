'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormTextarea } from '@/components/forms/form-textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const TURNOS = [
  { value: 'Manana', label: 'Mañana' },
  { value: 'Tarde', label: 'Tarde' },
  { value: 'Noche', label: 'Noche' },
];

const UNIDADES = [
  { value: 'Unidades', label: 'Unidades' },
  { value: 'Kilogramos', label: 'Kilogramos' },
  { value: 'Metros', label: 'Metros' },
];

export default function EditarProduccionPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    turno: '',
    operario: '',
    cantidadProducida: '',
    unidad: '',
    merma: '',
    horaInicio: '',
    horaFin: '',
    observaciones: '',
  });
  const [produccion, setProduccion] = useState<any>(null);

  useEffect(() => {
    fetchProduccion();
  }, [params.id]);

  const fetchProduccion = async () => {
    try {
      const res = await fetch(`/api/produccion/${params.id}`);
      const data = await res.json();
      setProduccion(data);
      setFormData({
        turno: data.turno,
        operario: data.operario,
        cantidadProducida: data.cantidadProducida.toString(),
        unidad: data.unidad,
        merma: data.merma.toString(),
        horaInicio: data.horaInicio || '',
        horaFin: data.horaFin || '',
        observaciones: data.observaciones || '',
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/produccion/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          cantidadProducida: parseFloat(formData.cantidadProducida),
          merma: parseFloat(formData.merma),
        }),
      });

      if (res.ok) {
        router.push('/produccion');
      } else {
        const data = await res.json();
        alert(data.error || 'Error al actualizar');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/produccion" className="rounded-lg p-2 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Producción</h1>
            <p className="text-gray-600">
              {produccion?.maquina?.nombre} - {new Date(produccion?.fecha).toLocaleDateString('es-VE')}
            </p>
          </div>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="rounded-xl bg-white p-6 shadow-sm space-y-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormSelect
              label="Turno"
              value={formData.turno}
              onChange={(e) => setFormData({ ...formData, turno: e.target.value })}
              options={TURNOS}
            />
            <FormInput
              label="Operario"
              value={formData.operario}
              onChange={(e) => setFormData({ ...formData, operario: e.target.value })}
            />
            <FormInput
              label="Cantidad Producida"
              type="number"
              step="0.01"
              value={formData.cantidadProducida}
              onChange={(e) => setFormData({ ...formData, cantidadProducida: e.target.value })}
            />
            <FormSelect
              label="Unidad"
              value={formData.unidad}
              onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
              options={UNIDADES}
            />
            <FormInput
              label="Merma (kg)"
              type="number"
              step="0.01"
              value={formData.merma}
              onChange={(e) => setFormData({ ...formData, merma: e.target.value })}
            />
            <div></div>
            <FormInput
              label="Hora Inicio"
              type="time"
              value={formData.horaInicio}
              onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
            />
            <FormInput
              label="Hora Fin"
              type="time"
              value={formData.horaFin}
              onChange={(e) => setFormData({ ...formData, horaFin: e.target.value })}
            />
          </div>

          <FormTextarea
            label="Observaciones"
            value={formData.observaciones}
            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            rows={3}
          />

          <div className="flex justify-end gap-3 border-t pt-6">
            <Link
              href="/produccion"
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-400"
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
              ) : (
                <><Save className="h-4 w-4" /> Guardar Cambios</>
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </>
  );
}
