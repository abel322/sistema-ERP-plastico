'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';
import { FormInput } from '@/components/forms/form-input';
import { FormTextarea } from '@/components/forms/form-textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const TURNOS: Record<string, string> = {
  Manana: 'Mañana',
  Tarde: 'Tarde',
  Noche: 'Noche',
};

export default function EditarPeletizadoPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    operario: '',
    materialEntrada: '',
    materialSalida: '',
    colorPelet: '',
    tipoMaterial: '',
    observaciones: '',
  });

  const [registroInfo, setRegistroInfo] = useState<any>(null);

  useEffect(() => {
    fetchRegistro();
  }, [params.id]);

  const fetchRegistro = async () => {
    try {
      const res = await fetch(`/api/peletizado/${params.id}`);
      if (!res.ok) throw new Error('Registro no encontrado');
      const data = await res.json();
      setRegistroInfo(data);
      setFormData({
        operario: data.operario || '',
        materialEntrada: data.materialEntrada?.toString() || '',
        materialSalida: data.materialSalida?.toString() || '',
        colorPelet: data.colorPelet || '',
        tipoMaterial: data.tipoMaterial || '',
        observaciones: data.observaciones || '',
      });
    } catch (error) {
      console.error('Error:', error);
      setError('No se pudo cargar el registro');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/peletizado/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al actualizar');
      }

      router.push('/peletizado');
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

  const entrada = parseFloat(formData.materialEntrada) || 0;
  const salida = parseFloat(formData.materialSalida) || 0;
  const mermaCalculada = entrada > salida ? entrada - salida : 0;
  const eficiencia = entrada > 0 ? ((salida / entrada) * 100).toFixed(1) : '0';

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/peletizado"
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Editar Peletizado</h1>
            <p className="text-sm text-gray-600">Actualizar registro de peletizado</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-white p-4 shadow-md sm:p-6"
        >
          {/* Info del registro */}
          {registroInfo && (
            <div className="mb-6 rounded-lg bg-gray-50 p-4">
              <h3 className="mb-3 font-medium text-gray-900">Información del Registro</h3>
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <span className="text-gray-500">Fecha:</span>
                  <p className="font-medium">{formatDate(registroInfo.fecha)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Turno:</span>
                  <p className="font-medium">{TURNOS[registroInfo.turno] || registroInfo.turno}</p>
                </div>
                <div>
                  <span className="text-gray-500">Máquina:</span>
                  <p className="font-medium">{registroInfo.maquina?.nombre}</p>
                </div>
                <div>
                  <span className="text-gray-500">Merma Actual:</span>
                  <p className="font-medium text-red-600">{registroInfo.merma} kg</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>
            )}

            <FormInput
              label="Operario"
              value={formData.operario}
              onChange={(e) => setFormData({ ...formData, operario: e.target.value })}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Material Entrada (kg)"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.materialEntrada}
                onChange={(e) => setFormData({ ...formData, materialEntrada: e.target.value })}
              />
              <FormInput
                label="Material Salida (kg)"
                type="number"
                step="0.01"
                min="0"
                value={formData.materialSalida}
                onChange={(e) => setFormData({ ...formData, materialSalida: e.target.value })}
              />
            </div>

            {/* Resumen calculado */}
            {entrada > 0 && salida > 0 && (
              <div className="rounded-lg bg-green-50 p-4">
                <h4 className="mb-2 font-medium text-green-700">Resumen Actualizado</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xl font-bold text-gray-900">{entrada} kg</p>
                    <p className="text-sm text-gray-500">Entrada</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-red-600">{mermaCalculada.toFixed(2)} kg</p>
                    <p className="text-sm text-gray-500">Merma</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-green-600">{eficiencia}%</p>
                    <p className="text-sm text-gray-500">Eficiencia</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Color del Pelet"
                value={formData.colorPelet}
                onChange={(e) => setFormData({ ...formData, colorPelet: e.target.value })}
              />
              <FormInput
                label="Tipo de Material"
                value={formData.tipoMaterial}
                onChange={(e) => setFormData({ ...formData, tipoMaterial: e.target.value })}
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
                href="/peletizado"
                className="rounded-lg border border-gray-300 px-4 py-2 text-center text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
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
