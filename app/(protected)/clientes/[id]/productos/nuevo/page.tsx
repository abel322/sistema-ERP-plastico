'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ArrowLeft, Save, Package, Droplets, Palette, Cog, Settings } from 'lucide-react';

type TabType = 'basico' | 'formulacion' | 'serigrafia' | 'extrusion' | 'sellado';

export default function NuevoProductoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const clienteId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('basico');
  const [formData, setFormData] = useState<any>({
    nombreProducto: '',
    activo: true,
    tipoProducto: 'Bolsa',
    conImpresion: false,
    unidadVenta: 'Unidades',
    material: ''
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/clientes/${clienteId}/productos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Producto creado exitosamente');
        router.push(`/clientes/${clienteId}/productos`);
      } else {
        const error = await response.json();
        alert(error.error || 'Error al crear producto');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear producto');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => {
      const newData = { ...prev, [field]: value };
      
      // Si se desactiva la impresión y estamos en el tab de serigrafía, cambiar a básico
      if (field === 'conImpresion' && !value && activeTab === 'serigrafia') {
        setActiveTab('basico');
      }
      
      return newData;
    });
  };

  // Auto-calcular pesoPorUnidad a partir de dimensiones y calibre
  useEffect(() => {
    let peso = 0;
    const calibre = parseFloat(formData.calibre) || 0;
    
    if (formData.tipoProducto === 'Bolsa') {
      const ancho = parseFloat(formData.ancho) || 0;
      const largo = parseFloat(formData.largo) || 0;
      if (ancho && largo && calibre) {
        peso = (ancho * largo * calibre) / 1000;
      }
    } else if (formData.tipoProducto === 'Bobina') {
      const anchoBobina = parseFloat(formData.anchoBobina) || 0;
      if (anchoBobina && calibre) {
        peso = (anchoBobina * calibre) / 100;
      }
    }
    
    if (peso > 0) {
      setFormData((prev: any) => ({ ...prev, pesoPorUnidad: parseFloat(peso.toFixed(3)) }));
    }
  }, [formData.tipoProducto, formData.ancho, formData.largo, formData.anchoBobina, formData.calibre]);

  // Auto-calcular cilindro según tipo de producto y sellado
  useEffect(() => {
    let calculatedValue = '';
    
    if (formData.tipoProducto === 'Bolsa') {
      const repeticiones = parseFloat(formData.repeticionesImagen) || 1;
      
      if (formData.tipoSellado === 'Inferior' && formData.largo) {
        const largoValue = parseFloat(formData.largo);
        calculatedValue = Math.round(largoValue / repeticiones).toString();
      } else if (formData.tipoSellado === 'Lateral' && formData.ancho) {
        const anchoValue = parseFloat(formData.ancho);
        calculatedValue = Math.round(anchoValue / repeticiones).toString();
      }
    } else if (formData.tipoProducto === 'Bobina' && formData.diametroAnchoBolsa) {
      const diametro = parseFloat(formData.diametroAnchoBolsa);
      if (diametro) {
        calculatedValue = Math.round(diametro * 2).toString();
      }
    }
    
    if (calculatedValue) {
      setFormData((prev: any) => ({ ...prev, cilindro: calculatedValue }));
    }
  }, [formData.tipoProducto, formData.tipoSellado, formData.ancho, formData.largo, formData.diametroAnchoBolsa, formData.repeticionesImagen]);

  // Auto-calcular laminaRebobinadorAncho y laminaRebobinadorCalibre para bobinas tipo Lámina
  useEffect(() => {
    if (formData.tipoProducto === 'Bobina' && formData.tipoBobinaCliente === 'Lamina') {
      const anchoBobina = parseFloat(formData.anchoBobina) || 0;
      const calibre = parseFloat(formData.calibre) || 0;
      
      if (anchoBobina) {
        const laminaAncho = anchoBobina / 2;
        setFormData((prev: any) => ({ ...prev, laminaRebobinadorAncho: parseFloat(laminaAncho.toFixed(2)) }));
      }
      
      if (calibre) {
        const laminaCalibre = calibre * 2;
        setFormData((prev: any) => ({ ...prev, laminaRebobinadorCalibre: parseFloat(laminaCalibre.toFixed(2)) }));
      }
    }
  }, [formData.tipoProducto, formData.tipoBobinaCliente, formData.anchoBobina, formData.calibre]);

  if (status === 'loading' || loading) {
    return <LoadingSpinner />;
  }

  const tabs = [
    { id: 'basico' as TabType, label: 'Básico', icon: Package },
    { id: 'formulacion' as TabType, label: 'Formulación', icon: Droplets },
    { id: 'serigrafia' as TabType, label: 'Serigrafía', icon: Palette },
    { id: 'extrusion' as TabType, label: 'Extrusión', icon: Cog },
    { id: 'sellado' as TabType, label: 'Sellado', icon: Settings },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver a Productos
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Nuevo Producto
              </h1>
              <p className="text-gray-600">Crear producto con especificaciones completas</p>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Guardando...' : 'Crear Producto'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isDisabled = tab.id === 'serigrafia' && !formData.conImpresion;
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                disabled={isDisabled}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  isDisabled
                    ? 'border-transparent text-gray-400 cursor-not-allowed opacity-50'
                    : activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Content - Reutilizar el mismo contenido del formulario de edición */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Aquí iría todo el contenido de los tabs igual que en editar-completo */}
          {/* Por simplicidad, solo incluyo el tab básico */}
          {activeTab === 'basico' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Especificaciones Básicas</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombreProducto || ''}
                    onChange={(e) => handleChange('nombreProducto', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Producto *
                  </label>
                  <select
                    required
                    value={formData.tipoProducto || 'Bolsa'}
                    onChange={(e) => handleChange('tipoProducto', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Bolsa">Bolsa</option>
                    <option value="Bobina">Bobina</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad de Venta *
                  </label>
                  <select
                    required
                    value={formData.unidadVenta || 'Unidades'}
                    onChange={(e) => handleChange('unidadVenta', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Unidades">Unidades</option>
                    <option value="Kilogramos">Kilogramos</option>
                    <option value="Metros">Metros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Material
                  </label>
                  <input
                    type="text"
                    value={formData.material || ''}
                    onChange={(e) => handleChange('material', e.target.value)}
                    placeholder="Ej: Polietileno"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.conImpresion || false}
                      onChange={(e) => handleChange('conImpresion', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">¿Lleva Impresión?</span>
                  </label>
                </div>
              </div>

              <div className="border-t pt-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.activo !== undefined ? formData.activo : true}
                    onChange={(e) => handleChange('activo', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Producto Activo</span>
                </label>
              </div>
            </div>
          )}

          {/* Tab: Formulación */}
          {activeTab === 'formulacion' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Formulación de Materia Prima (%)</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { key: 'formFB7000', label: 'FB7000' },
                  { key: 'form3003', label: '3003' },
                  { key: 'formLineal', label: 'Lineal' },
                  { key: 'form0240', label: '0240' },
                  { key: 'form0348', label: '0348' },
                  { key: 'form7000F', label: '7000F' },
                  { key: 'formDeslizante', label: 'Deslizante' },
                  { key: 'formMasterbachBlanco', label: 'Masterbach Blanco' },
                  { key: 'formMasterbachNegro', label: 'Masterbach Negro' },
                  { key: 'formMasterbachAzul', label: 'Masterbach Azul' },
                  { key: 'formMasterbachAmarillo', label: 'Masterbach Amarillo' },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label} (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData[field.key] || ''}
                      onChange={(e) => handleChange(field.key, e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Serigrafía */}
          {activeTab === 'serigrafia' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Serigrafía</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <div key={num}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color {num}
                    </label>
                    <input
                      type="text"
                      value={formData[`color${num}`] || ''}
                      onChange={(e) => handleChange(`color${num}`, e.target.value)}
                      placeholder={`Ej: Rojo, Azul, etc.`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cilindro Base
                  </label>
                  <input
                    type="text"
                    value={formData.cilindro || ''}
                    onChange={(e) => handleChange('cilindro', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Impresión
                  </label>
                  <input
                    type="text"
                    value={formData.tipoImpresion || ''}
                    onChange={(e) => handleChange('tipoImpresion', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tratador - Intensidad
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.serigrafiaTratadorIntensidad || ''}
                    onChange={(e) => handleChange('serigrafiaTratadorIntensidad', e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab: Extrusión */}
          {activeTab === 'extrusion' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Parámetros de Extrusión</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Parámetros Generales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { key: 'extTemperaturaAmbiente', label: 'Temperatura Ambiente' },
                      { key: 'extMotorPrincipal', label: 'Motor Principal' },
                      { key: 'extTraccion', label: 'Tracción' },
                      { key: 'extSopladorPrincipal', label: 'Soplador Principal' },
                      { key: 'extAberturaBlower', label: 'Abertura Blower' },
                      { key: 'extCuelloGlobo', label: 'Cuello Globo' },
                      { key: 'extTemperaturaCuelloGlobo', label: 'Temperatura Cuello Globo' },
                      { key: 'extTraccionRebobinador', label: 'Tracción Rebobinador' },
                      { key: 'extRebobinadorWinding1', label: 'Rebobinador Winding 1' },
                      { key: 'extRebobinadorWinding2', label: 'Rebobinador Winding 2' },
                      { key: 'extIntensidadTratador', label: 'Intensidad Tratador' },
                      { key: 'extOrientacionFlujoBlower', label: 'Orientación Flujo Blower' },
                    ].map((field) => (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field.label}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData[field.key] || ''}
                          onChange={(e) => handleChange(field.key, e.target.value ? parseFloat(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Temperaturas por Zona (°C)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                      <div key={num}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Zona {num}
                        </label>
                        <input
                          type="number"
                          value={formData[`extTemperaturaZ${num}`] || ''}
                          onChange={(e) => handleChange(`extTemperaturaZ${num}`, e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Sellado */}
          {activeTab === 'sellado' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Parámetros de Sellado</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Selladora
                </label>
                <select
                  value={formData.sldTipoSelladora || ''}
                  onChange={(e) => handleChange('sldTipoSelladora', e.target.value)}
                  className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar...</option>
                  <option value="valvula">Selladora de Válvula</option>
                  <option value="bolsaASA">Selladora de Bolsa ASA</option>
                  <option value="bolsaPollo">Selladora de Bolsa de Pollo</option>
                </select>
              </div>

              {formData.sldTipoSelladora && (
                <>
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Parámetros Generales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(formData.sldTipoSelladora === 'valvula' || formData.sldTipoSelladora === 'bolsaASA') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Capacidad de Bolsa
                          </label>
                          <input
                            type="number"
                            value={formData.sldCapacidadBolsa || ''}
                            onChange={(e) => handleChange('sldCapacidadBolsa', e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Temperatura Ambiente (°C)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.sldTemperaturaAmbiente || ''}
                          onChange={(e) => handleChange('sldTemperaturaAmbiente', e.target.value ? parseFloat(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tornillo de Esparrago
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.sldTornilloEsparrago || ''}
                          onChange={(e) => handleChange('sldTornilloEsparrago', e.target.value ? parseFloat(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Temperaturas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {formData.sldTipoSelladora === 'valvula' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Temperatura Superior (°C)
                            </label>
                            <input
                              type="number"
                              value={formData.sldTempSuperior || ''}
                              onChange={(e) => handleChange('sldTempSuperior', e.target.value ? parseInt(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Temperatura Inferior (°C)
                            </label>
                            <input
                              type="number"
                              value={formData.sldTempInferior || ''}
                              onChange={(e) => handleChange('sldTempInferior', e.target.value ? parseInt(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Temperatura Válvula (°C)
                            </label>
                            <input
                              type="number"
                              value={formData.sldTempValvula || ''}
                              onChange={(e) => handleChange('sldTempValvula', e.target.value ? parseInt(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </>
                      )}
                      
                      {formData.sldTipoSelladora === 'bolsaASA' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Temp. Superior Línea A (°C)
                            </label>
                            <input
                              type="number"
                              value={formData.sldTempSuperiorLineaA || ''}
                              onChange={(e) => handleChange('sldTempSuperiorLineaA', e.target.value ? parseInt(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Temp. Inferior Línea A (°C)
                            </label>
                            <input
                              type="number"
                              value={formData.sldTempInferiorLineaA || ''}
                              onChange={(e) => handleChange('sldTempInferiorLineaA', e.target.value ? parseInt(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Temp. Superior Línea B (°C)
                            </label>
                            <input
                              type="number"
                              value={formData.sldTempSuperiorLineaB || ''}
                              onChange={(e) => handleChange('sldTempSuperiorLineaB', e.target.value ? parseInt(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Temp. Inferior Línea B (°C)
                            </label>
                            <input
                              type="number"
                              value={formData.sldTempInferiorLineaB || ''}
                              onChange={(e) => handleChange('sldTempInferiorLineaB', e.target.value ? parseInt(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </>
                      )}

                      {formData.sldTipoSelladora === 'bolsaPollo' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Temperatura de Troquel (°C)
                            </label>
                            <input
                              type="number"
                              value={formData.sldTempTroquel || ''}
                              onChange={(e) => handleChange('sldTempTroquel', e.target.value ? parseInt(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Temp. Superior Recta (°C)
                            </label>
                            <input
                              type="number"
                              value={formData.sldTempSuperiorRecta || ''}
                              onChange={(e) => handleChange('sldTempSuperiorRecta', e.target.value ? parseInt(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Temp. Superior Curva (°C)
                            </label>
                            <input
                              type="number"
                              value={formData.sldTempSuperiorCurva || ''}
                              onChange={(e) => handleChange('sldTempSuperiorCurva', e.target.value ? parseInt(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </>
                      )}

                      {(formData.sldTipoSelladora === 'valvula' || formData.sldTipoSelladora === 'bolsaASA') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Temperatura de Cuchilla (°C)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.sldTempCuchilla || ''}
                            onChange={(e) => handleChange('sldTempCuchilla', e.target.value ? parseFloat(e.target.value) : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer con botones */}
        <div className="mt-6 flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Guardando...' : 'Crear Producto'}
          </button>
        </div>
      </form>
    </div>
  );
}