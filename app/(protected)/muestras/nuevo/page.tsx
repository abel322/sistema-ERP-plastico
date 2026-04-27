'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, TestTube2 } from 'lucide-react';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormTextarea } from '@/components/forms/form-textarea';

const TIPOS = [
  { value: 'Produccion', label: 'Producción' },
  { value: 'ClienteNuevo', label: 'Cliente Nuevo' },
  { value: 'Reclamo', label: 'Reclamo' },
];

const UNIDADES = [
  { value: 'Unidades', label: 'Unidades' },
  { value: 'Kilogramos', label: 'Kilogramos' },
  { value: 'Metros', label: 'Metros' },
];

interface Cliente {
  id: string;
  nombre: string;
}

export default function NuevaMuestraPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [formData, setFormData] = useState({
    clienteId: '',
    tipo: 'Produccion',
    descripcion: '',
    cantidad: '',
    unidad: 'Unidades',
    responsable: '',
    observaciones: '',
    fecha: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const res = await fetch('/api/clientes?limit=1000');
      const data = await res.json();
      setClientes(data.clientes || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/muestras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear muestra');
      }

      router.push('/muestras');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Nueva Muestra</h1>
            <p className="text-sm text-gray-600">Registrar muestra de producción</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-white p-4 shadow-md sm:p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>
            )}

            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-medium text-purple-900">
                <TestTube2 className="h-5 w-5" />
                Información de la Muestra
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormSelect
                  label="Cliente"
                  value={formData.clienteId}
                  onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
                  required
                >
                  <option value="">Seleccione un cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </FormSelect>
                <FormSelect
                  label="Tipo de Muestra"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  required
                >
                  {TIPOS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </FormSelect>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Fecha"
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                required
              />
              <FormInput
                label="Responsable"
                value={formData.responsable}
                onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                placeholder="Nombre del responsable"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Cantidad"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.cantidad}
                onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                required
              />
              <FormSelect
                label="Unidad"
                value={formData.unidad}
                onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
              >
                {UNIDADES.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </FormSelect>
            </div>

            <FormTextarea
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Descripción de la muestra"
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
                disabled={loading || !formData.clienteId}
                className="flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                {loading ? 'Guardando...' : 'Registrar Muestra'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </>
  );
}
