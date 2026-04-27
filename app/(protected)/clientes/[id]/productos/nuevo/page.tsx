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

              {/* Tipos de Bolsa */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipo de Bolsa</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.esBolsaPego || false}
                        onChange={(e) => handleChange('esBolsaPego', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Bolsa de Pego/Válvula</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.esBolsaFuelle || false}
                        onChange={(e) => handleChange('esBolsaFuelle', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Con Fuelle</span>
                    </label>
                  </div>
                  {formData.tipoProducto === 'Bobina' && (
                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.esTermoencogible || false}
                          onChange={(e) => handleChange('esTermoencogible', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Termoencogible</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Dimensiones</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Dimensiones para Bobina */}
                  {formData.tipoProducto === 'Bobina' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ancho Bobina (cm)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.anchoBobina || ''}
                          onChange={(e) => handleChange('anchoBobina', e.target.value ? parseFloat(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      {formData.conImpresion && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Diámetro Ancho Bolsa (cm)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.diametroAnchoBolsa || ''}
                            onChange={(e) => handleChange('diametroAnchoBolsa', e.target.value ? parseFloat(e.target.value) : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    /* Dimensiones para Bolsa */
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ancho (cm)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.ancho || ''}
                          onChange={(e) => handleChange('ancho', e.target.value ? parseFloat(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Largo (cm)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.largo || ''}
                          onChange={(e) => handleChange('largo', e.target.value ? parseFloat(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Campos adicionales para bolsa de pego */}
                      {formData.esBolsaPego && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Ancho Válvula (cm)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.anchoValvula || ''}
                              onChange={(e) => handleChange('anchoValvula', e.target.value ? parseFloat(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Ancho Solapa (cm)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.anchoSolapa || ''}
                              onChange={(e) => handleChange('anchoSolapa', e.target.value ? parseFloat(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </>
                      )}

                      {/* Campo adicional para bolsa con fuelle */}
                      {(formData.esBolsaPego || formData.esBolsaFuelle) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ancho Fuelle (cm)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.anchoFuelle || ''}
                            onChange={(e) => handleChange('anchoFuelle', e.target.value ? parseFloat(e.target.value) : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      )}
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Calibre (µ)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.calibre || ''}
                      onChange={(e) => handleChange('calibre', e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Peso por unidad (calculado automáticamente) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Peso por Unidad (g) - Calculado
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={formData.pesoPorUnidad || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                </div>
              </div>

              {/* Atributos de Sellado - Solo para Bolsas */}
              {formData.tipoProducto === 'Bolsa' && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Atributos de Sellado</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Sellado
                      </label>
                      <select
                        value={formData.tipoSellado || ''}
                        onChange={(e) => handleChange('tipoSellado', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="Inferior">Inferior</option>
                        <option value="Lateral">Lateral</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo Sellado Estructura
                      </label>
                      <select
                        value={formData.tipoSelladoEstructura || ''}
                        onChange={(e) => handleChange('tipoSelladoEstructura', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="Simple">Simple</option>
                        <option value="Doble">Doble</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bolsas por Rollo
                      </label>
                      <input
                        type="number"
                        value={formData.bolsasPorRollo || ''}
                        onChange={(e) => handleChange('bolsasPorRollo', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rollos por Bulto
                      </label>
                      <input
                        type="number"
                        value={formData.rollosPorBulto || ''}
                        onChange={(e) => handleChange('rollosPorBulto', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.perforacion || false}
                          onChange={(e) => handleChange('perforacion', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Perforación</span>
                      </label>
                    </div>

                    {formData.conImpresion && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Repeticiones Imagen
                        </label>
                        <input
                          type="number"
                          value={formData.repeticionesImagen || ''}
                          onChange={(e) => handleChange('repeticionesImagen', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Atributos de Bobina - Siempre visibles */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Atributos de Bobina</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo Bobina Cliente
                    </label>
                    <select
                      value={formData.tipoBobinaCliente || ''}
                      onChange={(e) => handleChange('tipoBobinaCliente', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Lamina">Lámina</option>
                      <option value="Manga">Manga</option>
                      <option value="MangaConFuelle">Manga con Fuelle</option>
                    </select>
                  </div>

                  {formData.esTermoencogible && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Peso Máximo Bobina (kg)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.pesoMaximoBobina || ''}
                        onChange={(e) => handleChange('pesoMaximoBobina', e.target.value ? parseFloat(e.target.value) : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  {formData.conImpresion && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Intensidad Tratador
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.intensidadTratador || ''}
                        onChange={(e) => handleChange('intensidadTratador', e.target.value ? parseFloat(e.target.value) : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo Refilado
                    </label>
                    <select
                      value={formData.tipoRefilado || ''}
                      onChange={(e) => handleChange('tipoRefilado', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Simple">Simple</option>
                      <option value="Doble">Doble</option>
                      <option value="Ninguno">Ninguno</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.muleteado || false}
                        onChange={(e) => handleChange('muleteado', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Muleteado</span>
                    </label>
                  </div>

                  {/* Campos calculados para lámina rebobinador */}
                  {formData.tipoBobinaCliente === 'Lamina' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Lámina Rebobinador Ancho (cm) - Calculado
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.laminaRebobinadorAncho || ''}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Lámina Rebobinador Calibre (µ) - Calculado
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.laminaRebobinadorCalibre || ''}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        />
                      </div>
                    </>
                  )}
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