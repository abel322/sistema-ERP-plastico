'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormTextarea } from '@/components/forms/form-textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Save, X, Loader2 } from 'lucide-react';

export default function EditarClientePage() {
  const router = useRouter();
  const params = useParams();
  const clienteId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    rif: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
    tipoProducto: '',
    ancho: '',
    largo: '',
    calibre: '',
    pesoPorUnidad: '',
    color: '',
    material: '',
    unidadVenta: '',
    observaciones: '',
    anchoBobina: '',
  });

  useEffect(() => {
    if (clienteId) {
      fetchCliente();
    }
  }, [clienteId]);

  useEffect(() => {
    const ancho = parseFloat(formData.ancho) || 0;
    const largo = parseFloat(formData.largo) || 0;
    const calibre = parseFloat(formData.calibre) || 0;

    if (ancho && largo && calibre) {
      const peso = (ancho * largo * calibre) / 1000;
      setFormData(prev => ({ ...prev, pesoPorUnidad: peso.toFixed(3) }));
    }
    // We don't reset to empty here to avoid flickering during fetchCliente
  }, [formData.ancho, formData.largo, formData.calibre]);

  const fetchCliente = async () => {
    try {
      const res = await fetch(`/api/clientes/${clienteId}`);
      const data = await res.json();
      if (data) {
        setFormData({
          nombre: data.nombre || '',
          rif: data.rif || '',
          contacto: data.contacto || '',
          telefono: data.telefono || '',
          email: data.email || '',
          direccion: data.direccion || '',
          tipoProducto: data.tipoProducto || '',
          ancho: data.ancho?.toString() || '',
          largo: data.largo?.toString() || '',
          calibre: data.calibre?.toString() || '',
          pesoPorUnidad: data.pesoPorUnidad?.toString() || '',
          color: data.color || '',
          material: data.material || '',
          unidadVenta: data.unidadVenta || '',
          observaciones: data.observaciones || '',
          anchoBobina: data.anchoBobina?.toString() || '',
        });
      }
    } catch (error) {
      console.error('Error al cargar cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        ancho: formData.ancho ? parseFloat(formData.ancho) : null,
        largo: formData.largo ? parseFloat(formData.largo) : null,
        calibre: formData.calibre ? parseFloat(formData.calibre) : null,
        anchoBobina: formData.anchoBobina ? parseFloat(formData.anchoBobina) : null,
        pesoPorUnidad: formData.pesoPorUnidad
          ? parseFloat(formData.pesoPorUnidad)
          : null,
      };

      const res = await fetch(`/api/clientes/${clienteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push('/clientes');
      } else {
        const error = await res.json();
        alert(error.error || 'Error al actualizar cliente');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar cliente');
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
            <h1 className="text-3xl font-bold text-gray-900">Editar Cliente</h1>
            <p className="mt-1 text-gray-600">Actualizar información del cliente</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl bg-white p-8 shadow-md">
          <div className="space-y-6">
            {/* Información Básica */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Información Básica
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormInput
                  label="Nombre del Cliente"
                  required
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                />
                <FormInput
                  label="RIF/NIT"
                  required
                  value={formData.rif}
                  onChange={(e) => setFormData({ ...formData, rif: e.target.value })}
                />
                <FormInput
                  label="Persona de Contacto"
                  value={formData.contacto}
                  onChange={(e) =>
                    setFormData({ ...formData, contacto: e.target.value })
                  }
                />
                <FormInput
                  label="Teléfono"
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                />
                <FormInput
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="mt-4">
                <FormTextarea
                  label="Dirección"
                  value={formData.direccion}
                  onChange={(e) =>
                    setFormData({ ...formData, direccion: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Información del Producto */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Información del Producto
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormSelect
                  label="Tipo de Producto"
                  required
                  value={formData.tipoProducto}
                  onChange={(e) =>
                    setFormData({ ...formData, tipoProducto: e.target.value })
                  }
                  options={[
                    { value: 'Bolsa', label: 'Bolsa' },
                    { value: 'Bobina', label: 'Bobina' },
                  ]}
                />
                <FormSelect
                  label="Unidad de Venta"
                  required
                  value={formData.unidadVenta}
                  onChange={(e) =>
                    setFormData({ ...formData, unidadVenta: e.target.value })
                  }
                  options={[
                    { value: 'Unidades', label: 'Unidades' },
                    { value: 'Kilogramos', label: 'Kilogramos' },
                    { value: 'Metros', label: 'Metros' },
                  ]}
                />
                {formData.tipoProducto === 'Bobina' ? (
                  <FormInput
                    label="Ancho de Bobina (cm)"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.anchoBobina}
                    onChange={(e) => setFormData({ ...formData, anchoBobina: e.target.value })}
                  />
                ) : (
                  <>
                    <FormInput
                      label="Ancho (cm)"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.ancho}
                      onChange={(e) => setFormData({ ...formData, ancho: e.target.value })}
                    />
                    <FormInput
                      label="Largo (cm)"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.largo}
                      onChange={(e) => setFormData({ ...formData, largo: e.target.value })}
                    />
                  </>
                )}
                <FormInput
                  label="Calibre/Espesor (μm)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.calibre}
                  onChange={(e) =>
                    setFormData({ ...formData, calibre: e.target.value })
                  }
                />
                <FormInput
                  label="Peso por Unidad (kg)"
                  type="number"
                  step="0.001"
                  min="0"
                  readOnly
                  value={formData.pesoPorUnidad}
                  className="bg-gray-50 cursor-not-allowed"
                  onChange={() => { }} // Controlled read-only
                />
                <FormInput
                  label="Color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
                <FormInput
                  label="Material"
                  placeholder="ej: PEBD, PEAD, PP"
                  value={formData.material}
                  onChange={(e) =>
                    setFormData({ ...formData, material: e.target.value })
                  }
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
              onClick={() => router.push('/clientes')}
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
