'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ArrowLeft, Save, Settings, Package, Droplets, Palette, Cog } from 'lucide-react';
import { calculateBagWeight, getPlasticDensity, TipoBolsa } from '@/lib/utils/bag-weight';

interface ProductoCliente {
  id: string;
  clienteId: string;
  nombreProducto: string;
  codigoProducto?: string;
  activo: boolean;
  tipoProducto: string;
  conImpresion: boolean;
  conPigmento: boolean;
  [key: string]: any;
}

type TabType = 'basico' | 'formulacion' | 'serigrafia' | 'extrusion' | 'sellado';

export default function EditarCompletoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const clienteId = params.id as string;
  const productoId = params.productoId as string;

  const [producto, setProducto] = useState<ProductoCliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('basico');
  const [formData, setFormData] = useState<any>({});
  const [peletizadosInventario, setPeletizadosInventario] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchProducto();
      fetchPeletizados();
    }
  }, [status, router, clienteId, productoId]);

  const fetchPeletizados = async () => {
    try {
      const res = await fetch('/api/inventario?limit=250');
      if (res.ok) {
        const data = await res.json();
        const items = (data.inventarios || []).filter((item: any) => 
          item.categoria === 'Peletizado' ||
          (item.nombre && item.nombre.toLowerCase().includes('peletizad')) ||
          (item.nombre && item.nombre.toLowerCase().includes('molido')) ||
          (item.codigo && item.codigo.toLowerCase().includes('pel'))
        );
        setPeletizadosInventario(items);
      }
    } catch (err) {
      console.error('Error al cargar artículos de peletizado:', err);
    }
  };

  const fetchProducto = async () => {
    try {
      const response = await fetch(`/api/clientes/${clienteId}/productos/${productoId}`);
      if (response.ok) {
        const data = await response.json();
        setProducto(data);
        
        let inferredTipoBolsa: TipoBolsa = 'sencilla';
        if (data.esBolsaASA || data.anchoTroquelASA || data.fuelleASA) {
          inferredTipoBolsa = 'asa';
        } else if (data.anchoValvula || data.anchoSolapa) {
          inferredTipoBolsa = 'valvula';
        } else if (data.anchoFuelle) {
          inferredTipoBolsa = 'fuelle';
        }

        // Calcular campos virtuales a partir de los datos guardados
        const formDataWithVirtuals = {
          ...data,
          molido: data.molido !== null && data.molido !== undefined ? data.molido : 0,
          peletizadoId: data.peletizadoId || '',
          peletizadoPorcentaje: data.peletizadoPorcentaje !== null && data.peletizadoPorcentaje !== undefined 
            ? data.peletizadoPorcentaje 
            : (data.molido || 0),
          tipoBolsa: data.tipoBolsa || inferredTipoBolsa,
          // Calcular esBolsaPego si tiene anchoValvula
          esBolsaPego: !!(data.anchoValvula),
          // Calcular esBolsaFuelle si tiene anchoFuelle pero no anchoValvula
          esBolsaFuelle: !!(data.anchoFuelle && !data.anchoValvula),
          // Calcular esTermoencogible si tiene pesoMaximoBobina
          esTermoencogible: !!(data.pesoMaximoBobina),
          // Calcular esBolsaASA
          esBolsaASA: data.esBolsaASA || !!(data.anchoTroquelASA || data.fuelleASA),
          llevaPostizo: data.llevaPostizo ?? false,
        };
        
        setFormData(formDataWithVirtuals);
      }
    } catch (error) {
      console.error('Error al cargar producto:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/clientes/${clienteId}/productos/${productoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Producto actualizado exitosamente');
        router.back();
      } else {
        const error = await response.json();
        alert(error.error || 'Error al actualizar producto');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar producto');
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

  // Auto-calcular pesoPorUnidad a partir de dimensiones y calibre usando calculateBagWeight
  useEffect(() => {
    let peso = 0;
    const calibre = parseFloat(formData.calibre) || 0;
    
    if (formData.tipoProducto === 'Bolsa') {
      const ancho = parseFloat(formData.ancho) || 0;
      const largo = parseFloat(formData.largo) || 0;
      const fuelle = parseFloat(formData.anchoFuelle || formData.fuelleASA) || 0;
      const solapa = parseFloat(formData.anchoSolapa) || 0;
      const anchoTroquel = parseFloat(formData.anchoTroquelASA) || 0;
      const largoTroquel = parseFloat(formData.largoTroquelASA) || 0;

      let tipo: TipoBolsa = formData.tipoBolsa || 'sencilla';
      if (!formData.tipoBolsa) {
        if (formData.esBolsaASA) tipo = 'asa';
        else if (formData.esBolsaPego) tipo = 'valvula';
        else if (formData.esBolsaFuelle) tipo = 'fuelle';
      }

      const densidad = getPlasticDensity(formData.material);

      peso = calculateBagWeight({
        tipoBolsa: tipo,
        ancho,
        largo,
        calibre,
        fuelle,
        solapa,
        anchoTroquel,
        largoTroquel,
        densidad
      });
    } else if (formData.tipoProducto === 'Bobina') {
      const anchoBobina = parseFloat(formData.anchoBobina) || 0;
      if (anchoBobina && calibre) {
        peso = (anchoBobina * calibre) / 100;
      }
    }
    
    setFormData((prev: any) => ({ ...prev, pesoPorUnidad: peso > 0 ? parseFloat(peso.toFixed(3)) : '' }));
  }, [
    formData.tipoProducto,
    formData.tipoBolsa,
    formData.ancho,
    formData.largo,
    formData.calibre,
    formData.anchoFuelle,
    formData.fuelleASA,
    formData.anchoSolapa,
    formData.anchoTroquelASA,
    formData.largoTroquelASA,
    formData.anchoBobina,
    formData.material,
    formData.esBolsaASA,
    formData.esBolsaPego,
    formData.esBolsaFuelle
  ]);

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
    if (formData.tipoBobinaCliente === 'Lamina') {
      // Calcular ancho de lámina rebobinador
      let laminaAncho = null;
      
      if (formData.tipoSellado === 'Inferior' && formData.esBolsaPego && formData.ancho && formData.anchoFuelle && formData.anchoSolapa) {
        // Bolsa de pego con sellado inferior: (ancho * 2) + (fuelle * 2) + solapa
        laminaAncho = (parseFloat(formData.ancho) * 2) + (parseFloat(formData.anchoFuelle) * 2) + parseFloat(formData.anchoSolapa);
      } else if (formData.tipoSellado === 'Lateral' && formData.largo) {
        // Sellado lateral: largo * 2
        laminaAncho = parseFloat(formData.largo) * 2;
      } else if (formData.tipoProducto === 'Bobina' && formData.anchoBobina) {
        // Bobina: usar ancho bobina directamente
        laminaAncho = parseFloat(formData.anchoBobina);
      } else if (formData.ancho) {
        // Por defecto: usar ancho
        laminaAncho = parseFloat(formData.ancho);
      }
      
      if (laminaAncho !== null) {
        setFormData((prev: any) => ({ ...prev, laminaRebobinadorAncho: parseFloat(laminaAncho.toFixed(2)) }));
      }
      
      // Calcular calibre de lámina rebobinador
      let laminaCalibre = null;
      const calibre = parseFloat(formData.calibre) || 0;
      
      if (formData.tipoSellado === 'Lateral' && calibre) {
        // Sellado lateral: calibre / 2
        laminaCalibre = calibre / 2;
      } else if (calibre) {
        // Por defecto: usar calibre directamente
        laminaCalibre = calibre;
      }
      
      if (laminaCalibre !== null) {
        setFormData((prev: any) => ({ ...prev, laminaRebobinadorCalibre: parseFloat(laminaCalibre.toFixed(2)) }));
      }
    }
  }, [formData.tipoBobinaCliente, formData.tipoSellado, formData.esBolsaPego, formData.ancho, formData.largo, formData.anchoBobina, formData.anchoFuelle, formData.anchoSolapa, formData.calibre, formData.tipoProducto]);

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
            <Settings className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Edición Completa
              </h1>
              <p className="text-gray-600">{producto?.nombreProducto}</p>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
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
                    ? 'border-purple-600 text-purple-600 font-medium'
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

      {/* Form Content */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Tab: Básico */}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2 flex gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.conImpresion || false}
                      onChange={(e) => handleChange('conImpresion', e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">¿Lleva Impresión?</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.conPigmento || false}
                      onChange={(e) => handleChange('conPigmento', e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">¿Lleva Pigmento?</span>
                  </label>
                </div>
              </div>

              {/* Tipos de Bolsa */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipo de Bolsa</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {formData.tipoProducto === 'Bolsa' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Bolsa
                      </label>
                      <select
                        value={formData.tipoBolsa || 'sencilla'}
                        onChange={(e) => {
                          const val = e.target.value as TipoBolsa;
                          handleChange('tipoBolsa', val);
                          handleChange('esBolsaFuelle', val === 'fuelle' || val === 'valvula' || val === 'asa');
                          handleChange('esBolsaPego', val === 'valvula');
                          handleChange('esBolsaASA', val === 'asa');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium"
                      >
                        <option value="sencilla">Bolsa Sencilla</option>
                        <option value="fuelle">Bolsa con Fuelle</option>
                        <option value="valvula">Bolsa Válvula / Pego</option>
                        <option value="asa">Bolsa ASA</option>
                      </select>
                    </div>
                  )}

                  {formData.tipoProducto === 'Bobina' && (
                    <div>
                      <label className="flex items-center gap-2 mt-6">
                        <input
                          type="checkbox"
                          checked={formData.esTermoencogible || false}
                          onChange={(e) => handleChange('esTermoencogible', e.target.checked)}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    /* Dimensiones para Bolsa segun tipoBolsa */
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>

                      {/* Campos dinámicos según tipoBolsa */}
                      {(formData.tipoBolsa === 'fuelle' || formData.tipoBolsa === 'valvula' || formData.tipoBolsa === 'asa' || formData.esBolsaFuelle || formData.esBolsaPego || formData.esBolsaASA) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fuelle (cm)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.anchoFuelle || formData.fuelleASA || ''}
                            onChange={(e) => {
                              const val = e.target.value ? parseFloat(e.target.value) : null;
                              handleChange('anchoFuelle', val);
                              handleChange('fuelleASA', val);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      )}

                      {(formData.tipoBolsa === 'valvula' || formData.esBolsaPego) && (
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Solapa (cm)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.anchoSolapa || ''}
                              onChange={(e) => handleChange('anchoSolapa', e.target.value ? parseFloat(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                        </>
                      )}

                      {(formData.tipoBolsa === 'asa' || formData.esBolsaASA) && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Ancho Troquel (cm)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.anchoTroquelASA || ''}
                              onChange={(e) => handleChange('anchoTroquelASA', e.target.value ? parseFloat(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Largo Troquel (cm)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.largoTroquelASA || ''}
                              onChange={(e) => handleChange('largoTroquelASA', e.target.value ? parseFloat(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                        </>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.perforacion || false}
                          onChange={(e) => handleChange('perforacion', e.target.checked)}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Ninguno</option>
                      <option value="Simple">Simple</option>
                      <option value="Doble">Doble</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.muleteado || false}
                        onChange={(e) => handleChange('muleteado', e.target.checked)}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Muleteado</span>
                    </label>
                  </div>
                </div>

                {/* Campos de Lámina Rebobinador - Solo cuando tipo bobina es Lámina */}
                {formData.tipoBobinaCliente === 'Lamina' && (
                  <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Medidas de Lámina por Rebobinador</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ancho Lámina Rebobinador (cm) - Calculado
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
                          Calibre Lámina Rebobinador (µ) - Calculado
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.laminaRebobinadorCalibre || ''}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        />
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 mt-3 space-y-1">
                      <p className="font-semibold">Fórmulas de cálculo:</p>
                      <p><strong>Ancho:</strong></p>
                      <ul className="list-disc list-inside ml-2">
                        <li>Bolsa Pego + Sellado Inferior: (Ancho × 2) + (Fuelle × 2) + Solapa</li>
                        <li>Sellado Lateral: Largo × 2</li>
                        <li>Bobina: Ancho Bobina</li>
                        <li>Por defecto: Ancho</li>
                      </ul>
                      <p className="mt-2"><strong>Calibre:</strong></p>
                      <ul className="list-disc list-inside ml-2">
                        <li>Sellado Lateral: Calibre ÷ 2</li>
                        <li>Por defecto: Calibre</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.activo !== undefined ? formData.activo : true}
                    onChange={(e) => handleChange('activo', e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Producto Activo</span>
                </label>
              </div>
            </div>
          )}

          {/* Tab: Formulación */}
          {activeTab === 'formulacion' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Formulación de Materia Prima (%)</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Define la combinación de peletizado de inventario y resinas vírgenes para este producto.
                  </p>
                </div>
              </div>

              {/* Selector y Porcentaje de Peletizado (Inventario) */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-50 to-emerald-50 rounded-xl border border-amber-200/80 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="p-1.5 bg-amber-500/10 text-amber-700 rounded-lg">
                    <Droplets className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      Peletizado / Material Recuperado (Inventario)
                    </h3>
                    <p className="text-xs text-gray-500">
                      Selecciona el material de inventario que se descontará automáticamente en Extrusión.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Selector de Peletizado */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Peletizado en Inventario
                    </label>
                    <select
                      value={formData.peletizadoId || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleChange('peletizadoId', val || null);
                        if (!val) {
                          handleChange('peletizadoPorcentaje', 0);
                          handleChange('molido', 0);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    >
                      <option value="">Sin Peletizado / 100% Virgen</option>
                      {peletizadosInventario.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nombre} ({item.codigo}) — Stock: {item.cantidad ?? 0} {item.unidad || 'kg'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Input Porcentaje Peletizado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Peletizado (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="0"
                        disabled={!formData.peletizadoId}
                        value={formData.peletizadoPorcentaje !== undefined && formData.peletizadoPorcentaje !== null ? formData.peletizadoPorcentaje : ''}
                        onChange={(e) => {
                          const val = e.target.value !== '' ? parseFloat(e.target.value) : 0;
                          handleChange('peletizadoPorcentaje', val);
                          handleChange('molido', val);
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm ${
                          !formData.peletizadoId 
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                            : 'bg-white border-gray-300 text-gray-900 font-semibold'
                        }`}
                      />
                      <span className="absolute right-3 top-2 text-xs text-gray-400 font-semibold">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Materias Primas Vírgenes y Masterbatch */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-3">Resinas Vírgenes y Aditivos (%)</h3>
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
                        placeholder="0"
                        value={formData[field.key] !== undefined && formData[field.key] !== null ? formData[field.key] : ''}
                        onChange={(e) => handleChange(field.key, e.target.value !== '' ? parseFloat(e.target.value) : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Materia Prima Principal */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Materias Primas Principales</h3>
                
                {/* Materia Prima 1 */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-md font-bold text-purple-700 mb-3 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-purple-100 rounded-full text-xs">1</span>
                    Materia Prima 1
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                      <input
                        type="text"
                        value={formData.mpNombre || ''}
                        onChange={(e) => handleChange('mpNombre', e.target.value)}
                        placeholder="Ej: Polietileno de Alta Densidad"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                      <input
                        type="text"
                        value={formData.mpCodigo || ''}
                        onChange={(e) => handleChange('mpCodigo', e.target.value)}
                        placeholder="Ej: MP-001"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Densidad (g/cm³)</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={formData.mpDensidad || ''}
                        onChange={(e) => handleChange('mpDensidad', e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="0.950"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Índice de Fluidez (g/10min)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.mpIndiceFluidez || ''}
                        onChange={(e) => handleChange('mpIndiceFluidez', e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">País de Fabricación</label>
                      <input
                        type="text"
                        value={formData.mpPaisFabricacion || ''}
                        onChange={(e) => handleChange('mpPaisFabricacion', e.target.value)}
                        placeholder="Ej: USA, China"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Materia Prima 2 */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-md font-bold text-purple-700 mb-3 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-purple-100 rounded-full text-xs">2</span>
                    Materia Prima 2
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                      <input
                        type="text"
                        value={formData.mpNombre2 || ''}
                        onChange={(e) => handleChange('mpNombre2', e.target.value)}
                        placeholder="Ej: Polietileno de Alta Densidad"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                      <input
                        type="text"
                        value={formData.mpCodigo2 || ''}
                        onChange={(e) => handleChange('mpCodigo2', e.target.value)}
                        placeholder="Ej: MP-002"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Densidad (g/cm³)</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={formData.mpDensidad2 || ''}
                        onChange={(e) => handleChange('mpDensidad2', e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="0.950"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Índice de Fluidez (g/10min)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.mpIndiceFluidez2 || ''}
                        onChange={(e) => handleChange('mpIndiceFluidez2', e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">País de Fabricación</label>
                      <input
                        type="text"
                        value={formData.mpPaisFabricacion2 || ''}
                        onChange={(e) => handleChange('mpPaisFabricacion2', e.target.value)}
                        placeholder="Ej: USA, China"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Materia Prima 3 */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-md font-bold text-purple-700 mb-3 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-purple-100 rounded-full text-xs">3</span>
                    Materia Prima 3
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                      <input
                        type="text"
                        value={formData.mpNombre3 || ''}
                        onChange={(e) => handleChange('mpNombre3', e.target.value)}
                        placeholder="Ej: Polietileno de Alta Densidad"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                      <input
                        type="text"
                        value={formData.mpCodigo3 || ''}
                        onChange={(e) => handleChange('mpCodigo3', e.target.value)}
                        placeholder="Ej: MP-003"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Densidad (g/cm³)</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={formData.mpDensidad3 || ''}
                        onChange={(e) => handleChange('mpDensidad3', e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="0.950"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Índice de Fluidez (g/10min)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.mpIndiceFluidez3 || ''}
                        onChange={(e) => handleChange('mpIndiceFluidez3', e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">País de Fabricación</label>
                      <input
                        type="text"
                        value={formData.mpPaisFabricacion3 || ''}
                        onChange={(e) => handleChange('mpPaisFabricacion3', e.target.value)}
                        placeholder="Ej: USA, China"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      { key: 'extMaquinaExtrusora', label: 'Máquina Extrusora', type: 'number', step: '1' },
                      { key: 'extDiametroCabezal', label: 'Diámetro de Cabezal' },
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
                      { key: 'extOrientacionFlujoBlowerInterno', label: 'Ori. Flujo Blower Plato Int. (cm)' },
                      { key: 'extOrientacionFlujoBlowerExterno', label: 'Ori. Flujo Blower Plato Ext. (cm)' },
                    ].map((field) => (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field.label}
                        </label>
                        <input
                          type={field.type || "number"}
                          step={field.step || "0.01"}
                          value={formData[field.key] || ''}
                          onChange={(e) => handleChange(field.key, e.target.value ? (field.type === 'number' && field.step === '1' ? parseInt(e.target.value) : parseFloat(e.target.value)) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Sellado - COMPLETO CON 49 CAMPOS */}
          {activeTab === 'sellado' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Parámetros de Sellado</h2>
              
              {/* Selector de Tipo de Selladora */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Selladora
                </label>
                <select
                  value={formData.sldTipoSelladora || ''}
                  onChange={(e) => handleChange('sldTipoSelladora', e.target.value)}
                  className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Seleccionar...</option>
                  <option value="valvula">Selladora de Válvula</option>
                  <option value="bolsaASA">Selladora de Bolsa ASA</option>
                  <option value="bolsaPollo">Selladora de Bolsa de Pollo</option>
                </select>
              </div>

              {!formData.sldTipoSelladora && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-purple-800 text-sm">
                  Seleccione un tipo de selladora arriba (por ejemplo, <strong>Selladora de Válvula</strong>) para desplegar todos los parámetros de máquina y ajustes de sellado.
                </div>
              )}

              {formData.sldTipoSelladora && (
                <>
                  {/* Parámetros Generales */}
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Temperaturas */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Temperaturas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Temperatura de Cuchilla (°C)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.sldTempCuchilla || ''}
                              onChange={(e) => handleChange('sldTempCuchilla', e.target.value ? parseFloat(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Presellado A (°C)
                            </label>
                            <input
                              type="number"
                              value={formData.sldPresellado_A || ''}
                              onChange={(e) => handleChange('sldPresellado_A', e.target.value ? parseInt(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Presellado B (°C)
                            </label>
                            <input
                              type="number"
                              value={formData.sldPresellado_B || ''}
                              onChange={(e) => handleChange('sldPresellado_B', e.target.value ? parseInt(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Temperatura de Cuchilla (°C)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.sldTempCuchilla || ''}
                              onChange={(e) => handleChange('sldTempCuchilla', e.target.value ? parseFloat(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Tiempos y Accesorios (Solo Válvula) */}
                  {formData.sldTipoSelladora === 'valvula' && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Tiempos y Accesorios</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tiempo Límite
                          </label>
                          <input
                            type="number"
                            value={formData.sldTiempoLimite || ''}
                            onChange={(e) => handleChange('sldTiempoLimite', e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Microperforaciones
                          </label>
                          <input
                            type="text"
                            value={formData.sldMicroperforaciones || ''}
                            onChange={(e) => handleChange('sldMicroperforaciones', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Muleteado
                          </label>
                          <input
                            type="text"
                            value={formData.sldMuleteado || ''}
                            onChange={(e) => handleChange('sldMuleteado', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Presión de Troquel de Válvula
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.sldPresionTroquelValvula || ''}
                            onChange={(e) => handleChange('sldPresionTroquelValvula', e.target.value ? parseFloat(e.target.value) : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Parámetros Generales de Máquina */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Parámetros de Máquina</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rodillo Ancho Válvula
                        </label>
                        <input
                          type="number"
                          value={formData.sldRodilloAnchoValvula || ''}
                          onChange={(e) => handleChange('sldRodilloAnchoValvula', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          GPM
                        </label>
                        <input
                          type="number"
                          value={formData.sldGPM || ''}
                          onChange={(e) => handleChange('sldGPM', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      {(formData.sldTipoSelladora === 'valvula' || formData.sldTipoSelladora === 'bolsaPollo') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Velocidad Transportador
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.sldVelocidadTransportador || ''}
                            onChange={(e) => handleChange('sldVelocidadTransportador', e.target.value ? parseFloat(e.target.value) : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ciclo de Trabajo
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.sldCicloTrabajo || ''}
                          onChange={(e) => handleChange('sldCicloTrabajo', e.target.value ? parseFloat(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      {formData.sldTipoSelladora === 'bolsaPollo' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Presión Ventosa
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.sldPresionVentosa || ''}
                              onChange={(e) => handleChange('sldPresionVentosa', e.target.value ? parseFloat(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tensión Principal
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.sldTensionPrincipal || ''}
                              onChange={(e) => handleChange('sldTensionPrincipal', e.target.value ? parseFloat(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Presiones de Balancines */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Presiones de Balancines</h3>
                    {formData.sldTipoSelladora !== 'bolsaASA' ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Presión Balancín 1
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.sldPresionBalancin1 || ''}
                            onChange={(e) => handleChange('sldPresionBalancin1', e.target.value ? parseFloat(e.target.value) : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Presión Balancín 2
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.sldPresionBalancin2 || ''}
                            onChange={(e) => handleChange('sldPresionBalancin2', e.target.value ? parseFloat(e.target.value) : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Presión Balancín 3
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.sldPresionBalancin3 || ''}
                            onChange={(e) => handleChange('sldPresionBalancin3', e.target.value ? parseFloat(e.target.value) : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-600 mb-2">Línea A</h4>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map((num) => (
                              <div key={num}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Balancín A{num}
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={formData[`sldPresionBalancinA${num}`] || ''}
                                  onChange={(e) => handleChange(`sldPresionBalancinA${num}`, e.target.value ? parseFloat(e.target.value) : null)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-600 mb-2">Línea B</h4>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map((num) => (
                              <div key={num}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Balancín B{num}
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={formData[`sldPresionBalancinB${num}`] || ''}
                                  onChange={(e) => handleChange(`sldPresionBalancinB${num}`, e.target.value ? parseFloat(e.target.value) : null)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Parámetros de Altura y Medidas */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Alturas y Medidas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Altura Cabezal Ext. Derecho
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.sldAlturaCabezalExtDerecho || ''}
                          onChange={(e) => handleChange('sldAlturaCabezalExtDerecho', e.target.value ? parseFloat(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Altura Cabezal Ext. Izquierdo
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.sldAlturaCabezalExtIzquierdo || ''}
                          onChange={(e) => handleChange('sldAlturaCabezalExtIzquierdo', e.target.value ? parseFloat(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Banda Transportadora
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.sldBandaTransportadora || ''}
                          onChange={(e) => handleChange('sldBandaTransportadora', e.target.value ? parseFloat(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Medida Portabobina
                        </label>
                        <input
                          type="number"
                          value={formData.sldMedidaPortabobina || ''}
                          onChange={(e) => handleChange('sldMedidaPortabobina', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ajuste Sensor Fail
                        </label>
                        <input
                          type="number"
                          value={formData.sldAjusteSensorFail || ''}
                          onChange={(e) => handleChange('sldAjusteSensorFail', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tornillos de Ajuste de Cabezal */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tornillos de Ajuste de Cabezal</h3>
                    <div className="space-y-4">
                      {/* Movimiento Horizontal Lado Derecho */}
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Movimiento Horizontal Lado Derecho</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tornillo Derecho
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.tornilloDerMovHorizCabezalDer ?? ''}
                              onChange={(e) => handleChange('tornilloDerMovHorizCabezalDer', e.target.value !== '' ? parseFloat(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tornillo Izquierdo
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.tornilloIzqMovHorizCabezalDer ?? ''}
                              onChange={(e) => handleChange('tornilloIzqMovHorizCabezalDer', e.target.value !== '' ? parseFloat(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Movimiento Horizontal Lado Izquierdo */}
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Movimiento Horizontal Lado Izquierdo</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tornillo Derecho
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.tornilloDerMovHorizCabezalIzq ?? ''}
                              onChange={(e) => handleChange('tornilloDerMovHorizCabezalIzq', e.target.value !== '' ? parseFloat(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tornillo Izquierdo
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.tornilloIzqMovHorizCabezalIzq ?? ''}
                              onChange={(e) => handleChange('tornilloIzqMovHorizCabezalIzq', e.target.value !== '' ? parseFloat(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Amortiguadores de Cabezal */}
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Amortiguadores de Cabezal</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tornillo A
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.tornilloAmortiguadorCabezalA ?? ''}
                              onChange={(e) => handleChange('tornilloAmortiguadorCabezalA', e.target.value !== '' ? parseFloat(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tornillo B
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.tornilloAmortiguadorCabezalB ?? ''}
                              onChange={(e) => handleChange('tornilloAmortiguadorCabezalB', e.target.value !== '' ? parseFloat(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tornillo C
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.tornilloAmortiguadorCabezalC ?? ''}
                              onChange={(e) => handleChange('tornilloAmortiguadorCabezalC', e.target.value !== '' ? parseFloat(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fuelles y Medidas del Triángulo */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Fuelles y Medidas del Triángulo</h3>
                    
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Fuelles de Bolsa</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Superior Izquierdo
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.fuelleSuperiorIzquierdo ?? ''}
                            onChange={(e) => handleChange('fuelleSuperiorIzquierdo', e.target.value !== '' ? parseFloat(e.target.value) : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Superior Derecho
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.fuelleSuperiorDerecho ?? ''}
                            onChange={(e) => handleChange('fuelleSuperiorDerecho', e.target.value !== '' ? parseFloat(e.target.value) : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Inferior Izquierdo
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.fuelleInferiorIzquierdo ?? ''}
                            onChange={(e) => handleChange('fuelleInferiorIzquierdo', e.target.value !== '' ? parseFloat(e.target.value) : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Inferior Derecho
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.fuelleInferiorDerecho ?? ''}
                            onChange={(e) => handleChange('fuelleInferiorDerecho', e.target.value !== '' ? parseFloat(e.target.value) : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ancho de Bolsa después del Triángulo (cm)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.anchoBolsaDespuesTriangulo ?? ''}
                          onChange={(e) => handleChange('anchoBolsaDespuesTriangulo', e.target.value !== '' ? parseFloat(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Distancia Barra Roscada antes del Triángulo (cm)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.distanciaBarraRoscadaTriangulo ?? ''}
                          onChange={(e) => handleChange('distanciaBarraRoscadaTriangulo', e.target.value !== '' ? parseFloat(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Longitud (cm)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.longitudBolsa ?? ''}
                          onChange={(e) => handleChange('longitudBolsa', e.target.value !== '' ? parseFloat(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sensores y Sincronización */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Sensores y Sincronización</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Feeding Bag Angle (Posición Servo)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.feedingBagAngle ?? ''}
                          onChange={(e) => handleChange('feedingBagAngle', e.target.value !== '' ? parseFloat(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Distancia Sensor Registro Color (cm)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.distanciaSensorRegistroColor ?? ''}
                          onChange={(e) => handleChange('distanciaSensorRegistroColor', e.target.value !== '' ? parseFloat(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Distancia Sensor Movimiento (cm)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.distanciaSensorMovimiento ?? ''}
                          onChange={(e) => handleChange('distanciaSensorMovimiento', e.target.value !== '' ? parseFloat(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Distancia de Presellado (cm)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.distanciaPresellado ?? ''}
                          onChange={(e) => handleChange('distanciaPresellado', e.target.value !== '' ? parseFloat(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Parámetros de Presión y Soplado */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Presiones y Soplado</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Presión Soplado Arriba
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.sldPresionSopladoArriba || ''}
                          onChange={(e) => handleChange('sldPresionSopladoArriba', e.target.value ? parseFloat(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Presión Soplado Abajo
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.sldPresionSopladoAbajo || ''}
                          onChange={(e) => handleChange('sldPresionSopladoAbajo', e.target.value ? parseFloat(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Presión Rodillo Servo L
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.sldPresionRodilloServoL || ''}
                          onChange={(e) => handleChange('sldPresionRodilloServoL', e.target.value ? parseFloat(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Presión Rodillo Servo R
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.sldPresionRodilloServoR || ''}
                          onChange={(e) => handleChange('sldPresionRodilloServoR', e.target.value ? parseFloat(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Soplar Inicio
                        </label>
                        <input
                          type="number"
                          value={formData.sldSoplarInicio || ''}
                          onChange={(e) => handleChange('sldSoplarInicio', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Soplar Terminar
                        </label>
                        <input
                          type="number"
                          value={formData.sldSoplarTerminar || ''}
                          onChange={(e) => handleChange('sldSoplarTerminar', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      {formData.sldTipoSelladora === 'bolsaPollo' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Silicona Inicio Ventosa
                            </label>
                            <input
                              type="number"
                              value={formData.sldSiliconaInicioVentoza || ''}
                              onChange={(e) => handleChange('sldSiliconaInicioVentoza', e.target.value ? parseInt(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Silicona Terminar Ventosa
                            </label>
                            <input
                              type="number"
                              value={formData.sldSiliconaTerminarVentoza || ''}
                              onChange={(e) => handleChange('sldSiliconaTerminarVentoza', e.target.value ? parseInt(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Tiempos, Sellado Silicona y Opciones */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tiempos, Sellado Silicona y Opciones</h3>
                    
                    {/* Grid para Silicona */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Sellado Silicona Lateral</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sellado Silicona Lateral Iniciar
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.selladoSiliconaLateralIniciar ?? ''}
                            onChange={(e) => handleChange('selladoSiliconaLateralIniciar', e.target.value !== '' ? parseFloat(e.target.value) : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sellado Silicona Lateral Final
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.selladoSiliconaLateralFinal ?? ''}
                            onChange={(e) => handleChange('selladoSiliconaLateralFinal', e.target.value !== '' ? parseFloat(e.target.value) : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Inputs numéricos: Tiempo Precalentar, Temporizador, Plancha */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tiempo Precalentar
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.tiempoPrecalentar ?? ''}
                          onChange={(e) => handleChange('tiempoPrecalentar', e.target.value !== '' ? parseFloat(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Temporizador
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.temporizador ?? ''}
                          onChange={(e) => handleChange('temporizador', e.target.value !== '' ? parseFloat(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Plancha
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.plancha ?? ''}
                          onChange={(e) => handleChange('plancha', e.target.value !== '' ? parseFloat(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Campos de texto: Montaje de Bobina, Diseño de Impresión (Válvula) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Montaje de Bobina
                        </label>
                        <input
                          type="text"
                          value={formData.montajeBobina || ''}
                          onChange={(e) => handleChange('montajeBobina', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Ej: Cara hacia arriba / Bobina invertida"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Diseño de Impresión (Válvula)
                        </label>
                        <input
                          type="text"
                          value={formData.disenoImpresionValvula || ''}
                          onChange={(e) => handleChange('disenoImpresionValvula', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Detalles del diseño o referencia"
                        />
                      </div>
                    </div>

                    {/* Switch / Checkbox booleano: ¿Lleva Postizo? */}
                    <div className="pt-2">
                      <label className="inline-flex items-center gap-3 cursor-pointer select-none p-3 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100/70 transition-colors">
                        <input
                          type="checkbox"
                          checked={!!formData.llevaPostizo}
                          onChange={(e) => handleChange('llevaPostizo', e.target.checked)}
                          className="w-5 h-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500 focus:ring-offset-0 transition-colors cursor-pointer"
                        />
                        <div>
                          <span className="text-sm font-semibold text-gray-800">¿Lleva Postizo?</span>
                          <p className="text-xs text-gray-500">Marcar si el proceso de sellado requiere la colocación de postizo.</p>
                        </div>
                      </label>
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
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
