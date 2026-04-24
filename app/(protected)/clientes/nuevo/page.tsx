'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormTextarea } from '@/components/forms/form-textarea';
import { Save, X, Loader2, Settings, Package } from 'lucide-react';

export default function NuevoClientePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basico');
  const [formData, setFormData] = useState({
    // Información básica
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
    
    // Parámetros de Extrusión
    extTemperaturaAmbiente: '',
    extMotorPrincipal: '',
    extTraccion: '',
    extSopladorPrincipal: '',
    extAberturaBlower: '',
    extCuelloGlobo: '',
    extTemperaturaCuelloGlobo: '',
    extTraccionRebobinador: '',
    extRebobinadorWinding1: '',
    extRebobinadorWinding2: '',
    extIntensidadTratador: '',
    extTemperaturaZ1: '',
    extTemperaturaZ2: '',
    extTemperaturaZ3: '',
    extTemperaturaZ4: '',
    extTemperaturaZ5: '',
    extTemperaturaZ6: '',
    extTemperaturaZ7: '',
    extTemperaturaZ8: '',
    extTemperaturaZ9: '',
    extTemperaturaZ10: '',
    extTemperaturaZ11: '',
    extTemperaturaZ12: '',
    extTemperaturaZ13: '',
    extTemperaturaZ14: '',
    extTemperaturaZ15: '',
    extTemperaturaZ16: '',
    extTemperaturaZ17: '',
    extTemperaturaZ18: '',
    extTemperaturaZ19: '',
    extTemperaturaZ20: '',
    extOrientacionFlujoBlower: '',
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
        // Convertir campos numéricos básicos
        ancho: formData.ancho ? parseFloat(formData.ancho) : null,
        largo: formData.largo ? parseFloat(formData.largo) : null,
        calibre: formData.calibre ? parseFloat(formData.calibre) : null,
        anchoBobina: formData.anchoBobina ? parseFloat(formData.anchoBobina) : null,
        pesoPorUnidad: formData.pesoPorUnidad ? parseFloat(formData.pesoPorUnidad) : null,
        
        // Convertir parámetros de extrusión (decimales)
        extTemperaturaAmbiente: formData.extTemperaturaAmbiente ? parseFloat(formData.extTemperaturaAmbiente) : null,
        extMotorPrincipal: formData.extMotorPrincipal ? parseFloat(formData.extMotorPrincipal) : null,
        extTraccion: formData.extTraccion ? parseFloat(formData.extTraccion) : null,
        extSopladorPrincipal: formData.extSopladorPrincipal ? parseFloat(formData.extSopladorPrincipal) : null,
        extAberturaBlower: formData.extAberturaBlower ? parseFloat(formData.extAberturaBlower) : null,
        extCuelloGlobo: formData.extCuelloGlobo ? parseFloat(formData.extCuelloGlobo) : null,
        extTemperaturaCuelloGlobo: formData.extTemperaturaCuelloGlobo ? parseFloat(formData.extTemperaturaCuelloGlobo) : null,
        extTraccionRebobinador: formData.extTraccionRebobinador ? parseFloat(formData.extTraccionRebobinador) : null,
        extRebobinadorWinding1: formData.extRebobinadorWinding1 ? parseFloat(formData.extRebobinadorWinding1) : null,
        extRebobinadorWinding2: formData.extRebobinadorWinding2 ? parseFloat(formData.extRebobinadorWinding2) : null,
        extIntensidadTratador: formData.extIntensidadTratador ? parseFloat(formData.extIntensidadTratador) : null,
        extOrientacionFlujoBlower: formData.extOrientacionFlujoBlower ? parseFloat(formData.extOrientacionFlujoBlower) : null,
        
        // Convertir temperaturas (enteros)
        extTemperaturaZ1: formData.extTemperaturaZ1 ? parseInt(formData.extTemperaturaZ1) : null,
        extTemperaturaZ2: formData.extTemperaturaZ2 ? parseInt(formData.extTemperaturaZ2) : null,
        extTemperaturaZ3: formData.extTemperaturaZ3 ? parseInt(formData.extTemperaturaZ3) : null,
        extTemperaturaZ4: formData.extTemperaturaZ4 ? parseInt(formData.extTemperaturaZ4) : null,
        extTemperaturaZ5: formData.extTemperaturaZ5 ? parseInt(formData.extTemperaturaZ5) : null,
        extTemperaturaZ6: formData.extTemperaturaZ6 ? parseInt(formData.extTemperaturaZ6) : null,
        extTemperaturaZ7: formData.extTemperaturaZ7 ? parseInt(formData.extTemperaturaZ7) : null,
        extTemperaturaZ8: formData.extTemperaturaZ8 ? parseInt(formData.extTemperaturaZ8) : null,
        extTemperaturaZ9: formData.extTemperaturaZ9 ? parseInt(formData.extTemperaturaZ9) : null,
        extTemperaturaZ10: formData.extTemperaturaZ10 ? parseInt(formData.extTemperaturaZ10) : null,
        extTemperaturaZ11: formData.extTemperaturaZ11 ? parseInt(formData.extTemperaturaZ11) : null,
        extTemperaturaZ12: formData.extTemperaturaZ12 ? parseInt(formData.extTemperaturaZ12) : null,
        extTemperaturaZ13: formData.extTemperaturaZ13 ? parseInt(formData.extTemperaturaZ13) : null,
        extTemperaturaZ14: formData.extTemperaturaZ14 ? parseInt(formData.extTemperaturaZ14) : null,
        extTemperaturaZ15: formData.extTemperaturaZ15 ? parseInt(formData.extTemperaturaZ15) : null,
        extTemperaturaZ16: formData.extTemperaturaZ16 ? parseInt(formData.extTemperaturaZ16) : null,
        extTemperaturaZ17: formData.extTemperaturaZ17 ? parseInt(formData.extTemperaturaZ17) : null,
        extTemperaturaZ18: formData.extTemperaturaZ18 ? parseInt(formData.extTemperaturaZ18) : null,
        extTemperaturaZ19: formData.extTemperaturaZ19 ? parseInt(formData.extTemperaturaZ19) : null,
        extTemperaturaZ20: formData.extTemperaturaZ20 ? parseInt(formData.extTemperaturaZ20) : null,
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
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nuevo Cliente</h1>
            <p className="mt-1 text-gray-600">Registrar un nuevo cliente</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl bg-white shadow-md">
          {/* Tabs Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8 pt-6" aria-label="Tabs">
              <button
                type="button"
                onClick={() => setActiveTab('basico')}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium ${
                  activeTab === 'basico'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Package className="h-4 w-4" />
                Información Básica
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('maquinas')}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium ${
                  activeTab === 'maquinas'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Settings className="h-4 w-4" />
                Parámetros de Máquinas
              </button>
            </nav>
          </div>

          <div className="p-8">
            {/* Tab: Información Básica */}
            {activeTab === 'basico' && (
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
            )}

            {/* Tab: Parámetros de Máquinas */}
            {activeTab === 'maquinas' && (
              <div className="space-y-6">
                {/* Parámetros de Extrusión */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">
                    Parámetros de Extrusión
                  </h3>
                  
                  {/* Parámetros Generales */}
                  <div className="mb-6">
                    <h4 className="mb-3 text-md font-medium text-gray-700">Parámetros Generales</h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <FormInput
                        label="Temperatura Ambiente"
                        type="number"
                        step="0.01"
                        value={formData.extTemperaturaAmbiente}
                        onChange={(e) => setFormData({ ...formData, extTemperaturaAmbiente: e.target.value })}
                      />
                      <FormInput
                        label="Motor Principal"
                        type="number"
                        step="0.01"
                        value={formData.extMotorPrincipal}
                        onChange={(e) => setFormData({ ...formData, extMotorPrincipal: e.target.value })}
                      />
                      <FormInput
                        label="Tracción"
                        type="number"
                        step="0.01"
                        value={formData.extTraccion}
                        onChange={(e) => setFormData({ ...formData, extTraccion: e.target.value })}
                      />
                      <FormInput
                        label="Soplador Principal"
                        type="number"
                        step="0.01"
                        value={formData.extSopladorPrincipal}
                        onChange={(e) => setFormData({ ...formData, extSopladorPrincipal: e.target.value })}
                      />
                      <FormInput
                        label="Abertura del Blower"
                        type="number"
                        step="0.01"
                        value={formData.extAberturaBlower}
                        onChange={(e) => setFormData({ ...formData, extAberturaBlower: e.target.value })}
                      />
                      <FormInput
                        label="Orientación Flujo del Blower"
                        type="number"
                        step="0.01"
                        value={formData.extOrientacionFlujoBlower}
                        onChange={(e) => setFormData({ ...formData, extOrientacionFlujoBlower: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Parámetros del Globo */}
                  <div className="mb-6">
                    <h4 className="mb-3 text-md font-medium text-gray-700">Parámetros del Globo</h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <FormInput
                        label="Cuello del Globo"
                        type="number"
                        step="0.01"
                        value={formData.extCuelloGlobo}
                        onChange={(e) => setFormData({ ...formData, extCuelloGlobo: e.target.value })}
                      />
                      <FormInput
                        label="Temperatura Cuello del Globo"
                        type="number"
                        step="0.01"
                        value={formData.extTemperaturaCuelloGlobo}
                        onChange={(e) => setFormData({ ...formData, extTemperaturaCuelloGlobo: e.target.value })}
                      />
                      <FormInput
                        label="Intensidad del Tratador"
                        type="number"
                        step="0.01"
                        value={formData.extIntensidadTratador}
                        onChange={(e) => setFormData({ ...formData, extIntensidadTratador: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Parámetros del Rebobinador */}
                  <div className="mb-6">
                    <h4 className="mb-3 text-md font-medium text-gray-700">Parámetros del Rebobinador</h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <FormInput
                        label="Tracción del Rebobinador"
                        type="number"
                        step="0.01"
                        value={formData.extTraccionRebobinador}
                        onChange={(e) => setFormData({ ...formData, extTraccionRebobinador: e.target.value })}
                      />
                      <FormInput
                        label="Rebobinador Winding 1"
                        type="number"
                        step="0.01"
                        value={formData.extRebobinadorWinding1}
                        onChange={(e) => setFormData({ ...formData, extRebobinadorWinding1: e.target.value })}
                      />
                      <FormInput
                        label="Rebobinador Winding 2"
                        type="number"
                        step="0.01"
                        value={formData.extRebobinadorWinding2}
                        onChange={(e) => setFormData({ ...formData, extRebobinadorWinding2: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Temperaturas por Zonas */}
                  <div className="mb-6">
                    <h4 className="mb-3 text-md font-medium text-gray-700">Temperaturas por Zonas (°C)</h4>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                      {Array.from({ length: 20 }, (_, i) => i + 1).map((zone) => (
                        <FormInput
                          key={zone}
                          label={`Zona ${zone}`}
                          type="number"
                          min="0"
                          max="500"
                          value={formData[`extTemperaturaZ${zone}` as keyof typeof formData]}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            [`extTemperaturaZ${zone}`]: e.target.value 
                          })}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Parámetros de Sellado */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">
                    Parámetros de Sellado
                  </h3>
                  <div className="rounded-lg bg-gray-50 p-6 text-center">
                    <p className="text-gray-600">
                      Los parámetros de sellado se configurarán en una futura actualización.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="border-t border-gray-200 px-8 py-6">
            <div className="flex gap-4">
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
          </div>
        </form>
      </div>
    </>
  );
}
