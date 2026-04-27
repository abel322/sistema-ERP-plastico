'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Factory,
  ArrowLeft,
  Loader2,
  Save,
  Package,
} from 'lucide-react';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormTextarea } from '@/components/forms/form-textarea';

const AREAS = [
  { value: 'Extrusion', label: 'Extrusión' },
  { value: 'Sellado', label: 'Sellado' },
  { value: 'Serigrafia', label: 'Serigrafía' },
  { value: 'Refilado', label: 'Refilado' },
];

const TURNOS = [
  { value: 'Manana', label: 'Mañana (6:00 - 14:00)' },
  { value: 'Tarde', label: 'Tarde (14:00 - 22:00)' },
  { value: 'Noche', label: 'Noche (22:00 - 6:00)' },
];

const UNIDADES = [
  { value: 'Unidades', label: 'Unidades' },
  { value: 'Kilogramos', label: 'Kilogramos' },
  { value: 'Metros', label: 'Metros' },
];

interface Maquina {
  id: string;
  nombre: string;
  area: string;
}

interface Pedido {
  id: string;
  cantidadSolicitada: number;
  cantidadProducida: number;
  unidad: string;
  cliente: { nombre: string; tipoProducto: string };
}

export default function NuevaProduccionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [vincularPedido, setVincularPedido] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    fecha: today,
    turno: 'Manana',
    area: 'Extrusion',
    maquinaId: '',
    operario: '',
    pedidoId: '',
    cantidadProducida: '',
    unidad: 'Kilogramos',
    merma: '0',
    horaInicio: '',
    horaFin: '',
    observaciones: '',
  });

  useEffect(() => {
    fetchMaquinas();
    fetchPedidos();
  }, []);

  useEffect(() => {
    // Filtrar máquinas cuando cambia el área
    if (formData.area) {
      setFormData((prev) => ({ ...prev, maquinaId: '' }));
    }
  }, [formData.area]);

  const fetchMaquinas = async () => {
    try {
      const res = await fetch('/api/maquinas?activa=true');
      const data = await res.json();
      setMaquinas(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchPedidos = async () => {
    try {
      const res = await fetch('/api/pedidos?estado=Pendiente,EnProceso&limit=100');
      const data = await res.json();
      setPedidos(data.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handlePedidoChange = (pedidoId: string) => {
    setFormData({ ...formData, pedidoId });
    const pedido = pedidos.find((p) => p.id === pedidoId);
    if (pedido) {
      setSelectedPedido(pedido);
      // Extrusión siempre trabaja en Kilogramos, independientemente de la unidad del pedido
      const unidadProduccion = formData.area === 'Extrusion' ? 'Kilogramos' : pedido.unidad;
      setFormData((prev) => ({
        ...prev,
        pedidoId,
        unidad: unidadProduccion,
      }));
    } else {
      setSelectedPedido(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/produccion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          pedidoId: vincularPedido ? formData.pedidoId : null,
        }),
      });

      if (res.ok) {
        router.push('/produccion');
      } else {
        const data = await res.json();
        alert(data.error || 'Error al registrar producción');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al registrar producción');
    } finally {
      setLoading(false);
    }
  };

  const maquinasFiltradas = maquinas.filter((m) => m.area === formData.area);

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/produccion"
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Registrar Producción</h1>
            <p className="text-gray-600">Complete los datos del registro de producción</p>
          </div>
        </div>

        {/* Formulario */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="rounded-xl bg-white p-6 shadow-sm space-y-6"
        >
          {/* Información Básica */}
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Factory className="h-5 w-5 text-blue-600" />
              Información Básica
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Fecha"
                type="date"
                required
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              />
              <FormSelect
                label="Turno"
                required
                value={formData.turno}
                onChange={(e) => setFormData({ ...formData, turno: e.target.value })}
                options={TURNOS}
              />
              <FormSelect
                label="Área de Producción"
                required
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                options={AREAS}
              />
              <FormSelect
                label="Máquina"
                required
                value={formData.maquinaId}
                onChange={(e) => setFormData({ ...formData, maquinaId: e.target.value })}
                options={[
                  { value: '', label: 'Seleccione una máquina' },
                  ...maquinasFiltradas.map((m) => ({ value: m.id, label: m.nombre })),
                ]}
              />
              <div className="sm:col-span-2">
                <FormInput
                  label="Operario"
                  required
                  value={formData.operario}
                  onChange={(e) => setFormData({ ...formData, operario: e.target.value })}
                  placeholder="Nombre del operario"
                />
              </div>
            </div>
          </div>

          {/* Vincular a Pedido */}
          <div className="border-t pt-6">
            <div className="mb-4 flex items-center gap-3">
              <input
                type="checkbox"
                id="vincularPedido"
                checked={vincularPedido}
                onChange={(e) => setVincularPedido(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="vincularPedido" className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Package className="h-5 w-5 text-blue-600" />
                Vincular a Pedido
              </label>
            </div>
            {vincularPedido && (
              <div className="space-y-4">
                <FormSelect
                  label="Seleccionar Pedido"
                  value={formData.pedidoId}
                  onChange={(e) => handlePedidoChange(e.target.value)}
                  options={[
                    { value: '', label: 'Seleccione un pedido' },
                    ...pedidos.map((p) => ({
                      value: p.id,
                      label: `${p.cliente.nombre} - ${p.cantidadSolicitada - p.cantidadProducida} ${p.unidad} pendientes`,
                    })),
                  ]}
                />
                {selectedPedido && (
                  <div className="rounded-lg bg-blue-50 p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Cliente:</strong> {selectedPedido.cliente.nombre}<br />
                      <strong>Producto:</strong> {selectedPedido.cliente.tipoProducto}<br />
                      <strong>Solicitado:</strong> {selectedPedido.cantidadSolicitada} {selectedPedido.unidad}<br />
                      <strong>Producido:</strong> {selectedPedido.cantidadProducida} {selectedPedido.unidad}<br />
                      <strong>Pendiente:</strong> {selectedPedido.cantidadSolicitada - selectedPedido.cantidadProducida} {selectedPedido.unidad}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cantidad y Merma */}
          <div className="border-t pt-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Cantidad Producida</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormInput
                label="Cantidad Producida"
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.cantidadProducida}
                onChange={(e) => setFormData({ ...formData, cantidadProducida: e.target.value })}
                placeholder="0.00"
              />
              <FormSelect
                label="Unidad"
                required
                value={formData.unidad}
                onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                options={UNIDADES}
              />
              <FormInput
                label="Merma/Desperdicio (kg)"
                type="number"
                min="0"
                step="0.01"
                value={formData.merma}
                onChange={(e) => setFormData({ ...formData, merma: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Horario */}
          <div className="border-t pt-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Horario de Producción</h2>
            <div className="grid gap-4 sm:grid-cols-2">
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
          </div>

          {/* Observaciones */}
          <div className="border-t pt-6">
            <FormTextarea
              label="Observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Notas adicionales sobre la producción..."
              rows={3}
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 border-t pt-6">
            <Link
              href="/produccion"
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-400"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Registrar Producción
                </>
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </>
  );
}
