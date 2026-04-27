'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Plus, Search, Edit, Trash2, X, UserPlus, Phone, Mail, Package, Building2, Sparkles, ChevronDown, ChevronUp, Droplets, Grid, Settings2, Settings, Palette, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Cliente {
  id: string;
  nombre: string;
  rif: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  producto?: string;
  tipoProducto: string;
  material?: string;
  conImpresion?: boolean;
  ancho?: number;
  largo?: number;
  calibre?: number;
  pesoPorUnidad?: number;
  // Especificaciones Adicionales
  anchoBobina?: number;
  anchoValvula?: number;
  anchoSolapa?: number;
  anchoFuelle?: number;
  intensidadTratador?: number;
  pesoMaximoBobina?: number;
  perforacion?: boolean;
  muleteado?: boolean;
  tipoRefilado?: string;
  bolsasPorRollo?: number;
  rollosPorBulto?: number;
  tipoSellado?: string;
  tipoBobinaCliente?: string;
  // Formulación
  formFB7000?: number;
  form3003?: number;
  formLineal?: number;
  form0240?: number;
  form0348?: number;
  form7000F?: number;
  formDeslizante?: number;
  formMasterbachBlanco?: number;
  formMasterbachNegro?: number;
  formMasterbachAzul?: number;
  formMasterbachAmarillo?: number;
  // Serigrafía
  color1?: string;
  color2?: string;
  color3?: string;
  color4?: string;
  color5?: string;
  color6?: string;
  cilindro?: string;
  tipoImpresion?: string;
}

interface FormData {
  nombre: string;
  rif: string;
  contacto: string;
  telefono: string;
  email: string;
  direccion: string;
  producto: string;
  tipoProducto: string;
  material: string;
  conImpresion: boolean;
  ancho: string;
  largo: string;
  calibre: string;
  diametroAnchoBolsa: string;
  pesoPorUnidad: string;

  anchoBobina: string;
  anchoValvula: string;
  anchoSolapa: string;
  anchoFuelle: string;
  intensidadTratador: string;
  pesoMaximoBobina: string;
  perforacion: boolean;
  muleteado: boolean;
  tipoRefilado: string;
  bolsasPorRollo: string;
  rollosPorBulto: string;
  tipoSellado: string;
  tipoSelladoEstructura: string;
  repeticionesImagen: string;
  tipoBobinaCliente: string;
  laminaRebobinadorAncho: string;
  laminaRebobinadorCalibre: string;

  // Toggles de sub-tipos virtuales
  esBolsaPego: boolean;
  esBolsaFuelle: boolean;
  esTermoencogible: boolean;

  formFB7000: string;
  form3003: string;
  formLinear: string;
  form0240: string;
  form0348: string;
  form7000F: string;
  formDeslizante: string;
  formMasterbachBlanco: string;
  formMasterbachNegro: string;
  formMasterbachAzul: string;
  formMasterbachAmarillo: string;

  color1: string;
  color2: string;
  color3: string;
  color4: string;
  color5: string;
  color6: string;
  cilindro: string;
  tipoImpresion: string;
  serigrafiaTratadorIntensidad: string;

  // Parámetros de Máquinas - Extrusión
  extTemperaturaAmbiente: string;
  extMotorPrincipal: string;
  extTraccion: string;
  extSopladorPrincipal: string;
  extAberturaBlower: string;
  extCuelloGlobo: string;
  extTemperaturaCuelloGlobo: string;
  extTraccionRebobinador: string;
  extRebobinadorWinding1: string;
  extRebobinadorWinding2: string;
  extIntensidadTratador: string;
  extTemperaturaZ1: string;
  extTemperaturaZ2: string;
  extTemperaturaZ3: string;
  extTemperaturaZ4: string;
  extTemperaturaZ5: string;
  extTemperaturaZ6: string;
  extTemperaturaZ7: string;
  extTemperaturaZ8: string;
  extTemperaturaZ9: string;
  extTemperaturaZ10: string;
  extTemperaturaZ11: string;
  extTemperaturaZ12: string;
  extTemperaturaZ13: string;
  extTemperaturaZ14: string;
  extTemperaturaZ15: string;
  extTemperaturaZ16: string;
  extTemperaturaZ17: string;
  extTemperaturaZ18: string;
  extTemperaturaZ19: string;
  extTemperaturaZ20: string;
  extOrientacionFlujoBlower: string;

  // Parámetros de Máquinas - Sellado
  sldTipoSelladora: string;
  sldCapacidadBolsa: string;
  sldTemperaturaAmbiente: string;
  sldTornilloEsparrago: string;
  sldTempSuperior: string;
  sldTempInferior: string;
  sldTempValvula: string;
  sldPresellado_A: string;
  sldPresellado_B: string;
  sldTiempoLimite: string;
  sldMicroperforaciones: string;
  sldMuleteado: string;
  sldTempSuperiorLineaA: string;
  sldTempInferiorLineaA: string;
  sldTempSuperiorLineaB: string;
  sldTempInferiorLineaB: string;
  sldTempTroquel: string;
  sldTempSuperiorRecta: string;
  sldTempSuperiorCurva: string;
  sldTempCuchilla: string;
  sldRodilloAnchoValvula: string;
  sldGPM: string;
  sldVelocidadTransportador: string;
  sldCicloTrabajo: string;
  sldPresionVentosa: string;
  sldTensionPrincipal: string;
  sldPresionBalancin1: string;
  sldPresionBalancin2: string;
  sldPresionBalancin3: string;
  sldPresionBalancinA1: string;
  sldPresionBalancinA2: string;
  sldPresionBalancinA3: string;
  sldPresionBalancinA4: string;
  sldPresionBalancinB1: string;
  sldPresionBalancinB2: string;
  sldPresionBalancinB3: string;
  sldPresionBalancinB4: string;
  sldAlturaCabezalExtDerecho: string;
  sldAlturaCabezalExtIzquierdo: string;
  sldBandaTransportadora: string;
  sldMedidaPortabobina: string;
  sldAjusteSensorFail: string;
  sldPresionSopladoArriba: string;
  sldPresionSopladoAbajo: string;
  sldPresionRodilloServoL: string;
  sldPresionRodilloServoR: string;
  sldSoplarInicio: string;
  sldSoplarTerminar: string;
  sldSiliconaInicioVentoza: string;
  sldSiliconaTerminarVentoza: string;
}

const initialFormData: FormData = {
  nombre: '',
  rif: '',
  contacto: '',
  telefono: '',
  email: '',
  direccion: '',
  producto: '',
  tipoProducto: '',
  material: '',
  conImpresion: false,
  ancho: '',
  largo: '',
  calibre: '',
  diametroAnchoBolsa: '',
  pesoPorUnidad: '',

  anchoBobina: '',
  anchoValvula: '',
  anchoSolapa: '',
  anchoFuelle: '',
  intensidadTratador: '',
  pesoMaximoBobina: '',
  perforacion: false,
  muleteado: false,
  tipoRefilado: '',
  bolsasPorRollo: '',
  rollosPorBulto: '',
  tipoSellado: '',
  tipoSelladoEstructura: '',
  repeticionesImagen: '',
  tipoBobinaCliente: '',
  laminaRebobinadorAncho: '',
  laminaRebobinadorCalibre: '',

  esBolsaPego: false,
  esBolsaFuelle: false,
  esTermoencogible: false,

  formFB7000: '',
  form3003: '',
  formLineal: '',
  form0240: '',
  form0348: '',
  form7000F: '',
  formDeslizante: '',
  formMasterbachBlanco: '',
  formMasterbachNegro: '',
  formMasterbachAzul: '',
  formMasterbachAmarillo: '',

  color1: '',
  color2: '',
  color3: '',
  color4: '',
  color5: '',
  color6: '',
  cilindro: '',
  tipoImpresion: '',
  serigrafiaTratadorIntensidad: '',

  // Parámetros de Máquinas - Extrusión
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

  // Parámetros de Máquinas - Sellado
  sldTipoSelladora: '',
  sldCapacidadBolsa: '',
  sldTemperaturaAmbiente: '',
  sldTornilloEsparrago: '',
  sldTempSuperior: '',
  sldTempInferior: '',
  sldTempValvula: '',
  sldPresellado_A: '',
  sldPresellado_B: '',
  sldTiempoLimite: '',
  sldMicroperforaciones: '',
  sldMuleteado: '',
  sldTempSuperiorLineaA: '',
  sldTempInferiorLineaA: '',
  sldTempSuperiorLineaB: '',
  sldTempInferiorLineaB: '',
  sldTempTroquel: '',
  sldTempSuperiorRecta: '',
  sldTempSuperiorCurva: '',
  sldTempCuchilla: '',
  sldRodilloAnchoValvula: '',
  sldGPM: '',
  sldVelocidadTransportador: '',
  sldCicloTrabajo: '',
  sldPresionVentosa: '',
  sldTensionPrincipal: '',
  sldPresionBalancin1: '',
  sldPresionBalancin2: '',
  sldPresionBalancin3: '',
  sldPresionBalancinA1: '',
  sldPresionBalancinA2: '',
  sldPresionBalancinA3: '',
  sldPresionBalancinA4: '',
  sldPresionBalancinB1: '',
  sldPresionBalancinB2: '',
  sldPresionBalancinB3: '',
  sldPresionBalancinB4: '',
  sldAlturaCabezalExtDerecho: '',
  sldAlturaCabezalExtIzquierdo: '',
  sldBandaTransportadora: '',
  sldMedidaPortabobina: '',
  sldAjusteSensorFail: '',
  sldPresionSopladoArriba: '',
  sldPresionSopladoAbajo: '',
  sldPresionRodilloServoL: '',
  sldPresionRodilloServoR: '',
  sldSoplarInicio: '',
  sldSoplarTerminar: '',
  sldSiliconaInicioVentoza: '',
  sldSiliconaTerminarVentoza: '',
};

export default function ClientesPage() {
  const { data: session } = useSession() || {};
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [showFormulacion, setShowFormulacion] = useState(false);
  const [showSerigrafia, setShowSerigrafia] = useState(false);
  const [activeTab, setActiveTab] = useState('basicos'); // 'basicos', 'especificaciones', 'formulacion', 'serigrafia'

  const isAdmin = (session?.user as any)?.rol === 'admin';

  useEffect(() => {
    fetchClientes();
  }, [page, limit, busqueda]);

  // Auto-calcular pesoPorUnidad a partir de ancho * largo * calibre / 1000
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

  // Auto-calcular cilindroBase según tipo de producto y sellado
  useEffect(() => {
    let calculatedValue = '';
    
    if (formData.tipoProducto === 'Bolsa') {
      const repeticiones = parseFloat(formData.repeticionesImagen) || 1; // Si no hay valor, usar 1 para evitar división por 0
      
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
    
    setFormData(prev => ({ ...prev, cilindro: calculatedValue }));
  }, [formData.tipoProducto, formData.tipoSellado, formData.ancho, formData.largo, formData.diametroAnchoBolsa, formData.repeticionesImagen]);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(busqueda && { busqueda }),
      });
      const res = await fetch(`/api/clientes?${params}`);
      const data = await res.json();
      setClientes(data?.clientes || []);
      setTotalPages(data?.totalPages || 1);
      setTotal(data?.total || 0);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    // Validar que la página esté dentro de los límites
    if (newPage < 1 || newPage > totalPages) {
      return;
    }
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    // Validar que el límite sea válido
    const validLimits = [10, 25, 50, 100];
    if (!validLimits.includes(newLimit)) {
      return;
    }
    setLimit(newLimit);
    // Resetear a página 1 al cambiar el límite
    setPage(1);
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormData(initialFormData);
    setSelectedCliente(null);
    setError('');
    setActiveTab('basicos');
    setShowModal(true);
  };

  const handleOpenEditModal = (cliente: Cliente) => {
    setModalMode('edit');
    setSelectedCliente(cliente);
    setFormData({
      ...initialFormData,
      nombre: cliente.nombre || '',
      rif: cliente.rif || '',
      contacto: cliente.contacto || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      direccion: cliente.direccion || '',
      producto: cliente.producto || '',
      tipoProducto: cliente.tipoProducto || '',
      material: cliente.material || '',
      conImpresion: cliente.conImpresion || false,
      ancho: cliente.ancho?.toString() || '',
      largo: cliente.largo?.toString() || '',
      calibre: cliente.calibre?.toString() || '',
      diametroAnchoBolsa: (cliente as any).diametroAnchoBolsa?.toString() || '',
      pesoPorUnidad: cliente.pesoPorUnidad?.toString() || '',
      anchoBobina: cliente.anchoBobina?.toString() || '',
      anchoValvula: cliente.anchoValvula?.toString() || '',
      anchoSolapa: cliente.anchoSolapa?.toString() || '',
      anchoFuelle: cliente.anchoFuelle?.toString() || '',
      intensidadTratador: cliente.intensidadTratador?.toString() || '',
      pesoMaximoBobina: cliente.pesoMaximoBobina?.toString() || '',
      perforacion: cliente.perforacion || false,
      muleteado: cliente.muleteado || false,
      tipoRefilado: cliente.tipoRefilado || '',
      bolsasPorRollo: cliente.bolsasPorRollo?.toString() || '',
      rollosPorBulto: cliente.rollosPorBulto?.toString() || '',
      tipoSellado: cliente.tipoSellado || '',
      tipoSelladoEstructura: (cliente as any).tipoSelladoEstructura || '',
      repeticionesImagen: (cliente as any).repeticionesImagen?.toString() || '',
      tipoBobinaCliente: cliente.tipoBobinaCliente || '',
      laminaRebobinadorAncho: (cliente as any).laminaRebobinadorAncho?.toString() || '',
      laminaRebobinadorCalibre: (cliente as any).laminaRebobinadorCalibre?.toString() || '',

      esBolsaPego: !!cliente.anchoValvula,
      esBolsaFuelle: !!cliente.anchoFuelle,
      esTermoencogible: !!cliente.pesoMaximoBobina,

      formFB7000: cliente.formFB7000?.toString() || '',
      form3003: cliente.form3003?.toString() || '',
      formLineal: cliente.formLineal?.toString() || '',
      form0240: cliente.form0240?.toString() || '',
      form0348: cliente.form0348?.toString() || '',
      form7000F: cliente.form7000F?.toString() || '',
      formDeslizante: cliente.formDeslizante?.toString() || '',
      formMasterbachBlanco: cliente.formMasterbachBlanco?.toString() || '',
      formMasterbachNegro: cliente.formMasterbachNegro?.toString() || '',
      formMasterbachAzul: cliente.formMasterbachAzul?.toString() || '',
      formMasterbachAmarillo: cliente.formMasterbachAmarillo?.toString() || '',

      color1: cliente.color1 || '',
      color2: cliente.color2 || '',
      color3: cliente.color3 || '',
      color4: cliente.color4 || '',
      color5: cliente.color5 || '',
      color6: cliente.color6 || '',
      cilindro: cliente.cilindro || '',
      tipoImpresion: cliente.tipoImpresion || '',
      serigrafiaTratadorIntensidad: (cliente as any).serigrafiaTratadorIntensidad?.toString() || '',

      // Parámetros de Máquinas - Extrusión
      extTemperaturaAmbiente: (cliente as any).extTemperaturaAmbiente?.toString() || '',
      extMotorPrincipal: (cliente as any).extMotorPrincipal?.toString() || '',
      extTraccion: (cliente as any).extTraccion?.toString() || '',
      extSopladorPrincipal: (cliente as any).extSopladorPrincipal?.toString() || '',
      extAberturaBlower: (cliente as any).extAberturaBlower?.toString() || '',
      extCuelloGlobo: (cliente as any).extCuelloGlobo?.toString() || '',
      extTemperaturaCuelloGlobo: (cliente as any).extTemperaturaCuelloGlobo?.toString() || '',
      extTraccionRebobinador: (cliente as any).extTraccionRebobinador?.toString() || '',
      extRebobinadorWinding1: (cliente as any).extRebobinadorWinding1?.toString() || '',
      extRebobinadorWinding2: (cliente as any).extRebobinadorWinding2?.toString() || '',
      extIntensidadTratador: (cliente as any).extIntensidadTratador?.toString() || '',
      extOrientacionFlujoBlower: (cliente as any).extOrientacionFlujoBlower?.toString() || '',
      extTemperaturaZ1: (cliente as any).extTemperaturaZ1?.toString() || '',
      extTemperaturaZ2: (cliente as any).extTemperaturaZ2?.toString() || '',
      extTemperaturaZ3: (cliente as any).extTemperaturaZ3?.toString() || '',
      extTemperaturaZ4: (cliente as any).extTemperaturaZ4?.toString() || '',
      extTemperaturaZ5: (cliente as any).extTemperaturaZ5?.toString() || '',
      extTemperaturaZ6: (cliente as any).extTemperaturaZ6?.toString() || '',
      extTemperaturaZ7: (cliente as any).extTemperaturaZ7?.toString() || '',
      extTemperaturaZ8: (cliente as any).extTemperaturaZ8?.toString() || '',
      extTemperaturaZ9: (cliente as any).extTemperaturaZ9?.toString() || '',
      extTemperaturaZ10: (cliente as any).extTemperaturaZ10?.toString() || '',
      extTemperaturaZ11: (cliente as any).extTemperaturaZ11?.toString() || '',
      extTemperaturaZ12: (cliente as any).extTemperaturaZ12?.toString() || '',
      extTemperaturaZ13: (cliente as any).extTemperaturaZ13?.toString() || '',
      extTemperaturaZ14: (cliente as any).extTemperaturaZ14?.toString() || '',
      extTemperaturaZ15: (cliente as any).extTemperaturaZ15?.toString() || '',
      extTemperaturaZ16: (cliente as any).extTemperaturaZ16?.toString() || '',
      extTemperaturaZ17: (cliente as any).extTemperaturaZ17?.toString() || '',
      extTemperaturaZ18: (cliente as any).extTemperaturaZ18?.toString() || '',
      extTemperaturaZ19: (cliente as any).extTemperaturaZ19?.toString() || '',
      extTemperaturaZ20: (cliente as any).extTemperaturaZ20?.toString() || '',

      // Parámetros de Sellado
      sldTipoSelladora: (cliente as any).sldTipoSelladora || '',
      sldCapacidadBolsa: (cliente as any).sldCapacidadBolsa?.toString() || '',
      sldTemperaturaAmbiente: (cliente as any).sldTemperaturaAmbiente?.toString() || '',
      sldTornilloEsparrago: (cliente as any).sldTornilloEsparrago?.toString() || '',
      sldTempSuperior: (cliente as any).sldTempSuperior?.toString() || '',
      sldTempInferior: (cliente as any).sldTempInferior?.toString() || '',
      sldTempValvula: (cliente as any).sldTempValvula?.toString() || '',
      sldPresellado_A: (cliente as any).sldPresellado_A?.toString() || '',
      sldPresellado_B: (cliente as any).sldPresellado_B?.toString() || '',
      sldTiempoLimite: (cliente as any).sldTiempoLimite?.toString() || '',
      sldMicroperforaciones: (cliente as any).sldMicroperforaciones || '',
      sldMuleteado: (cliente as any).sldMuleteado || '',
      sldTempSuperiorLineaA: (cliente as any).sldTempSuperiorLineaA?.toString() || '',
      sldTempInferiorLineaA: (cliente as any).sldTempInferiorLineaA?.toString() || '',
      sldTempSuperiorLineaB: (cliente as any).sldTempSuperiorLineaB?.toString() || '',
      sldTempInferiorLineaB: (cliente as any).sldTempInferiorLineaB?.toString() || '',
      sldTempTroquel: (cliente as any).sldTempTroquel?.toString() || '',
      sldTempSuperiorRecta: (cliente as any).sldTempSuperiorRecta?.toString() || '',
      sldTempSuperiorCurva: (cliente as any).sldTempSuperiorCurva?.toString() || '',
      sldTempCuchilla: (cliente as any).sldTempCuchilla?.toString() || '',
      sldRodilloAnchoValvula: (cliente as any).sldRodilloAnchoValvula?.toString() || '',
      sldGPM: (cliente as any).sldGPM?.toString() || '',
      sldVelocidadTransportador: (cliente as any).sldVelocidadTransportador?.toString() || '',
      sldCicloTrabajo: (cliente as any).sldCicloTrabajo?.toString() || '',
      sldPresionVentosa: (cliente as any).sldPresionVentosa?.toString() || '',
      sldTensionPrincipal: (cliente as any).sldTensionPrincipal?.toString() || '',
      sldPresionBalancin1: (cliente as any).sldPresionBalancin1?.toString() || '',
      sldPresionBalancin2: (cliente as any).sldPresionBalancin2?.toString() || '',
      sldPresionBalancin3: (cliente as any).sldPresionBalancin3?.toString() || '',
      sldPresionBalancinA1: (cliente as any).sldPresionBalancinA1?.toString() || '',
      sldPresionBalancinA2: (cliente as any).sldPresionBalancinA2?.toString() || '',
      sldPresionBalancinA3: (cliente as any).sldPresionBalancinA3?.toString() || '',
      sldPresionBalancinA4: (cliente as any).sldPresionBalancinA4?.toString() || '',
      sldPresionBalancinB1: (cliente as any).sldPresionBalancinB1?.toString() || '',
      sldPresionBalancinB2: (cliente as any).sldPresionBalancinB2?.toString() || '',
      sldPresionBalancinB3: (cliente as any).sldPresionBalancinB3?.toString() || '',
      sldPresionBalancinB4: (cliente as any).sldPresionBalancinB4?.toString() || '',
      sldAlturaCabezalExtDerecho: (cliente as any).sldAlturaCabezalExtDerecho?.toString() || '',
      sldAlturaCabezalExtIzquierdo: (cliente as any).sldAlturaCabezalExtIzquierdo?.toString() || '',
      sldBandaTransportadora: (cliente as any).sldBandaTransportadora?.toString() || '',
      sldMedidaPortabobina: (cliente as any).sldMedidaPortabobina?.toString() || '',
      sldAjusteSensorFail: (cliente as any).sldAjusteSensorFail?.toString() || '',
      sldPresionSopladoArriba: (cliente as any).sldPresionSopladoArriba?.toString() || '',
      sldPresionSopladoAbajo: (cliente as any).sldPresionSopladoAbajo?.toString() || '',
      sldPresionRodilloServoL: (cliente as any).sldPresionRodilloServoL?.toString() || '',
      sldPresionRodilloServoR: (cliente as any).sldPresionRodilloServoR?.toString() || '',
      sldSoplarInicio: (cliente as any).sldSoplarInicio?.toString() || '',
      sldSoplarTerminar: (cliente as any).sldSoplarTerminar?.toString() || '',
      sldSiliconaInicioVentoza: (cliente as any).sldSiliconaInicioVentoza?.toString() || '',
      sldSiliconaTerminarVentoza: (cliente as any).sldSiliconaTerminarVentoza?.toString() || '',
    });
    setError('');
    setActiveTab('basicos');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCliente(null);
    setFormData(initialFormData);
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const parseNum = (val: string) => val ? parseFloat(val) : null;
    const parseIntNum = (val: string) => val ? parseInt(val) : null;

    try {
      const payload: any = {
        nombre: formData.nombre,
        rif: formData.rif,
        contacto: formData.contacto || null,
        telefono: formData.telefono || null,
        email: formData.email || null,
        direccion: formData.direccion || null,
        producto: formData.producto || null,
        tipoProducto: formData.tipoProducto,
        material: formData.material || null,
        conImpresion: formData.conImpresion,
        ancho: parseNum(formData.ancho),
        largo: parseNum(formData.largo),
        calibre: parseNum(formData.calibre),
        diametroAnchoBolsa: (formData.tipoProducto === 'Bobina' && formData.conImpresion) ? parseNum(formData.diametroAnchoBolsa) : null,
        pesoPorUnidad: parseNum(formData.pesoPorUnidad),

        anchoBobina: formData.tipoProducto === 'Bobina' ? parseNum(formData.anchoBobina) : null,
        anchoValvula: formData.esBolsaPego ? parseNum(formData.anchoValvula) : null,
        anchoSolapa: formData.esBolsaPego ? parseNum(formData.anchoSolapa) : null,
        anchoFuelle: (formData.esBolsaPego || formData.esBolsaFuelle) ? parseNum(formData.anchoFuelle) : null,
        intensidadTratador: formData.conImpresion ? parseNum(formData.intensidadTratador) : null,
        pesoMaximoBobina: formData.tipoProducto === 'Bobina' && formData.esTermoencogible ? parseNum(formData.pesoMaximoBobina) : null,
        perforacion: formData.perforacion,
        muleteado: formData.muleteado,
        tipoRefilado: formData.tipoRefilado || null,
        bolsasPorRollo: parseIntNum(formData.bolsasPorRollo),
        rollosPorBulto: parseIntNum(formData.rollosPorBulto),
        tipoSellado: formData.tipoSellado || null,
        tipoSelladoEstructura: formData.tipoSelladoEstructura || null,
        repeticionesImagen: formData.conImpresion ? parseIntNum(formData.repeticionesImagen) : null,
        tipoBobinaCliente: formData.tipoBobinaCliente || null,
        // Valores calculados para medidas de lámina por rebobinador
        laminaRebobinadorAncho: formData.tipoBobinaCliente === 'Lamina' ? (() => {
          if (formData.tipoSellado === 'Inferior' && formData.esBolsaPego && formData.ancho && formData.anchoFuelle && formData.anchoSolapa) {
            return parseNum(((parseFloat(formData.ancho) * 2) + (parseFloat(formData.anchoFuelle) * 2) + parseFloat(formData.anchoSolapa)).toFixed(2));
          } else if (formData.tipoSellado === 'Lateral' && formData.largo) {
            return parseNum((parseFloat(formData.largo) * 2).toFixed(2));
          } else if (formData.tipoProducto === 'Bobina' && formData.anchoBobina) {
            return parseNum(formData.anchoBobina);
          } else if (formData.ancho) {
            return parseNum(formData.ancho);
          }
          return null;
        })() : null,
        laminaRebobinadorCalibre: formData.tipoBobinaCliente === 'Lamina' ? (() => {
          if (formData.tipoSellado === 'Lateral' && formData.calibre) {
            return parseNum((parseFloat(formData.calibre) / 2).toFixed(2));
          } else if (formData.calibre) {
            return parseNum(formData.calibre);
          }
          return null;
        })() : null,

        formFB7000: parseNum(formData.formFB7000),
        form3003: parseNum(formData.form3003),
        formLineal: parseNum(formData.formLineal),
        form0240: parseNum(formData.form0240),
        form0348: parseNum(formData.form0348),
        form7000F: parseNum(formData.form7000F),
        formDeslizante: parseNum(formData.formDeslizante),
        formMasterbachBlanco: parseNum(formData.formMasterbachBlanco),
        formMasterbachNegro: parseNum(formData.formMasterbachNegro),
        formMasterbachAzul: parseNum(formData.formMasterbachAzul),
        formMasterbachAmarillo: parseNum(formData.formMasterbachAmarillo),

        color1: formData.conImpresion ? formData.color1 : null,
        color2: formData.conImpresion ? formData.color2 : null,
        color3: formData.conImpresion ? formData.color3 : null,
        color4: formData.conImpresion ? formData.color4 : null,
        color5: formData.conImpresion ? formData.color5 : null,
        color6: formData.conImpresion ? formData.color6 : null,
        cilindro: formData.conImpresion ? formData.cilindro : null,
        tipoImpresion: formData.conImpresion ? formData.tipoImpresion : null,
        serigrafiaTratadorIntensidad: formData.conImpresion ? parseNum(formData.serigrafiaTratadorIntensidad) : null,

        // Parámetros de Máquinas - Extrusión
        extTemperaturaAmbiente: parseNum(formData.extTemperaturaAmbiente),
        extMotorPrincipal: parseNum(formData.extMotorPrincipal),
        extTraccion: parseNum(formData.extTraccion),
        extSopladorPrincipal: parseNum(formData.extSopladorPrincipal),
        extAberturaBlower: parseNum(formData.extAberturaBlower),
        extCuelloGlobo: parseNum(formData.extCuelloGlobo),
        extTemperaturaCuelloGlobo: parseNum(formData.extTemperaturaCuelloGlobo),
        extTraccionRebobinador: parseNum(formData.extTraccionRebobinador),
        extRebobinadorWinding1: parseNum(formData.extRebobinadorWinding1),
        extRebobinadorWinding2: parseNum(formData.extRebobinadorWinding2),
        extIntensidadTratador: parseNum(formData.extIntensidadTratador),
        extOrientacionFlujoBlower: parseNum(formData.extOrientacionFlujoBlower),
        
        // Temperaturas por Zonas (enteros)
        extTemperaturaZ1: parseIntNum(formData.extTemperaturaZ1),
        extTemperaturaZ2: parseIntNum(formData.extTemperaturaZ2),
        extTemperaturaZ3: parseIntNum(formData.extTemperaturaZ3),
        extTemperaturaZ4: parseIntNum(formData.extTemperaturaZ4),
        extTemperaturaZ5: parseIntNum(formData.extTemperaturaZ5),
        extTemperaturaZ6: parseIntNum(formData.extTemperaturaZ6),
        extTemperaturaZ7: parseIntNum(formData.extTemperaturaZ7),
        extTemperaturaZ8: parseIntNum(formData.extTemperaturaZ8),
        extTemperaturaZ9: parseIntNum(formData.extTemperaturaZ9),
        extTemperaturaZ10: parseIntNum(formData.extTemperaturaZ10),
        extTemperaturaZ11: parseIntNum(formData.extTemperaturaZ11),
        extTemperaturaZ12: parseIntNum(formData.extTemperaturaZ12),
        extTemperaturaZ13: parseIntNum(formData.extTemperaturaZ13),
        extTemperaturaZ14: parseIntNum(formData.extTemperaturaZ14),
        extTemperaturaZ15: parseIntNum(formData.extTemperaturaZ15),
        extTemperaturaZ16: parseIntNum(formData.extTemperaturaZ16),
        extTemperaturaZ17: parseIntNum(formData.extTemperaturaZ17),
        extTemperaturaZ18: parseIntNum(formData.extTemperaturaZ18),
        extTemperaturaZ19: parseIntNum(formData.extTemperaturaZ19),
        extTemperaturaZ20: parseIntNum(formData.extTemperaturaZ20),

        // Parámetros de Sellado
        sldTipoSelladora: formData.sldTipoSelladora || null,
        sldCapacidadBolsa: parseIntNum(formData.sldCapacidadBolsa),
        sldTemperaturaAmbiente: parseNum(formData.sldTemperaturaAmbiente),
        sldTornilloEsparrago: parseNum(formData.sldTornilloEsparrago),
        sldTempSuperior: parseIntNum(formData.sldTempSuperior),
        sldTempInferior: parseIntNum(formData.sldTempInferior),
        sldTempValvula: parseIntNum(formData.sldTempValvula),
        sldPresellado_A: parseIntNum(formData.sldPresellado_A),
        sldPresellado_B: parseIntNum(formData.sldPresellado_B),
        sldTiempoLimite: parseIntNum(formData.sldTiempoLimite),
        sldMicroperforaciones: formData.sldMicroperforaciones || null,
        sldMuleteado: formData.sldMuleteado || null,
        sldTempSuperiorLineaA: parseIntNum(formData.sldTempSuperiorLineaA),
        sldTempInferiorLineaA: parseIntNum(formData.sldTempInferiorLineaA),
        sldTempSuperiorLineaB: parseIntNum(formData.sldTempSuperiorLineaB),
        sldTempInferiorLineaB: parseIntNum(formData.sldTempInferiorLineaB),
        sldTempTroquel: parseIntNum(formData.sldTempTroquel),
        sldTempSuperiorRecta: parseIntNum(formData.sldTempSuperiorRecta),
        sldTempSuperiorCurva: parseIntNum(formData.sldTempSuperiorCurva),
        sldTempCuchilla: parseNum(formData.sldTempCuchilla),
        sldRodilloAnchoValvula: parseIntNum(formData.sldRodilloAnchoValvula),
        sldGPM: parseIntNum(formData.sldGPM),
        sldVelocidadTransportador: parseNum(formData.sldVelocidadTransportador),
        sldCicloTrabajo: parseNum(formData.sldCicloTrabajo),
        sldPresionVentosa: parseNum(formData.sldPresionVentosa),
        sldTensionPrincipal: parseNum(formData.sldTensionPrincipal),
        sldPresionBalancin1: parseNum(formData.sldPresionBalancin1),
        sldPresionBalancin2: parseNum(formData.sldPresionBalancin2),
        sldPresionBalancin3: parseNum(formData.sldPresionBalancin3),
        sldPresionBalancinA1: parseNum(formData.sldPresionBalancinA1),
        sldPresionBalancinA2: parseNum(formData.sldPresionBalancinA2),
        sldPresionBalancinA3: parseNum(formData.sldPresionBalancinA3),
        sldPresionBalancinA4: parseNum(formData.sldPresionBalancinA4),
        sldPresionBalancinB1: parseNum(formData.sldPresionBalancinB1),
        sldPresionBalancinB2: parseNum(formData.sldPresionBalancinB2),
        sldPresionBalancinB3: parseNum(formData.sldPresionBalancinB3),
        sldPresionBalancinB4: parseNum(formData.sldPresionBalancinB4),
        sldAlturaCabezalExtDerecho: parseNum(formData.sldAlturaCabezalExtDerecho),
        sldAlturaCabezalExtIzquierdo: parseNum(formData.sldAlturaCabezalExtIzquierdo),
        sldBandaTransportadora: parseNum(formData.sldBandaTransportadora),
        sldMedidaPortabobina: parseIntNum(formData.sldMedidaPortabobina),
        sldAjusteSensorFail: parseIntNum(formData.sldAjusteSensorFail),
        sldPresionSopladoArriba: parseNum(formData.sldPresionSopladoArriba),
        sldPresionSopladoAbajo: parseNum(formData.sldPresionSopladoAbajo),
        sldPresionRodilloServoL: parseNum(formData.sldPresionRodilloServoL),
        sldPresionRodilloServoR: parseNum(formData.sldPresionRodilloServoR),
        sldSoplarInicio: parseIntNum(formData.sldSoplarInicio),
        sldSoplarTerminar: parseIntNum(formData.sldSoplarTerminar),
        sldSiliconaInicioVentoza: parseIntNum(formData.sldSiliconaInicioVentoza),
        sldSiliconaTerminarVentoza: parseIntNum(formData.sldSiliconaTerminarVentoza),
      };

      const url = modalMode === 'create' ? '/api/clientes' : `/api/clientes/${selectedCliente?.id}`;
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al guardar cliente');
      }

      handleCloseModal();
      fetchClientes();
    } catch (err: any) {
      setError(err.message || 'Error al guardar cliente');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Está seguro de eliminar al cliente "${nombre}"?`)) return;
    try {
      const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE' });
      if (res.ok) fetchClientes();
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
    }
  };

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Clientes</h1>
            <p className="mt-1 text-sm text-gray-600 sm:text-base">Gestión avanzada de clientes y productos</p>
          </div>
          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleOpenCreateModal}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/30 transition-all hover:shadow-xl hover:shadow-purple-500/40 sm:w-auto"
            >
              <Sparkles className="relative h-5 w-5" />
              <span className="relative">Registrar Nuevo Cliente</span>
            </motion.button>
          )}
        </div>

        <div className="rounded-xl bg-white p-4 shadow-md sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex-1 sm:max-w-md relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o RIF..."
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          <div className="hidden md:block overflow-x-auto relative">
            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  <p className="text-sm font-medium text-gray-600">Cargando datos...</p>
                </div>
              </div>
            )}
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RIF</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medidas</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-purple-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap"><div className="font-medium text-gray-900">{cliente.nombre}</div></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cliente.rif}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cliente.producto || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">{cliente.tipoProducto}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cliente.tipoProducto === 'Bobina'
                        ? `${cliente.anchoBobina || '-'}x${cliente.calibre || '-'}`
                        : `${cliente.ancho || '-'}${cliente.largo ? `x${cliente.largo}` : ''}x${cliente.calibre || '-'}`
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      {isAdmin && (
                        <div className="flex justify-center space-x-2">
                          <button onClick={() => handleOpenEditModal(cliente)} className="text-cyan-600 hover:text-cyan-900"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => handleDelete(cliente.id, cliente.nombre)} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {clientes.length === 0 && <div className="text-center py-10 text-gray-500">No hay clientes registrados</div>}
          </div>

          <div className="grid grid-cols-1 gap-4 md:hidden relative">
            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  <p className="text-sm font-medium text-gray-600">Cargando datos...</p>
                </div>
              </div>
            )}
            {clientes.map((c) => (
              <div key={c.id} className="bg-white p-4 rounded-lg shadow border border-gray-100">
                <h3 className="font-bold text-gray-800">{c.nombre}</h3>
                <p className="text-sm text-gray-500">{c.rif}</p>
                <div className="mt-2 text-sm"><span className="font-semibold">Producto:</span> {c.tipoProducto}</div>
                {isAdmin && (
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => handleOpenEditModal(c)} className="flex-1 bg-cyan-100 text-cyan-700 py-1.5 rounded text-sm font-medium">Editar</button>
                    <button onClick={() => handleDelete(c.id, c.nombre)} className="flex-1 bg-red-100 text-red-700 py-1.5 rounded text-sm font-medium">Eliminar</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {total > 0 && (
            <PaginationControls
              currentPage={page}
              totalPages={totalPages}
              pageSize={limit}
              totalRecords={total}
              onPageChange={handlePageChange}
              onPageSizeChange={handleLimitChange}
              disabled={loading}
            />
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md sm:p-6" onClick={handleCloseModal}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative flex w-full max-w-6xl max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>

              {/* Header Moderno */}
              <div className="flex-shrink-0 bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5 text-white flex justify-between items-center shadow-md">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-white/10 p-2 border border-white/20">
                    <Building2 className="h-6 w-6 text-purple-300" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">{modalMode === 'create' ? 'Registrar Nuevo Cliente' : 'Actualizar Información del Cliente'}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Complete los detalles y especificaciones del producto</p>
                  </div>
                </div>
                <button onClick={handleCloseModal} className="rounded-full p-2 bg-white/5 hover:bg-white/20 transition-all shadow-sm border border-transparent hover:border-white/20"><X className="h-5 w-5 text-gray-300" /></button>
              </div>

              <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
                {/* Sidebar Menu / Tabs */}
                <div className="w-64 flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col hidden sm:flex">
                  <div className="p-4 space-y-2 flex-1">
                    <button type="button" onClick={() => setActiveTab('basicos')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'basicos' ? 'bg-purple-100 text-purple-700 shadow-sm border border-purple-200' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'}`}>
                      <Building2 className="h-4 w-4" /> Datos Generales
                    </button>
                    <button type="button" onClick={() => setActiveTab('especificaciones')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'especificaciones' ? 'bg-purple-100 text-purple-700 shadow-sm border border-purple-200' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'}`}>
                      <Settings2 className="h-4 w-4" /> Especificaciones
                    </button>
                    <button type="button" onClick={() => setActiveTab('maquinas')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'maquinas' ? 'bg-purple-100 text-purple-700 shadow-sm border border-purple-200' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'}`}>
                      <Settings className="h-4 w-4" /> Parámetros de Máquinas
                    </button>
                    <button type="button" onClick={() => setActiveTab('formulacion')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'formulacion' ? 'bg-purple-100 text-purple-700 shadow-sm border border-purple-200' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'}`}>
                      <Droplets className="h-4 w-4" /> Formulación M.P.
                    </button>
                    <button type="button" onClick={() => setActiveTab('serigrafia')} disabled={!formData.conImpresion} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${!formData.conImpresion ? 'opacity-40 cursor-not-allowed' : activeTab === 'serigrafia' ? 'bg-purple-100 text-purple-700 shadow-sm border border-purple-200' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'}`}>
                      <Palette className="h-4 w-4" /> Serigrafía
                    </button>
                  </div>
                </div>

                {/* Tabs Mobile */}
                <div className="sm:hidden flex overflow-x-auto border-b border-gray-200 bg-white p-3 gap-2 [&::-webkit-scrollbar]:hidden">
                  <button type="button" onClick={() => setActiveTab('basicos')} className={`flex items-center justify-center text-center flex-shrink-0 px-5 py-2.5 whitespace-nowrap text-sm font-semibold rounded-xl border transition-all ${activeTab === 'basicos' ? 'bg-purple-100 text-purple-700 border-purple-200 shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>Datos Generales</button>
                  <button type="button" onClick={() => setActiveTab('especificaciones')} className={`flex items-center justify-center text-center flex-shrink-0 px-5 py-2.5 whitespace-nowrap text-sm font-semibold rounded-xl border transition-all ${activeTab === 'especificaciones' ? 'bg-purple-100 text-purple-700 border-purple-200 shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>Especificaciones</button>
                  <button type="button" onClick={() => setActiveTab('maquinas')} className={`flex items-center justify-center text-center flex-shrink-0 px-5 py-2.5 whitespace-nowrap text-sm font-semibold rounded-xl border transition-all ${activeTab === 'maquinas' ? 'bg-purple-100 text-purple-700 border-purple-200 shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>Parámetros de Máquinas</button>
                  <button type="button" onClick={() => setActiveTab('formulacion')} className={`flex items-center justify-center text-center flex-shrink-0 px-5 py-2.5 whitespace-nowrap text-sm font-semibold rounded-xl border transition-all ${activeTab === 'formulacion' ? 'bg-purple-100 text-purple-700 border-purple-200 shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>Formulación M.P.</button>
                  <button type="button" onClick={() => setActiveTab('serigrafia')} disabled={!formData.conImpresion} className={`flex items-center justify-center text-center flex-shrink-0 px-5 py-2.5 whitespace-nowrap text-sm font-semibold rounded-xl border transition-all ${!formData.conImpresion ? 'opacity-40 bg-gray-50 border-gray-200 text-gray-400' : activeTab === 'serigrafia' ? 'bg-purple-100 text-purple-700 border-purple-200 shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>Serigrafía</button>
                </div>

                {/* Form Content Area */}
                <form id="clienteForm" onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden bg-white">
                  <div className="flex-1 overflow-y-auto p-5 sm:p-8">
                    {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm mb-6 flex items-center gap-2"><div className="w-1.5 h-full bg-red-500 rounded-l-full"></div>{error}</div>}

                    {/* Tab: Datos Básicos */}
                    {activeTab === 'basicos' && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">Información General</h3>
                          <p className="text-xs text-gray-500 mb-5">Ingrese los datos fiscales y de contacto del cliente</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div>
                            <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Razón Social <span className="text-red-500">*</span></label>
                            <input required type="text" placeholder="Ej: Inversiones XYZ" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                          </div>
                          <div>
                            <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">RIF / Documento <span className="text-red-500">*</span></label>
                            <input required type="text" placeholder="Ej: J-12345678-9" value={formData.rif} onChange={e => setFormData({ ...formData, rif: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                          </div>
                          <div>
                            <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Contacto Principal</label>
                            <input type="text" placeholder="Nombre de la persona" value={formData.contacto} onChange={e => setFormData({ ...formData, contacto: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                          </div>
                          <div>
                            <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Teléfono</label>
                            <input type="text" placeholder="Ej: 0414-1234567" value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                          </div>
                          <div>
                            <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Producto</label>
                            <input type="text" placeholder="Ej: Bolsa para café, Bobina industrial" value={formData.producto} onChange={e => setFormData({ ...formData, producto: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Dirección de facturación</label>
                            <input type="text" placeholder="Dirección completa" value={formData.direccion} onChange={e => setFormData({ ...formData, direccion: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Tab: Especificaciones */}
                    {activeTab === 'especificaciones' && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">Parámetros del Producto</h3>
                          <p className="text-xs text-gray-500 mb-5">Defina las medidas y características físicas del pedido</p>
                        </div>

                        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100/50 mb-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            <div>
                              <label className="text-xs font-bold tracking-wide text-indigo-800 uppercase mb-1.5 block">Tipo Categoria <span className="text-red-500">*</span></label>
                              <select required value={formData.tipoProducto} onChange={e => setFormData({ ...formData, tipoProducto: e.target.value })} className="w-full rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-900 shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none">
                                <option value="">Seleccione Categoría...</option>
                                <option value="Bolsa">Bolsa</option>
                                <option value="Bobina">Bobina</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-bold tracking-wide text-indigo-800 uppercase mb-1.5 block">Material</label>
                              <input type="text" placeholder="Ej: Alta, Baja, PEBD..." value={formData.material || ''} onChange={e => setFormData({ ...formData, material: e.target.value })} className="w-full rounded-xl bg-white border border-indigo-200 px-4 py-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none" />
                            </div>
                            <div className="flex items-center pt-6">
                              <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                  <input type="checkbox" checked={formData.conImpresion} onChange={e => setFormData({ ...formData, conImpresion: e.target.checked })} className="peer sr-only" />
                                  <div className="h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-indigo-600 transition-colors"></div>
                                  <div className="absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5 shadow-sm border border-gray-200"></div>
                                </div>
                                <span className="text-sm font-bold text-indigo-900 group-hover:text-indigo-700 transition-colors">¿Lleva Impresión?</span>
                              </label>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-indigo-200">
                            <div className="flex flex-wrap gap-6">
                              <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" checked={formData.esBolsaPego} onChange={e => {
                                  if (e.target.checked) {
                                    setFormData({ ...formData, esBolsaPego: true, esBolsaFuelle: false });
                                  } else {
                                    setFormData({ ...formData, esBolsaPego: false });
                                  }
                                }} className="rounded text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5 border-indigo-300" />
                                <span className="text-sm font-medium text-indigo-900 group-hover:text-indigo-700">Valvulada (Pego)</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" checked={formData.esBolsaFuelle} onChange={e => {
                                  if (e.target.checked) {
                                    setFormData({ ...formData, esBolsaFuelle: true, esBolsaPego: false });
                                  } else {
                                    setFormData({ ...formData, esBolsaFuelle: false });
                                  }
                                }} className="rounded text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5 border-indigo-300" />
                                <span className="text-sm font-medium text-indigo-900 group-hover:text-indigo-700">Con Fuelle</span>
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-5">
                          <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Dimensiones Principales</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                            {formData.tipoProducto === 'Bobina' ? (
                              <div>
                                <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Ancho de Bobina (cm) *</label>
                                <input type="number" step="0.01" value={formData.anchoBobina} onChange={e => setFormData({ ...formData, anchoBobina: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none" />
                              </div>
                            ) : (
                              <>
                                <div>
                                  <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Ancho (cm)</label>
                                  <input type="number" step="0.01" value={formData.ancho} onChange={e => setFormData({ ...formData, ancho: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none" />
                                </div>
                                <div>
                                  <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Largo (cm)</label>
                                  <input type="number" step="0.01" value={formData.largo} onChange={e => setFormData({ ...formData, largo: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none" />
                                </div>
                              </>
                            )}
                            <div>
                              <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Calibre (micras)</label>
                              <input type="number" step="0.01" value={formData.calibre} onChange={e => setFormData({ ...formData, calibre: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none" />
                            </div>
                            {formData.tipoProducto === 'Bobina' && formData.conImpresion && (
                              <div>
                                <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Diámetro de Ancho de Bolsa (cm)</label>
                                <input type="number" step="0.01" value={formData.diametroAnchoBolsa} onChange={e => setFormData({ ...formData, diametroAnchoBolsa: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none" placeholder="Diámetro" />
                              </div>
                            )}
                            {formData.esBolsaPego && (
                              <>
                                <div>
                                  <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Ancho Válvula (cm)</label>
                                  <input type="number" step="0.01" value={formData.anchoValvula} onChange={e => setFormData({ ...formData, anchoValvula: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none" />
                                </div>
                                <div>
                                  <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Solapa (cm)</label>
                                  <input type="number" step="0.01" value={formData.anchoSolapa} onChange={e => setFormData({ ...formData, anchoSolapa: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none" />
                                </div>
                              </>
                            )}
                            {(formData.esBolsaPego || formData.esBolsaFuelle) && (
                              <div>
                                <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Fuelle (cm)</label>
                                <input type="number" step="0.01" value={formData.anchoFuelle} onChange={e => setFormData({ ...formData, anchoFuelle: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Atributos del Sellado */}
                        {formData.tipoProducto === 'Bolsa' && (
                          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                            <h4 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">Atributos del Sellado</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                              <div><label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Tipo Sellado</label>
                                <select value={formData.tipoSellado} onChange={e => setFormData({ ...formData, tipoSellado: e.target.value })} className="w-full bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-purple-500"><option value="">Ninguno</option><option value="Inferior">Inferior</option><option value="Lateral">Lateral</option></select>
                              </div>
                              <div><label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Sellado Estructura</label>
                                <select value={formData.tipoSelladoEstructura} onChange={e => setFormData({ ...formData, tipoSelladoEstructura: e.target.value })} className="w-full bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-purple-500"><option value="">Seleccione...</option><option value="simple">Sellado Simple</option><option value="doble">Sellado Doble</option></select>
                              </div>
                              <div><label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Bolsas / Rollo</label><input type="number" value={formData.bolsasPorRollo} onChange={e => setFormData({ ...formData, bolsasPorRollo: e.target.value })} className="w-full bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-purple-500" /></div>
                              <div><label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Rollos / Bulto</label><input type="number" value={formData.rollosPorBulto} onChange={e => setFormData({ ...formData, rollosPorBulto: e.target.value })} className="w-full bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-purple-500" /></div>
                            </div>
                            <div className="mt-4 flex flex-wrap items-end gap-6">
                              <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" checked={formData.perforacion} onChange={e => setFormData({ ...formData, perforacion: e.target.checked })} className="rounded text-purple-600 focus:ring-purple-500 h-4.5 w-4.5 border-gray-300" />
                                <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">Lleva Perforación de Troquel</span>
                              </label>
                              {formData.conImpresion && (
                                <div className="flex-1 min-w-[200px] max-w-xs">
                                  <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Repeticiones de imagen en la bolsa</label>
                                  <input 
                                    type="number" 
                                    min="1"
                                    value={formData.repeticionesImagen} 
                                    onChange={e => setFormData({ ...formData, repeticionesImagen: e.target.value })} 
                                    className="w-full bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-purple-500" 
                                    placeholder="Número de repeticiones"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                          <h4 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">Atributos de Bobina</h4>
                          {formData.tipoProducto !== 'Bolsa' && (
                            <div className="mb-4">
                              <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" checked={formData.esTermoencogible} onChange={e => setFormData({ ...formData, esTermoencogible: e.target.checked })} className="rounded text-purple-600 focus:ring-purple-500 h-4.5 w-4.5 border-gray-300" />
                                <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">Es Termoencogible</span>
                              </label>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4 max-w-lg">
                            <div>
                              <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Tipo de Bobina</label>
                              <select value={formData.tipoBobinaCliente} onChange={e => setFormData({ ...formData, tipoBobinaCliente: e.target.value })} className="w-full bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-purple-500"><option value="">Seleccione...</option><option value="Lamina">Lámina</option><option value="Manga">Manga</option><option value="MangaConFuelle">Manga con Fuelle</option></select>
                            </div>
                            {formData.esTermoencogible && (
                              <div><label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Peso Max (kg)</label><input type="number" step="0.01" value={formData.pesoMaximoBobina} onChange={e => setFormData({ ...formData, pesoMaximoBobina: e.target.value })} className="w-full bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-purple-500" /></div>
                            )}
                            {formData.conImpresion && (
                              <div><label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Intensidad del Tratador</label><input type="number" step="0.01" value={formData.intensidadTratador} onChange={e => setFormData({ ...formData, intensidadTratador: e.target.value })} className="w-full bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-purple-500" /></div>
                            )}
                          </div>
                          
                          {/* Medidas de Lámina por Rebobinador - Solo para tipo Lamina */}
                          {formData.tipoBobinaCliente === 'Lamina' && (
                            <div className="mt-4">
                              <h5 className="text-xs font-bold text-gray-700 uppercase mb-2">Medidas de Lámina por cada Rebobinador</h5>
                              <div className="grid grid-cols-2 gap-4 max-w-lg">
                                <div>
                                  <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Ancho (cm)</label>
                                  <input 
                                    type="text" 
                                    readOnly 
                                    value={(() => {
                                      let calculatedValue = '';
                                      if (formData.tipoSellado === 'Inferior' && formData.esBolsaPego && formData.ancho && formData.anchoFuelle && formData.anchoSolapa) {
                                        calculatedValue = ((parseFloat(formData.ancho) * 2) + (parseFloat(formData.anchoFuelle) * 2) + parseFloat(formData.anchoSolapa)).toFixed(2);
                                      } else if (formData.tipoSellado === 'Lateral' && formData.largo) {
                                        calculatedValue = (parseFloat(formData.largo) * 2).toFixed(2);
                                      } else if (formData.tipoProducto === 'Bobina' && formData.anchoBobina) {
                                        calculatedValue = formData.anchoBobina;
                                      } else if (formData.ancho) {
                                        calculatedValue = formData.ancho;
                                      }
                                      
                                      // Actualizar el formData si el valor calculado es diferente
                                      if (calculatedValue !== formData.laminaRebobinadorAncho) {
                                        setTimeout(() => {
                                          setFormData(prev => ({ ...prev, laminaRebobinadorAncho: calculatedValue }));
                                        }, 0);
                                      }
                                      
                                      return calculatedValue;
                                    })()} 
                                    className="w-full bg-gray-100 border border-gray-200 px-3 py-2 rounded-lg text-sm text-gray-700 cursor-not-allowed" 
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Calibre (µ)</label>
                                  <input 
                                    type="text" 
                                    readOnly 
                                    value={(() => {
                                      let calculatedValue = '';
                                      if (formData.tipoSellado === 'Lateral' && formData.calibre) {
                                        calculatedValue = (parseFloat(formData.calibre) / 2).toFixed(2);
                                      } else if (formData.calibre) {
                                        calculatedValue = formData.calibre;
                                      }
                                      
                                      // Actualizar el formData si el valor calculado es diferente
                                      if (calculatedValue !== formData.laminaRebobinadorCalibre) {
                                        setTimeout(() => {
                                          setFormData(prev => ({ ...prev, laminaRebobinadorCalibre: calculatedValue }));
                                        }, 0);
                                      }
                                      
                                      return calculatedValue;
                                    })()} 
                                    className="w-full bg-gray-100 border border-gray-200 px-3 py-2 rounded-lg text-sm text-gray-700 cursor-not-allowed" 
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-4 flex flex-wrap items-center gap-6">
                            <div className="w-40">
                              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Refilado</label>
                              <select value={formData.tipoRefilado} onChange={e => setFormData({ ...formData, tipoRefilado: e.target.value })} className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-purple-500"><option value="">Ninguno</option><option value="Simple">Simple</option><option value="Doble">Doble</option></select>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer pt-4 group">
                              <input type="checkbox" checked={formData.muleteado} onChange={e => setFormData({ ...formData, muleteado: e.target.checked })} className="rounded text-purple-600 focus:ring-purple-500 h-4.5 w-4.5 border-gray-300" />
                              <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">Lleva Muleteado</span>
                            </label>
                          </div>
                        </div>

                      </motion.div>
                    )}

                    {/* Tab: Parámetros de Máquinas */}
                    {activeTab === 'maquinas' && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">Parámetros de Extrusión</h3>
                          <p className="text-xs text-gray-500 mb-5">Configure los parámetros de la máquina de extrusión</p>
                        </div>
                        
                        {/* Parámetros Generales */}
                        <div>
                          <h4 className="text-md font-semibold text-gray-700 mb-3">Parámetros Generales</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Temperatura Ambiente</label>
                              <input type="number" step="0.01" placeholder="°C" value={formData.extTemperaturaAmbiente} onChange={e => setFormData({ ...formData, extTemperaturaAmbiente: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                            </div>
                            <div>
                              <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Motor Principal</label>
                              <input type="number" step="0.01" value={formData.extMotorPrincipal} onChange={e => setFormData({ ...formData, extMotorPrincipal: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                            </div>
                            <div>
                              <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Tracción</label>
                              <input type="number" step="0.01" value={formData.extTraccion} onChange={e => setFormData({ ...formData, extTraccion: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                            </div>
                            <div>
                              <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Soplador Principal</label>
                              <input type="number" step="0.01" value={formData.extSopladorPrincipal} onChange={e => setFormData({ ...formData, extSopladorPrincipal: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                            </div>
                            <div>
                              <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Abertura del Blower</label>
                              <input type="number" step="0.01" value={formData.extAberturaBlower} onChange={e => setFormData({ ...formData, extAberturaBlower: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                            </div>
                            <div>
                              <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Orientación Flujo del Blower</label>
                              <input type="number" step="0.01" value={formData.extOrientacionFlujoBlower} onChange={e => setFormData({ ...formData, extOrientacionFlujoBlower: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                            </div>
                          </div>
                        </div>

                        {/* Parámetros del Globo */}
                        <div>
                          <h4 className="text-md font-semibold text-gray-700 mb-3">Parámetros del Globo</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Cuello del Globo</label>
                              <input type="number" step="0.01" value={formData.extCuelloGlobo} onChange={e => setFormData({ ...formData, extCuelloGlobo: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                            </div>
                            <div>
                              <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Temperatura Cuello del Globo</label>
                              <input type="number" step="0.01" placeholder="°C" value={formData.extTemperaturaCuelloGlobo} onChange={e => setFormData({ ...formData, extTemperaturaCuelloGlobo: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                            </div>
                            <div>
                              <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Intensidad del Tratador</label>
                              <input type="number" step="0.01" value={formData.extIntensidadTratador} onChange={e => setFormData({ ...formData, extIntensidadTratador: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                            </div>
                          </div>
                        </div>

                        {/* Parámetros del Rebobinador */}
                        <div>
                          <h4 className="text-md font-semibold text-gray-700 mb-3">Parámetros del Rebobinador</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Tracción del Rebobinador</label>
                              <input type="number" step="0.01" value={formData.extTraccionRebobinador} onChange={e => setFormData({ ...formData, extTraccionRebobinador: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                            </div>
                            <div>
                              <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Rebobinador Winding 1</label>
                              <input type="number" step="0.01" value={formData.extRebobinadorWinding1} onChange={e => setFormData({ ...formData, extRebobinadorWinding1: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                            </div>
                            <div>
                              <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Rebobinador Winding 2</label>
                              <input type="number" step="0.01" value={formData.extRebobinadorWinding2} onChange={e => setFormData({ ...formData, extRebobinadorWinding2: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                            </div>
                          </div>
                        </div>

                        {/* Temperaturas por Zonas */}
                        <div>
                          <h4 className="text-md font-semibold text-gray-700 mb-3">Temperaturas por Zonas (°C)</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                            {Array.from({ length: 20 }, (_, i) => i + 1).map((zone) => (
                              <div key={zone}>
                                <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Zona {zone}</label>
                                <input 
                                  type="number" 
                                  min="0" 
                                  max="500" 
                                  placeholder="°C"
                                  value={formData[`extTemperaturaZ${zone}` as keyof FormData]} 
                                  onChange={e => setFormData({ ...formData, [`extTemperaturaZ${zone}`]: e.target.value })} 
                                  className="w-full rounded-xl bg-gray-50 border border-gray-200 px-3 py-2 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" 
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Parámetros de Sellado */}
                        <div>
                          <h4 className="text-md font-semibold text-gray-700 mb-3">Parámetros de Sellado</h4>
                          
                          {/* Selector de Tipo de Selladora */}
                          <div className="mb-6">
                            <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Tipo de Selladora</label>
                            <select 
                              value={formData.sldTipoSelladora} 
                              onChange={e => setFormData({ ...formData, sldTipoSelladora: e.target.value })} 
                              className="w-full max-w-xs rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                            >
                              <option value="">Seleccione tipo...</option>
                              <option value="valvula">Selladora de Válvula</option>
                              <option value="bolsaASA">Selladora de Bolsa ASA</option>
                              <option value="bolsaPollo">Selladora de Bolsa de Pollo</option>
                            </select>
                          </div>

                          {formData.sldTipoSelladora && (
                            <>
                              {/* Parámetros Generales */}
                              <div className="mb-6">
                                <h5 className="text-sm font-semibold text-gray-700 mb-3">Parámetros Generales</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  {(formData.sldTipoSelladora === 'valvula' || formData.sldTipoSelladora === 'bolsaASA') && (
                                    <div>
                                      <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Capacidad de Bolsa</label>
                                      <input type="number" value={formData.sldCapacidadBolsa} onChange={e => setFormData({ ...formData, sldCapacidadBolsa: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                    </div>
                                  )}
                                  <div>
                                    <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Temperatura Ambiente</label>
                                    <input type="number" step="0.01" placeholder="°C" value={formData.sldTemperaturaAmbiente} onChange={e => setFormData({ ...formData, sldTemperaturaAmbiente: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                  </div>
                                  <div>
                                    <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Tornillo de Esparrago</label>
                                    <input type="number" step="0.01" value={formData.sldTornilloEsparrago} onChange={e => setFormData({ ...formData, sldTornilloEsparrago: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                  </div>
                                </div>
                              </div>

                              {/* Temperaturas */}
                              <div className="mb-6">
                                <h5 className="text-sm font-semibold text-gray-700 mb-3">Temperaturas</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  {formData.sldTipoSelladora === 'valvula' && (
                                    <>
                                      <div>
                                        <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Temperatura Superior</label>
                                        <input type="number" placeholder="°C" value={formData.sldTemperaturaSuperior} onChange={e => setFormData({ ...formData, sldTemperaturaSuperior: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                      </div>
                                      <div>
                                        <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Temperatura Inferior</label>
                                        <input type="number" placeholder="°C" value={formData.sldTemperaturaInferior} onChange={e => setFormData({ ...formData, sldTemperaturaInferior: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                      </div>
                                      <div>
                                        <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Temperatura Válvula</label>
                                        <input type="number" placeholder="°C" value={formData.sldTemperaturaValvula} onChange={e => setFormData({ ...formData, sldTemperaturaValvula: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                      </div>
                                    </>
                                  )}
                                  
                                  {formData.sldTipoSelladora === 'bolsaASA' && (
                                    <>
                                      <div>
                                        <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Temp. Superior Línea A</label>
                                        <input type="number" placeholder="°C" value={formData.sldTemperaturaSuperiorLineaA} onChange={e => setFormData({ ...formData, sldTemperaturaSuperiorLineaA: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                      </div>
                                      <div>
                                        <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Temp. Inferior Línea A</label>
                                        <input type="number" placeholder="°C" value={formData.sldTemperaturaInferiorLineaA} onChange={e => setFormData({ ...formData, sldTemperaturaInferiorLineaA: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                      </div>
                                      <div>
                                        <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Temp. Superior Línea B</label>
                                        <input type="number" placeholder="°C" value={formData.sldTemperaturaSuperiorLineaB} onChange={e => setFormData({ ...formData, sldTemperaturaSuperiorLineaB: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                      </div>
                                      <div>
                                        <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Temp. Inferior Línea B</label>
                                        <input type="number" placeholder="°C" value={formData.sldTemperaturaInferiorLineaB} onChange={e => setFormData({ ...formData, sldTemperaturaInferiorLineaB: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                      </div>
                                    </>
                                  )}

                                  {formData.sldTipoSelladora === 'bolsaPollo' && (
                                    <>
                                      <div>
                                        <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Temperatura de Troquel</label>
                                        <input type="number" placeholder="°C" value={formData.sldTemperaturaTroquel} onChange={e => setFormData({ ...formData, sldTemperaturaTroquel: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                      </div>
                                      <div>
                                        <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Temp. Superior Recta</label>
                                        <input type="number" placeholder="°C" value={formData.sldTemperaturaSuperiorRecta} onChange={e => setFormData({ ...formData, sldTemperaturaSuperiorRecta: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                      </div>
                                      <div>
                                        <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Temp. Superior Curva</label>
                                        <input type="number" placeholder="°C" value={formData.sldTemperaturaSuperiorCurva} onChange={e => setFormData({ ...formData, sldTemperaturaSuperiorCurva: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                      </div>
                                    </>
                                  )}

                                  {(formData.sldTipoSelladora === 'valvula' || formData.sldTipoSelladora === 'bolsaASA') && (
                                    <div>
                                      <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Temperatura de Cuchilla</label>
                                      <input type="number" step="0.01" placeholder="°C" value={formData.sldTemperaturaCuchilla} onChange={e => setFormData({ ...formData, sldTemperaturaCuchilla: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Parámetros de Presellado y Tiempo (Solo Válvula) */}
                              {formData.sldTipoSelladora === 'valvula' && (
                                <div className="mb-6">
                                  <h5 className="text-sm font-semibold text-gray-700 mb-3">Presellado y Tiempo</h5>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                      <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Presellado A</label>
                                      <input type="number" value={formData.sldPreselladoA} onChange={e => setFormData({ ...formData, sldPreselladoA: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                    </div>
                                    <div>
                                      <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Presellado B</label>
                                      <input type="number" value={formData.sldPreselladoB} onChange={e => setFormData({ ...formData, sldPreselladoB: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                    </div>
                                    <div>
                                      <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Tiempo Límite</label>
                                      <input type="number" value={formData.sldTiempoLimite} onChange={e => setFormData({ ...formData, sldTiempoLimite: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                    </div>
                                    <div>
                                      <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Microperforaciones</label>
                                      <input type="text" value={formData.sldMicroperforaciones} onChange={e => setFormData({ ...formData, sldMicroperforaciones: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                    </div>
                                    <div>
                                      <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Muleteado</label>
                                      <input type="text" value={formData.sldMuleteado} onChange={e => setFormData({ ...formData, sldMuleteado: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Parámetros Generales de Máquina */}
                              <div className="mb-6">
                                <h5 className="text-sm font-semibold text-gray-700 mb-3">Parámetros de Máquina</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  <div>
                                    <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Rodillo Ancho Válvula</label>
                                    <input type="number" value={formData.sldRodilloAnchoValvula} onChange={e => setFormData({ ...formData, sldRodilloAnchoValvula: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                  </div>
                                  <div>
                                    <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">GPM</label>
                                    <input type="number" value={formData.sldGPM} onChange={e => setFormData({ ...formData, sldGPM: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                  </div>
                                  {(formData.sldTipoSelladora === 'valvula' || formData.sldTipoSelladora === 'bolsaPollo') && (
                                    <div>
                                      <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Velocidad Transportador</label>
                                      <input type="number" step="0.01" value={formData.sldVelocidadTransportador} onChange={e => setFormData({ ...formData, sldVelocidadTransportador: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                    </div>
                                  )}
                                  <div>
                                    <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Ciclo de Trabajo</label>
                                    <input type="text" value={formData.sldCicloTrabajo} onChange={e => setFormData({ ...formData, sldCicloTrabajo: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                  </div>
                                  {formData.sldTipoSelladora === 'bolsaPollo' && (
                                    <>
                                      <div>
                                        <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Presión Ventosa</label>
                                        <input type="number" step="0.01" value={formData.sldPresionVentosa} onChange={e => setFormData({ ...formData, sldPresionVentosa: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                      </div>
                                      <div>
                                        <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Tensión Principal</label>
                                        <input type="number" step="0.01" value={formData.sldTensionPrincipal} onChange={e => setFormData({ ...formData, sldTensionPrincipal: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Presiones de Balancines */}
                              <div className="mb-6">
                                <h5 className="text-sm font-semibold text-gray-700 mb-3">Presiones de Balancines</h5>
                                {formData.sldTipoSelladora !== 'bolsaASA' ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                      <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Presión Balancín 1</label>
                                      <input type="number" step="0.01" value={formData.sldPresionBalancin1} onChange={e => setFormData({ ...formData, sldPresionBalancin1: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                    </div>
                                    <div>
                                      <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Presión Balancín 2</label>
                                      <input type="number" step="0.01" value={formData.sldPresionBalancin2} onChange={e => setFormData({ ...formData, sldPresionBalancin2: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                    </div>
                                    <div>
                                      <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Presión Balancín 3</label>
                                      <input type="number" step="0.01" value={formData.sldPresionBalancin3} onChange={e => setFormData({ ...formData, sldPresionBalancin3: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="mb-4">
                                      <h6 className="text-xs font-semibold text-gray-600 mb-2">Línea A</h6>
                                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                        <div>
                                          <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Balancín A1</label>
                                          <input type="number" step="0.01" value={formData.sldPresionBalancinA1} onChange={e => setFormData({ ...formData, sldPresionBalancinA1: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                        </div>
                                        <div>
                                          <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Balancín A2</label>
                                          <input type="number" step="0.01" value={formData.sldPresionBalancinA2} onChange={e => setFormData({ ...formData, sldPresionBalancinA2: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                        </div>
                                        <div>
                                          <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Balancín A3</label>
                                          <input type="number" step="0.01" value={formData.sldPresionBalancinA3} onChange={e => setFormData({ ...formData, sldPresionBalancinA3: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                        </div>
                                        <div>
                                          <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Balancín A4</label>
                                          <input type="number" step="0.01" value={formData.sldPresionBalancinA4} onChange={e => setFormData({ ...formData, sldPresionBalancinA4: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <h6 className="text-xs font-semibold text-gray-600 mb-2">Línea B</h6>
                                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                        <div>
                                          <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Balancín B1</label>
                                          <input type="number" step="0.01" value={formData.sldPresionBalancinB1} onChange={e => setFormData({ ...formData, sldPresionBalancinB1: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                        </div>
                                        <div>
                                          <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Balancín B2</label>
                                          <input type="number" step="0.01" value={formData.sldPresionBalancinB2} onChange={e => setFormData({ ...formData, sldPresionBalancinB2: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                        </div>
                                        <div>
                                          <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Balancín B3</label>
                                          <input type="number" step="0.01" value={formData.sldPresionBalancinB3} onChange={e => setFormData({ ...formData, sldPresionBalancinB3: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                        </div>
                                        <div>
                                          <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Balancín B4</label>
                                          <input type="number" step="0.01" value={formData.sldPresionBalancinB4} onChange={e => setFormData({ ...formData, sldPresionBalancinB4: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* Parámetros de Altura y Medidas */}
                              <div className="mb-6">
                                <h5 className="text-sm font-semibold text-gray-700 mb-3">Alturas y Medidas</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  <div>
                                    <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Altura Cabezal Ext. Derecho</label>
                                    <input type="number" step="0.01" value={formData.sldAlturaCabezalExtDerecho} onChange={e => setFormData({ ...formData, sldAlturaCabezalExtDerecho: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                  </div>
                                  <div>
                                    <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Altura Cabezal Ext. Izquierdo</label>
                                    <input type="number" step="0.01" value={formData.sldAlturaCabezalExtIzquierdo} onChange={e => setFormData({ ...formData, sldAlturaCabezalExtIzquierdo: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                  </div>
                                  <div>
                                    <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Banda Transportadora</label>
                                    <input type="number" step="0.01" value={formData.sldBandaTransportadora} onChange={e => setFormData({ ...formData, sldBandaTransportadora: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                  </div>
                                  <div>
                                    <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Medida Portabobina</label>
                                    <input type="number" value={formData.sldMedidaPortabobina} onChange={e => setFormData({ ...formData, sldMedidaPortabobina: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                  </div>
                                  <div>
                                    <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Ajuste Sensor Fail</label>
                                    <input type="number" value={formData.sldAjusteSensorFail} onChange={e => setFormData({ ...formData, sldAjusteSensorFail: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                  </div>
                                </div>
                              </div>

                              {/* Parámetros de Presión y Soplado */}
                              <div className="mb-6">
                                <h5 className="text-sm font-semibold text-gray-700 mb-3">Presiones y Soplado</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  <div>
                                    <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Presión Soplado Bolsa Arriba</label>
                                    <input type="number" step="0.01" value={formData.sldPresionSopladoBolsaArriba} onChange={e => setFormData({ ...formData, sldPresionSopladoBolsaArriba: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                  </div>
                                  <div>
                                    <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Presión Soplado Bolsa Abajo</label>
                                    <input type="number" step="0.01" value={formData.sldPresionSopladoBolsaAbajo} onChange={e => setFormData({ ...formData, sldPresionSopladoBolsaAbajo: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                  </div>
                                  <div>
                                    <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Presión Rodillo Servo L</label>
                                    <input type="number" step="0.01" value={formData.sldPresionRodilloServoL} onChange={e => setFormData({ ...formData, sldPresionRodilloServoL: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                  </div>
                                  <div>
                                    <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Presión Rodillo Servo R</label>
                                    <input type="number" step="0.01" value={formData.sldPresionRodilloServoR} onChange={e => setFormData({ ...formData, sldPresionRodilloServoR: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                  </div>
                                  <div>
                                    <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Soplar Inicio</label>
                                    <input type="number" value={formData.sldSoplarInicio} onChange={e => setFormData({ ...formData, sldSoplarInicio: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                  </div>
                                  <div>
                                    <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Soplar Terminar</label>
                                    <input type="number" value={formData.sldSoplarTerminar} onChange={e => setFormData({ ...formData, sldSoplarTerminar: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                  </div>
                                  {formData.sldTipoSelladora === 'bolsaPollo' && (
                                    <>
                                      <div>
                                        <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Silicona Inicio Ventosa</label>
                                        <input type="number" value={formData.sldSiliconaInicioVentosa} onChange={e => setFormData({ ...formData, sldSiliconaInicioVentosa: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                      </div>
                                      <div>
                                        <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Silicona Terminar Ventosa</label>
                                        <input type="number" value={formData.sldSiliconaTerminarVentosa} onChange={e => setFormData({ ...formData, sldSiliconaTerminarVentosa: e.target.value })} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" />
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Tab: Formulación */}
                    {activeTab === 'formulacion' && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">Mezcla y Formulación</h3>
                          <p className="text-xs text-gray-500 mb-5">Ingrese los porcentajes de materia prima para la extrusora</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                          {[{ key: 'formFB7000', label: 'FB7000', col: "from-blue-50 to-blue-100/50" }, { key: 'form3003', label: '3003', col: "from-cyan-50 to-cyan-100/50" }, { key: 'formLineal', label: 'Lineal', col: "from-sky-50 to-sky-100/50" }, { key: 'form0240', label: '0240', col: "from-indigo-50 to-indigo-100/50" }, { key: 'form0348', label: '0348', col: "from-violet-50 to-violet-100/50" }, { key: 'form7000F', label: '7000F', col: "from-purple-50 to-purple-100/50" }, { key: 'formDeslizante', label: 'Aditivo Deslizante', col: "from-fuchsia-50 to-fuchsia-100/50" }, { key: 'formMasterbachBlanco', label: 'MB Blanco', col: "from-gray-50 to-gray-200/50" }, { key: 'formMasterbachNegro', label: 'MB Negro', col: "from-slate-100 to-slate-200/50" }, { key: 'formMasterbachAzul', label: 'MB Azul', col: "from-blue-100 to-blue-200/50" }, { key: 'formMasterbachAmarillo', label: 'MB Amarillo', col: "from-yellow-50 to-yellow-100/50" }].map((item) => (
                            <div key={item.key} className={`p-4 rounded-xl border border-gray-100 bg-gradient-to-br ${item.col} shadow-sm`}>
                              <label className="text-xs font-bold text-gray-700 mb-2 block truncate">{item.label} (%)</label>
                              <div className="relative">
                                <input type="number" step="0.01" value={(formData as any)[item.key]} onChange={e => setFormData({ ...formData, [item.key]: e.target.value })} className="w-full pr-8 pl-3 py-2 text-sm border-0 rounded-lg bg-white/80 shadow-inner focus:ring-2 focus:ring-purple-500 outline-none" placeholder="0" />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Tab: Serigrafía */}
                    {activeTab === 'serigrafia' && formData.conImpresion && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">Paleta y Serigrafía</h3>
                          <p className="text-xs text-gray-500 mb-5">Detalles de la impresión y colores a estampar</p>
                        </div>
                        <div className="p-6 bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl border border-pink-100 mb-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div><label className="text-xs font-bold tracking-wide text-pink-800 uppercase mb-2 block">Cilindro Base</label>
                              <input 
                                type="text" 
                                readOnly 
                                placeholder="Calculado automáticamente" 
                                value={formData.cilindro} 
                                className="w-full bg-gray-100 border border-pink-200 px-4 py-2.5 rounded-xl text-sm font-medium outline-none cursor-not-allowed" 
                              />
                            </div>
                            <div><label className="text-xs font-bold tracking-wide text-pink-800 uppercase mb-2 block">Tratador (Intensidad)</label>
                              <input type="number" step="0.01" placeholder="Nivel" value={formData.serigrafiaTratadorIntensidad} onChange={e => setFormData({ ...formData, serigrafiaTratadorIntensidad: e.target.value })} className="w-full bg-white border border-pink-200 px-4 py-2.5 rounded-xl text-sm font-medium outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10" /></div>
                            <div><label className="text-xs font-bold tracking-wide text-pink-800 uppercase mb-2 block">Tipo de Impresión</label>
                              <select value={formData.tipoImpresion} onChange={e => setFormData({ ...formData, tipoImpresion: e.target.value })} className="w-full bg-white border border-pink-200 px-4 py-2.5 rounded-xl text-sm font-medium outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10">
                                <option value="">Seleccione...</option>
                                <option value="Lateral">Lateral</option>
                                <option value="Inferior">Inferior</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">Pantones / Colores</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map((num) => (
                              <div key={`color${num}`} className="relative group">
                                <label className="text-xs font-bold text-gray-400 absolute -top-2 left-3 bg-white px-1 z-10">Tinta {num}</label>
                                <input type="text" value={(formData as any)[`color${num}`]} onChange={e => setFormData({ ...formData, [`color${num}`]: e.target.value })} className="w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition-all font-medium text-gray-800" placeholder={`Nombre o Hex`} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div className="h-10"></div>
                  </div>

                  {/* Submit Footer Panel */}
                  <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-between items-center sm:flex-row flex-col gap-3">
                    <p className="text-xs text-gray-500 hidden sm:block">Asegúrese de guardar antes de cerrar para no perder los parámetros.</p>
                    <div className="flex gap-3 w-full sm:w-auto">
                      <button type="button" onClick={handleCloseModal} className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-all shadow-sm">Cancelar</button>
                      <button type="submit" disabled={submitting} className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-2.5 text-sm font-bold tracking-wide text-white rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 disabled:opacity-60 transition-all">
                        {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : null}
                        {modalMode === 'create' ? 'Confirmar y Guardar' : 'Actualizar Cliente'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence >
    </>
  );
}
