'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormTextarea } from '@/components/forms/form-textarea';
import { Save, X, Loader2 } from 'lucide-react';

export default function NuevoClientePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
    const ancho = parseFloat(formData.ancho) || 0;
    const largo = parseFloat(formData.largo) || 0;
    const calibre = parseFloat(formData.calibre) || 0;

    if (ancho && largo && calibre) {
      const peso = (ancho * largo * calibre) / 1000;
      setFormData(prev => ({ ...prev, pesoPorUnidad: peso.toFixed(3) }));
    } else {
      setFormData(prev => ({ ...prev, pesoPorUnidad: '' }));
    }
  }, [formData.ancho, formData.largo, formData.calibre]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

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

      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push('/clientes');
      } else {
        const error = await res.json();
        alert(error.error || 'Error al crear cliente');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nuevo Cliente</h1>
            <p className="mt-1 text-gray-600">Registrar un nuevo cliente</p>
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
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Guardar Cliente
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
