'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lightbulb, ArrowLeft, Save } from 'lucide-react';
import { FormInput } from '@/components/forms/form-input';
import { FormTextarea } from '@/components/forms/form-textarea';
import { FormSelect } from '@/components/forms/form-select';

interface Maquina {
  id: string;
  nombre: string;
  area: string;
}

export default function NuevaMejoraPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);

  const [formData, setFormData] = useState({
    maquinaId: '',
    titulo: '',
    descripcion: '',
    problema: '',
    solucionPropuesta: '',
    responsable: '',
    costoEstimado: '',
    ahorroEstimado: '',
    observaciones: '',
  });

  useEffect(() => {
    const fetchMaquinas = async () => {
      try {
        const res = await fetch('/api/maquinas');
        if (res.ok) {
          const data = await res.json();
          setMaquinas(data);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    fetchMaquinas();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/mejoras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/mejoras');
      } else {
        const data = await res.json();
        setError(data.error || 'Error al crear mejora');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

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
            href="/mejoras"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Mejoras
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Lightbulb className="h-7 w-7 sm:h-8 sm:w-8 text-yellow-500" />
            Nueva Propuesta de Mejora
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Registre una nueva idea de mejora para una máquina
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
                placeholder="Seleccione una máquina"
              />
              <FormInput
                label="Responsable"
                name="responsable"
                value={formData.responsable}
                onChange={handleChange}
                required
                placeholder="Nombre del responsable"
              />
            </div>

            <FormInput
              label="Título de la Mejora"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              required
              placeholder="Ej: Optimización del sistema de enfriamiento"
            />

            <FormTextarea
              label="Descripción (opcional)"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={2}
              placeholder="Descripción general de la mejora"
            />

            <FormTextarea
              label="Problema Identificado"
              name="problema"
              value={formData.problema}
              onChange={handleChange}
              required
              rows={3}
              placeholder="Describa el problema actual que se desea resolver"
            />

            <FormTextarea
              label="Solución Propuesta"
              name="solucionPropuesta"
              value={formData.solucionPropuesta}
              onChange={handleChange}
              required
              rows={3}
              placeholder="Describa la solución que propone implementar"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Costo Estimado (opcional)"
                name="costoEstimado"
                type="number"
                value={formData.costoEstimado}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              <FormInput
                label="Ahorro Estimado (opcional)"
                name="ahorroEstimado"
                type="number"
                value={formData.ahorroEstimado}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <FormTextarea
              label="Observaciones (opcional)"
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              rows={2}
              placeholder="Notas adicionales"
            />

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors font-medium"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Guardar Propuesta
                  </>
                )}
              </button>
              <Link
                href="/mejoras"
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
