'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Lightbulb,
  ArrowLeft,
  Edit,
  Settings,
  User,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Mejora {
  id: string;
  titulo: string;
  descripcion?: string;
  problema: string;
  solucionPropuesta: string;
  solucionImplementada?: string;
  responsable: string;
  estado: string;
  fecha: string;
  costoEstimado?: number;
  ahorroEstimado?: number;
  fechaImplementacion?: string;
  resultados?: string;
  observaciones?: string;
  creadoPor: string;
  maquina: {
    id: string;
    nombre: string;
    area: string;
  };
}

const estadoConfig: Record<string, { color: string; bgColor: string; icon: React.ElementType; label: string }> = {
  Propuesta: { color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Lightbulb, label: 'Propuesta' },
  EnEvaluacion: { color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: Clock, label: 'En Evaluación' },
  Aprobada: { color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle, label: 'Aprobada' },
  Implementada: { color: 'text-emerald-700', bgColor: 'bg-emerald-100', icon: TrendingUp, label: 'Implementada' },
  Rechazada: { color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle, label: 'Rechazada' },
};

export default function DetalleMejoraPage() {
  const params = useParams();
  const [mejora, setMejora] = useState<Mejora | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMejora = async () => {
      try {
        const res = await fetch(`/api/mejoras/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setMejora(data);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchMejora();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center"><LoadingSpinner /></div>
    );
  }

  if (!mejora) {
    return (
      <>
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg text-gray-600">Mejora no encontrada</p>
          <Link href="/mejoras" className="text-blue-600 hover:underline mt-2 inline-block">
            Volver a Mejoras
          </Link>
        </div>
      </>
    );
  }

  const config = estadoConfig[mejora.estado] || estadoConfig.Propuesta;
  const Icon = config.icon;

  return (
    <>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/mejoras"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Mejoras
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                {mejora.titulo}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${config.bgColor} ${config.color}`}>
                  <Icon className="h-4 w-4" />
                  {config.label}
                </span>
                <span className="text-sm text-gray-500">
                  Creado el {format(new Date(mejora.fecha), "d 'de' MMMM, yyyy", { locale: es })}
                </span>
              </div>
            </div>
            <Link
              href={`/mejoras/${mejora.id}/editar`}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          {/* Info principal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Settings className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Máquina</p>
                  <p className="font-medium text-gray-800">{mejora.maquina.nombre}</p>
                  <p className="text-xs text-gray-500">{mejora.maquina.area}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Responsable</p>
                  <p className="font-medium text-gray-800">{mejora.responsable}</p>
                </div>
              </div>
              {mejora.costoEstimado && (
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                  <DollarSign className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-xs text-red-600">Costo Estimado</p>
                    <p className="font-medium text-red-700">
                      ${mejora.costoEstimado.toLocaleString('es-VE')}
                    </p>
                  </div>
                </div>
              )}
              {mejora.ahorroEstimado && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-xs text-green-600">Ahorro Estimado</p>
                    <p className="font-medium text-green-700">
                      ${mejora.ahorroEstimado.toLocaleString('es-VE')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {mejora.descripcion && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Descripción</h3>
                <p className="text-gray-700">{mejora.descripcion}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  Problema Identificado
                </h3>
                <p className="text-gray-700 bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                  {mejora.problema}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  Solución Propuesta
                </h3>
                <p className="text-gray-700 bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                  {mejora.solucionPropuesta}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Implementación y resultados */}
          {(mejora.solucionImplementada || mejora.resultados || mejora.fechaImplementacion) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Implementación
              </h2>
              {mejora.fechaImplementacion && (
                <p className="text-sm text-gray-500 mb-4">
                  Implementado el {format(new Date(mejora.fechaImplementacion), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              )}
              {mejora.solucionImplementada && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Solución Implementada</h3>
                  <p className="text-gray-700 bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                    {mejora.solucionImplementada}
                  </p>
                </div>
              )}
              {mejora.resultados && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Resultados</h3>
                  <p className="text-gray-700 bg-emerald-50 p-4 rounded-lg border-l-4 border-emerald-400">
                    {mejora.resultados}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Observaciones */}
          {mejora.observaciones && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                Observaciones
              </h2>
              <p className="text-gray-700">{mejora.observaciones}</p>
            </motion.div>
          )}

          {/* Meta info */}
          <div className="text-xs text-gray-400 text-center">
            Creado por: {mejora.creadoPor}
          </div>
        </div>
      </div>
    </>
  );
}
