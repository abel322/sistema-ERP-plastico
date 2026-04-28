'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormTextarea } from '@/components/forms/form-textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Save, X, Loader2 } from 'lucide-react';

interface Cliente {
  id: string;
  nombre: string;
  tipoProducto: string;
  ancho?: number;
  largo?: number;
  calibre?: number;
  unidadVenta: string;
}

export default function EditarPedidoPage() {
  const router = useRouter();
  const params = useParams();
  const pedidoId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(
    null
  );
  const [formData, setFormData] = useState({
    clienteId: '',
    cantidadSolicitada: '',
    unidad: '',
    fechaPedido: '',
    fechaEntrega: '',
    estado: '',
    prioridad: '',
    observaciones: '',
  });

  useEffect(() => {
    fetchClientes();
    if (pedidoId) {
      fetchPedido();
    }
  }, [pedidoId]);

  const fetchClientes = async () => {
    try {
      const res = await fetch('/api/clientes?limit=1000');
      const data = await res.json();
      setClientes(data?.clientes || []);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  const fetchPedido = async () => {
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}`);
      const data = await res.json();
      if (data) {
        setFormData({
          clienteId: data.clienteId || '',
          cantidadSolicitada: data.cantidadSolicitada?.toString() || '',
          unidad: data.unidad || '',
          fechaPedido: data.fechaPedido
            ? new Date(data.fechaPedido).toISOString().split('T')[0]
            : '',
          fechaEntrega: data.fechaEntrega
            ? new Date(data.fechaEntrega).toISOString().split('T')[0]
            : '',
          estado: data.estado || '',
          prioridad: data.prioridad || '',
          observaciones: data.observaciones || '',
        });
        // Buscar cliente seleccionado
        const cliente = await fetchClienteById(data.clienteId);
        setClienteSeleccionado(cliente);
      }
    } catch (error) {
      console.error('Error al cargar pedido:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClienteById = async (clienteId: string) => {
    try {
      const res = await fetch(`/api/clientes/${clienteId}`);
      return await res.json();
    } catch (error) {
      console.error('Error al cargar cliente:', error);
      return null;
    }
  };

  const handleClienteChange = async (clienteId: string) => {
    const cliente = clientes.find((c) => c?.id === clienteId);
    if (!cliente) {
      const fetchedCliente = await fetchClienteById(clienteId);
      setClienteSeleccionado(fetchedCliente);
    } else {
      setClienteSeleccionado(cliente);
    }
    setFormData({
      ...formData,
      clienteId,
      unidad: cliente?.unidadVenta || '',
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        clienteId: formData.clienteId,
        cantidadSolicitada: parseFloat(formData.cantidadSolicitada),
        unidad: formData.unidad,
        fechaPedido: new Date(formData.fechaPedido).toISOString(),
        fechaEntrega: new Date(formData.fechaEntrega).toISOString(),
        estado: formData.estado,
        prioridad: formData.prioridad,
        observaciones: formData.observaciones,
      };

      const res = await fetch(`/api/pedidos/${pedidoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push('/pedidos');
      } else {
        const error = await res.json();
        alert(error.error || 'Error al actualizar pedido');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar pedido');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center"><LoadingSpinner /></div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Pedido</h1>
            <p className="mt-1 text-gray-600">Actualizar información del pedido</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl bg-white p-8 shadow-md">
          <div className="space-y-6">
            {/* Selección de Cliente */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Selección de Cliente
              </h3>
              <div className="space-y-4">
                <FormSelect
                  label="Cliente"
                  required
                  value={formData.clienteId}
                  onChange={(e) => handleClienteChange(e.target.value)}
                  options={clientes.map((c) => ({
                    value: c?.id || '',
                    label: c?.nombre || 'Sin nombre',
                  }))}
                />

                {clienteSeleccionado && (
                  <div className="rounded-lg bg-blue-50 p-4">
                    <h4 className="mb-2 text-sm font-semibold text-blue-900">
                      Información del Producto
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                      <div>
                        <span className="font-medium">Tipo:</span>{' '}
                        {clienteSeleccionado?.tipoProducto || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Unidad:</span>{' '}
                        {clienteSeleccionado?.unidadVenta || 'N/A'}
                      </div>
                      {clienteSeleccionado?.ancho &&
                        clienteSeleccionado?.largo &&
                        clienteSeleccionado?.calibre && (
                          <div className="col-span-2">
                            <span className="font-medium">Medidas:</span>{' '}
                            {clienteSeleccionado.ancho}x{clienteSeleccionado.largo}x
                            {clienteSeleccionado.calibre} cm/μm
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Detalles del Pedido */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Detalles del Pedido
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormInput
                  label="Cantidad Solicitada"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.cantidadSolicitada}
                  onChange={(e) =>
                    setFormData({ ...formData, cantidadSolicitada: e.target.value })
                  }
                />
                <FormSelect
                  label="Unidad"
                  required
                  value={formData.unidad}
                  onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                  options={[
                    { value: 'Unidades', label: 'Unidades' },
                    { value: 'Kilogramos', label: 'Kilogramos' },
                    { value: 'Metros', label: 'Metros' },
                  ]}
                />
                <FormInput
                  label="Fecha del Pedido"
                  type="date"
                  required
                  value={formData.fechaPedido}
                  onChange={(e) =>
                    setFormData({ ...formData, fechaPedido: e.target.value })
                  }
                />
                <FormInput
                  label="Fecha Estimada de Entrega"
                  type="date"
                  required
                  value={formData.fechaEntrega}
                  onChange={(e) =>
                    setFormData({ ...formData, fechaEntrega: e.target.value })
                  }
                />
                <FormSelect
                  label="Estado"
                  required
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  options={[
                    { value: 'Pendiente', label: 'Pendiente' },
                    { value: 'EnProceso', label: 'En Proceso' },
                    { value: 'Completado', label: 'Completado' },
                  ]}
                />
                <FormSelect
                  label="Prioridad"
                  required
                  value={formData.prioridad}
                  onChange={(e) =>
                    setFormData({ ...formData, prioridad: e.target.value })
                  }
                  options={[
                    { value: 'Baja', label: 'Baja' },
                    { value: 'Media', label: 'Media' },
                    { value: 'Alta', label: 'Alta' },
                  ]}
                />
              </div>
              <div className="mt-4">
                <FormTextarea
                  label="Observaciones"
                  value={formData.observaciones}
                  onChange={(e) =>
                    setFormData({ ...formData, observaciones: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="mt-8 flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Guardar Cambios
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push('/pedidos')}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <X className="h-5 w-5" />
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
