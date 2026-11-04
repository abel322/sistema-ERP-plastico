'use client';

import React from 'react';
import { Droplets, AlertCircle, Info, Sparkles, CheckCircle2 } from 'lucide-react';

interface ArticuloInventario {
  id: string;
  nombre: string;
  codigo?: string | null;
  cantidad?: number | null;
  unidad?: string | null;
}

interface FormulacionTabProps {
  formulacion: {
    tipoDosificacionMolido?: 'PORCENTAJE' | 'KILOGRAMOS' | string;
    peletizadoId?: string | null;
    peletizadoPorcentaje?: number | null;
    peletizadoKgPor100?: number | null;
    llevaResinaEnMolido?: boolean | null;
    resinaMolidoId?: string | null;
    resinaMolidoKgPor100?: number | null;
    // Resinas Vírgenes (%)
    p3003?: number | null;
    lineal?: number | null;
    fb7000?: number | null;
    p0240?: number | null;
    p0348?: number | null;
    p7000f?: number | null;
    // Aditivos (%)
    deslizante?: number | null;
    masterbachBlanco?: number | null;
    masterbachNegro?: number | null;
    masterbachAzul?: number | null;
    masterbachAmarillo?: number | null;
    [key: string]: any;
  };
  onChange: (campo: string, valor: any) => void;
  peletizadosInventario?: ArticuloInventario[];
  resinasInventario?: ArticuloInventario[];
  articulosInventario?: ArticuloInventario[];
  formData?: any;
}

export function FormulacionTab({
  formulacion = {},
  onChange,
  peletizadosInventario = [],
  resinasInventario = [],
  articulosInventario = [],
  formData,
}: FormulacionTabProps) {
  // Lista unificada de peletizados si no se pasa explícitamente
  const peletizados =
    peletizadosInventario.length > 0
      ? peletizadosInventario
      : articulosInventario.filter(
          (a) =>
            a.nombre?.toLowerCase().includes('peletizado') ||
            a.nombre?.toLowerCase().includes('molido') ||
            a.codigo?.toLowerCase().includes('molido')
        );

  // Lista unificada de resinas si no se pasa explícitamente
  const resinas =
    resinasInventario.length > 0
      ? resinasInventario
      : articulosInventario.filter(
          (a) =>
            !a.nombre?.toLowerCase().includes('peletizado') &&
            !a.nombre?.toLowerCase().includes('molido')
        );

  const modo = formulacion.tipoDosificacionMolido || 'PORCENTAJE';
  const esKg = modo === 'KILOGRAMOS';

  // Obtener valor tolerando tanto clave canónica (p3003) como legacy (form3003)
  const getVal = (canonicalKey: string, legacyKey: string) => {
    if (formulacion[canonicalKey] !== undefined && formulacion[canonicalKey] !== null) {
      return formulacion[canonicalKey];
    }
    if (formulacion[legacyKey] !== undefined && formulacion[legacyKey] !== null) {
      return formulacion[legacyKey];
    }
    if (formData && formData[canonicalKey] !== undefined && formData[canonicalKey] !== null) {
      return formData[canonicalKey];
    }
    if (formData && formData[legacyKey] !== undefined && formData[legacyKey] !== null) {
      return formData[legacyKey];
    }
    return '';
  };

  const handleNumeroChange = (canonicalKey: string, legacyKey: string, rawVal: string) => {
    const num = rawVal === '' ? 0 : Number(rawVal);
    onChange(canonicalKey, num);
    if (legacyKey) {
      onChange(legacyKey, num);
    }
  };

  // Resinas Vírgenes y Aditivos (%)
  const resinasCampos = [
    { key: 'p3003', legacyKey: 'form3003', label: '3003 (Baja Densidad)' },
    { key: 'lineal', legacyKey: 'formLineal', label: 'Lineal (LLDPE)' },
    { key: 'fb7000', legacyKey: 'formFB7000', label: 'FB7000 (Baja)' },
    { key: 'p0240', legacyKey: 'form0240', label: '0240 (Baja Densidad)' },
    { key: 'p0348', legacyKey: 'form0348', label: '0348 (Baja Densidad)' },
    { key: 'p7000f', legacyKey: 'form7000F', label: '7000F (Alta Densidad)' },
    { key: 'deslizante', legacyKey: 'formDeslizante', label: 'Deslizante' },
    { key: 'masterbachBlanco', legacyKey: 'formMasterbachBlanco', label: 'Masterbach Blanco' },
    { key: 'masterbachNegro', legacyKey: 'formMasterbachNegro', label: 'Masterbach Negro' },
    { key: 'masterbachAzul', legacyKey: 'formMasterbachAzul', label: 'Masterbach Azul' },
    { key: 'masterbachAmarillo', legacyKey: 'formMasterbachAmarillo', label: 'Masterbach Amarillo' },
  ];

  // Cálculo de suma de porcentajes
  const totalPorcentajeResinas = resinasCampos.reduce((sum, item) => {
    const v = Number(getVal(item.key, item.legacyKey) || 0);
    return sum + (isNaN(v) ? 0 : v);
  }, 0);

  const porcentajePeletizado = !esKg ? Number(getVal('peletizadoPorcentaje', 'molido') || 0) : 0;
  const sumaTotal = totalPorcentajeResinas + porcentajePeletizado;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Formulación y Dosificación de Materia Prima
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configura la receta de producción: porcentaje base de resinas vírgenes, dosificación de molido y enriquecimiento de tolva.
          </p>
        </div>

        {/* Badge de Suma Total */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total formulación base:</span>
          <span
            className={`px-3 py-1 text-xs font-black rounded-xl border ${
              Math.abs(sumaTotal - 100) < 0.1
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
            }`}
          >
            {sumaTotal.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Tarjeta de Peletizado y Material Recuperado */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-50 to-emerald-50 dark:from-slate-800/80 dark:to-slate-800/60 rounded-2xl border border-amber-200/80 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-xl">
              <Droplets className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Peletizado / Material Recuperado (Inventario)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecciona la modalidad de dosificación de molido para tolva.
              </p>
            </div>
          </div>

          {/* Selector de Modalidad */}
          <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <button
              type="button"
              onClick={() => onChange('tipoDosificacionMolido', 'PORCENTAJE')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                !esKg
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              [%] Porcentaje sobre producción
            </button>
            <button
              type="button"
              onClick={() => onChange('tipoDosificacionMolido', 'KILOGRAMOS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                esKg
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              [KG] Kilogramos directos
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Selector de Peletizado en Inventario */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tipo de Peletizado / Molido en Inventario
            </label>
            <select
              value={formulacion.peletizadoId || ''}
              onChange={(e) => {
                const val = e.target.value || null;
                onChange('peletizadoId', val);
                if (!val) {
                  onChange('peletizadoPorcentaje', 0);
                  onChange('peletizadoKgPor100', 0);
                  onChange('molido', 0);
                  onChange('llevaResinaEnMolido', false);
                }
              }}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-xs font-medium"
            >
              <option value="">Sin Peletizado / 100% Virgen</option>
              {peletizados.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre} {item.codigo ? `(${item.codigo})` : ''} — Stock: {item.cantidad ?? 0} {item.unidad || 'kg'}
                </option>
              ))}
            </select>
          </div>

          {/* Input según Modalidad */}
          {!esKg ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Peletizado (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="0"
                  disabled={!formulacion.peletizadoId}
                  value={formulacion.peletizadoPorcentaje ?? ''}
                  onChange={(e) => {
                    const num = e.target.value === '' ? 0 : Number(e.target.value);
                    onChange('peletizadoPorcentaje', num);
                    onChange('molido', num);
                  }}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-xs font-bold ${
                    !formulacion.peletizadoId
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                  }`}
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">%</span>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Molido por cada 100 KG
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="100"
                  disabled={!formulacion.peletizadoId}
                  value={formulacion.peletizadoKgPor100 ?? ''}
                  onChange={(e) => {
                    const num = e.target.value === '' ? 0 : Number(e.target.value);
                    onChange('peletizadoKgPor100', num);
                  }}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-xs font-bold ${
                    !formulacion.peletizadoId
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                  }`}
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">KG</span>
              </div>
            </div>
          )}
        </div>

        {/* Sección de Enriquecimiento / Mezcla con Resina Virgen (solo si es KILOGRAMOS) */}
        {esKg && formulacion.peletizadoId && (
          <div className="p-4 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-amber-200/90 dark:border-slate-700 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(formulacion.llevaResinaEnMolido)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  onChange('llevaResinaEnMolido', checked);
                  if (checked && !formulacion.resinaMolidoId) {
                    const default3003 = resinas.find(
                      (r) =>
                        (r.codigo && r.codigo.toLowerCase().includes('3003')) ||
                        (r.nombre && r.nombre.toLowerCase().includes('3003'))
                    );
                    if (default3003) {
                      onChange('resinaMolidoId', default3003.id);
                    }
                  }
                }}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs font-black text-slate-900 dark:text-white">
                ¿Se mezcla con resina virgen adicional en tolva? (ej. LDPE 3003 en Cestera)
              </span>
            </label>

            {formulacion.llevaResinaEnMolido && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Resina virgen para mezcla
                  </label>
                  <select
                    value={formulacion.resinaMolidoId || ''}
                    onChange={(e) => onChange('resinaMolidoId', e.target.value || null)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-xs font-semibold"
                  >
                    <option value="">Seleccione resina virgen de refuerzo...</option>
                    {resinas.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nombre} {r.codigo ? `(${r.codigo})` : ''} — Stock: {r.cantidad ?? 0} {r.unidad || 'kg'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    KG de resina adicional por cada 100 KG
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="25"
                      value={formulacion.resinaMolidoKgPor100 ?? ''}
                      onChange={(e) => {
                        const num = e.target.value === '' ? 0 : Number(e.target.value);
                        onChange('resinaMolidoKgPor100', num);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-xs font-bold"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">KG</span>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200/80 dark:border-amber-900/50 flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      <strong>Cálculo en planta:</strong> Por cada 100 kg producidos se consumirán {Number(formulacion.peletizadoKgPor100 || 0)} kg de molido y {Number(formulacion.resinaMolidoKgPor100 || 0)} kg adicionales de resina virgen ({resinas.find(r => r.id === formulacion.resinaMolidoId)?.nombre || '3003'}), descontándose independientemente de los porcentajes base vírgenes.
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid de Resinas Vírgenes y Aditivos (%) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Resinas Vírgenes y Aditivos de Formulación (%)</span>
          </h3>
          <span className="text-xs text-slate-500">
            Suma parcial: <strong className="text-slate-800 dark:text-slate-200">{totalPorcentajeResinas.toFixed(1)}%</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {resinasCampos.map((field) => {
            const val = getVal(field.key, field.legacyKey);
            return (
              <div
                key={field.key}
                className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-blue-400 transition-colors"
              >
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 truncate" title={field.label}>
                  {field.label}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={val !== '' && val !== null && val !== undefined ? val : ''}
                    onChange={(e) => handleNumeroChange(field.key, field.legacyKey, e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-bold">%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default FormulacionTab;

