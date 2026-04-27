'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ClipboardCheck, ArrowLeft, Save } from 'lucide-react';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormTextarea } from '@/components/forms/form-textarea';

interface Parametro {
  id: string;
  nombre: string;
  valorMinimo?: number;
  valorMaximo?: number;
  unidad: string;
}

export default function NuevaInspeccionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parametros, setParametros] = useState<Parametro[]>([]);

  const [formData, setFormData] = useState({
    lote: '',
    inspector: '',
    resultado: 'Aprobado',
    observaciones: '',
  });

  const [valoresParametros, setValoresParametros] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchParametros = async () => {
      try {
        const res = await fetch('/api/calidad/parametros?activo=true');
        if (res.ok) {
          const data = await res.json();
          setParametros(data);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    fetchParametros();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleParametroChange = (parametroId: string, valor: number) => {
    setValoresParametros((prev) => ({ ...prev, [parametroId]: valor }));
  };

  const verificarCumplimiento = (parametro: Parametro, valor: number): boolean => {
    if (parametro.valorMinimo != null && valor < parametro.valorMinimo) return false;
    if (parametro.valorMaximo != null && valor > parametro.valorMaximo) return false;
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const resultadosParams = Object.entries(valoresParametros).map(([parametroId, valor]) => {
      const param = parametros.find((p) => p.id === parametroId);
      return {
        parametroId,
        valorMedido: valor,
        cumple: param ? verificarCumplimiento(param, valor) : true,
      };
    });

    try {
      const res = await fetch('/api/calidad/inspecciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          resultadosParams,
        }),
      });

      if (res.ok) {
        router.push('/calidad');
      } else {
        const data = await res.json();
        setError(data.error || 'Error al crear inspección');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const resultadoOptions = [
    { value: 'Aprobado', label: 'Aprobado' },
    { value: 'AprobadoConObservaciones', label: 'Aprobado con Observaciones' },
    { value: 'Rechazado', label: 'Rechazado' },
  ];

  return (
    <>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            href="/calidad"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Calidad
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
            <ClipboardCheck className="h-7 w-7 sm:h-8 sm:w-8 text-teal-600" />
            Nueva Inspección de Calidad
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Datos de la Inspección</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Lote (opcional)"
                name="lote"
                value={formData.lote}
                onChange={handleChange}
                placeholder="Número de lote"
              />
              <FormInput
                label="Inspector"
                name="inspector"
                value={formData.inspector}
                onChange={handleChange}
                required
                placeholder="Nombre del inspector"
              />
            </div>
            <div className="mt-4">
              <FormSelect
                label="Resultado"
                name="resultado"
                value={formData.resultado}
                onChange={handleChange}
                options={resultadoOptions}
                required
              />
            </div>
            <div className="mt-4">
              <FormTextarea
                label="Observaciones"
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                rows={3}
                placeholder="Observaciones de la inspección"
              />
            </div>
          </motion.div>

          {parametros.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Parámetros de Calidad</h2>
              <div className="space-y-4">
                {parametros.map((param) => {
                  const valor = valoresParametros[param.id] || 0;
                  const cumple = verificarCumplimiento(param, valor);
                  return (
                    <div key={param.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{param.nombre}</p>
                        <p className="text-xs text-gray-500">
                          Rango: {param.valorMinimo ?? '-'} - {param.valorMaximo ?? '-'} {param.unidad}
                        </p>
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          value={valoresParametros[param.id] || ''}
                          onChange={(e) => handleParametroChange(param.id, parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="w-20 text-center">
                        <span className="text-xs text-gray-500">{param.unidad}</span>
                      </div>
                      {valoresParametros[param.id] !== undefined && (
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          cumple ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {cumple ? 'OK' : 'NO'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors font-medium"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Guardar Inspección
                </>
              )}
            </button>
            <Link
              href="/calidad"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
