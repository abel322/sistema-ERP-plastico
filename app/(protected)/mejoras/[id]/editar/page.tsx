'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lightbulb, ArrowLeft, Save } from 'lucide-react';
import { FormInput } from '@/components/forms/form-input';
import { FormTextarea } from '@/components/forms/form-textarea';
import { FormSelect } from '@/components/forms/form-select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Maquina {
  id: string;
  nombre: string;
  area: string;
}

const estadoOptions = [
  { value: 'Propuesta', label: 'Propuesta' },
  { value: 'EnEvaluacion', label: 'En Evaluación' },
  { value: 'Aprobada', label: 'Aprobada' },
  { value: 'Implementada', label: 'Implementada' },
  { value: 'Rechazada', label: 'Rechazada' },
];

export default function EditarMejoraPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);

  const [formData, setFormData] = useState({
    maquinaId: '',
    titulo: '',
    descripcion: '',
    problema: '',
    solucionPropuesta: '',
    solucionImplementada: '',
    responsable: '',
    estado: '',
    costoEstimado: '',
    ahorroEstimado: '',
    resultados: '',
    observaciones: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mejoraRes, maquinasRes] = await Promise.all([
          fetch(`/api/mejoras/${params.id}`),
          fetch('/api/maquinas'),
        ]);

        if (mejoraRes.ok) {
          const mejora = await mejoraRes.json();
          setFormData({
            maquinaId: mejora.maquinaId,
            titulo: mejora.titulo,
            descripcion: mejora.descripcion || '',
            problema: mejora.problema,
            solucionPropuesta: mejora.solucionPropuesta,
            solucionImplementada: mejora.solucionImplementada || '',
            responsable: mejora.responsable,
            estado: mejora.estado,
            costoEstimado: mejora.costoEstimado?.toString() || '',
            ahorroEstimado: mejora.ahorroEstimado?.toString() || '',
            resultados: mejora.resultados || '',
            observaciones: mejora.observaciones || '',
          });
        }

        if (maquinasRes.ok) {
          const maquinas = await maquinasRes.json();
          setMaquinas(maquinas);
        }
      } catch (error) {
        console.error('Error:', error);
        setError('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchData();
  }, [params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/mejoras/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push(`/mejoras/${params.id}`);
      } else {
        const data = await res.json();
        setError(data.error || 'Error al actualizar');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center"><LoadingSpinner /></div>
    );
  }

  const maquinaOptions = maquinas.map((m) => ({
    value: m.id,
    label: `${m.nombre} (${m.area})`,
  }));

  return (
    <>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/mejoras/${params.id}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Detalle
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Lightbulb className="h-7 w-7 sm:h-8 sm:w-8 text-yellow-500" />
            Editar Mejora
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Modifique los datos de la mejora
          </p>
        </div>

        {/* Formulario */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormSelect
                label="Máquina"
                name="maquinaId"
                value={formData.maquinaId}
                onChange={handleChange}
                options={maquinaOptions}
                required
              />
              <FormSelect
                label="Estado"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                options={estadoOptions}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Título"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                required
              />
              <FormInput
                label="Responsable"
                name="responsable"
                value={formData.responsable}
                onChange={handleChange}
                required
              />
            </div>

            <FormTextarea
              label="Descripción"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={2}
            />

            <FormTextarea
              label="Problema Identificado"
              name="problema"
              value={formData.problema}
              onChange={handleChange}
              required
              rows={3}
            />

            <FormTextarea
              label="Solución Propuesta"
              name="solucionPropuesta"
              value={formData.solucionPropuesta}
              onChange={handleChange}
              required
              rows={3}
            />

            {(formData.estado === 'Aprobada' || formData.estado === 'Implementada') && (
              <>
                <FormTextarea
                  label="Solución Implementada"
                  name="solucionImplementada"
                  value={formData.solucionImplementada}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describa cómo se implementó la solución"
                />
                <FormTextarea
                  label="Resultados"
                  name="resultados"
                  value={formData.resultados}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describa los resultados obtenidos"
                />
              </>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Costo Estimado"
                name="costoEstimado"
                type="number"
                value={formData.costoEstimado}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
              <FormInput
                label="Ahorro Estimado"
                name="ahorroEstimado"
                type="number"
                value={formData.ahorroEstimado}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </div>

            <FormTextarea
              label="Observaciones"
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              rows={2}
            />

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors font-medium"
              >
                {saving ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Guardar Cambios
                  </>
                )}
              </button>
              <Link
                href={`/mejoras/${params.id}`}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </>
  );
}
