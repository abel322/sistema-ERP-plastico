'use client';

import { useEffect, useState } from 'react';
import { StatsCard } from '@/components/dashboard/stats-card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { BadgeEstado } from '@/components/ui/badge-estado';
import { BadgePrioridad } from '@/components/ui/badge-prioridad';
import { Users, FileText, CheckCircle, AlertTriangle, Factory, TrendingDown, DollarSign, Package, Wrench, Lightbulb, Truck } from 'lucide-react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardData {
  stats: {
    totalClientes: number;
    pedidosActivos: number;
    pedidosCompletadosMes: number;
    pedidosUrgentes: number;
    produccionHoy: number;
    mermaHoy: number;
    registrosProduccionHoy: number;
    despachosHoy: number;
    despachosPendientes: number;
    muestrasPendientes: number;
    facturasPendientes: number;
    mantenimientosProgramados: number;
    stockBajoCount: number;
    ventasMes: number;
    mejorasPendientes: number;
  };
  statsFacturacion?: {
    mes: number;
    anio: number;
    totalFacturado: number;
    facturasEmitidas: number;
    facturasPagadas: number;
    despachosPendientes: number;
  };
  pedidosRecientes: any[];
  pedidosUrgentesDetalle: any[];
  pedidosPorEstado: { estado: string; count: number }[];
  pedidosPorMes: { mes: string; count: number }[];
  produccionPorArea: { area: string; cantidadProducida: number; merma: number; registros: number }[];
  produccionesRecientes: any[];
  despachosRecientes: any[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, statsFacturacionRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/facturas/stats-mes')
      ]);
      
      const result = await dashboardRes.json();
      const statsFacturacion = await statsFacturacionRes.json();
      
      setData({ ...result, statsFacturacion });
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center"><LoadingSpinner /></div>
    );
  }

  if (!data) {
    return (
      <>
        <div className="text-center text-gray-600">Error al cargar datos</div>
      </>
    );
  }

  const estadoLabels: Record<string, string> = {
    Pendiente: 'Pendiente',
    EnProceso: 'En Proceso',
    Completado: 'Completado',
  };

  const chartDataEstados = {
    labels: (data?.pedidosPorEstado ?? []).map((item) => estadoLabels[item?.estado] || item?.estado || 'N/A'),
    datasets: [
      {
        label: 'Pedidos',
        data: (data?.pedidosPorEstado ?? []).map((item) => item?.count || 0),
        backgroundColor: ['#FCD34D', '#60A5FA', '#34D399'],
        borderColor: ['#F59E0B', '#3B82F6', '#10B981'],
        borderWidth: 2,
      },
    ],
  };

  const chartDataMeses = {
    labels: (data?.pedidosPorMes ?? []).map((item) => {
      const [year, month] = (item?.mes ?? '').split('-');
      return format(new Date(parseInt(year || '2024'), parseInt(month || '1') - 1), 'MMM yyyy', {
        locale: es,
      });
    }),
    datasets: [
      {
        label: 'Pedidos',
        data: (data?.pedidosPorMes ?? []).map((item) => item?.count || 0),
        borderColor: '#3B82F6',
        backgroundColor: '#93C5FD',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const mesesNombres = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const mesActual = data?.statsFacturacion?.mes ? mesesNombres[data.statsFacturacion.mes - 1] : '';
  const anioActual = data?.statsFacturacion?.anio || new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 lg:p-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-8 bg-blue-600 rounded-full" />
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Panel de Control</h1>
          </div>
          <p className="text-slate-500 text-sm font-medium ml-5">
            Bienvenido, Abel. Aquí tienes el resumen operativo de hoy.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Sistema Activo</span>
        </div>
      </div>

      {/* KPI Principal - Facturación con Glassmorphism */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 text-white shadow-2xl shadow-blue-900/20"
      >
        {/* Animated Background Ornaments */}
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-blue-600/20 blur-[100px]" />
        <div className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-indigo-600/10 blur-[100px]" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-10">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
              <DollarSign className="w-3 h-3 text-blue-300" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">Rendimiento Mensual</span>
            </div>
            <div>
              <p className="text-blue-200/70 text-sm font-bold uppercase tracking-widest mb-1">Total Facturado • {mesActual} {anioActual}</p>
              <h2 className="text-5xl sm:text-6xl font-black tracking-tighter">
                ${(data?.statsFacturacion?.totalFacturado ?? 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 p-6 bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-inner">
            <QuickStat label="Emitidas" value={data?.statsFacturacion?.facturasEmitidas ?? 0} icon={<FileText className="w-4 h-4" />} />
            <QuickStat label="Pagadas" value={data?.statsFacturacion?.facturasPagadas ?? 0} icon={<CheckCircle className="w-4 h-4" />} />
            <QuickStat label="Por Facturar" value={data?.statsFacturacion?.despachosPendientes ?? 0} icon={<TrendingDown className="w-4 h-4" />} />
            <QuickStat label="Mantenimiento" value={data?.stats?.mantenimientosProgramados ?? 0} icon={<Wrench className="w-4 h-4" />} />
          </div>
        </div>
      </motion.div>

      {/* Grid de Tarjetas de Estadísticas Principales */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 lg:gap-6">
        <StatsCard title="Clientes" value={data?.stats?.totalClientes ?? 0} icon={Users} color="bg-blue-600" index={0} />
        <StatsCard title="Pedidos Activos" value={data?.stats?.pedidosActivos ?? 0} icon={FileText} color="bg-purple-600" index={1} />
        <StatsCard title="Completados" value={data?.stats?.pedidosCompletadosMes ?? 0} icon={CheckCircle} color="bg-emerald-600" index={2} />
        <StatsCard title="Urgentes" value={data?.stats?.pedidosUrgentes ?? 0} icon={AlertTriangle} color="bg-rose-600" index={3} />
        <StatsCard title="Producción" value={data?.stats?.produccionHoy ?? 0} icon={Factory} color="bg-indigo-600" index={4} />
        <StatsCard title="Despachos" value={data?.stats?.despachosHoy ?? 0} icon={Truck} color="bg-cyan-600" index={5} />
      </div>

      {/* Indicadores Secundarios Compactos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniKPI icon={<TrendingDown />} label="Merma Hoy" value={`${data?.stats?.mermaHoy ?? 0} kg`} color="orange" />
        <MiniKPI icon={<Lightbulb />} label="Mejoras" value={data?.stats?.mejorasPendientes ?? 0} color="yellow" />
        <MiniKPI icon={<Package />} label="Muestras" value={data?.stats?.muestrasPendientes ?? 0} color="pink" />
        <MiniKPI icon={<Wrench />} label="Producción" value={data?.stats?.registrosProduccionHoy ?? 0} color="slate" />
      </div>

      {/* Charts & Tables Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Gráficos */}
        <div className="space-y-8">
          <ChartContainer title="Pedidos por Estado" icon={<BadgeEstado estado="EnProceso" />}>
            <div className="h-72">
              <Bar 
                data={chartDataEstados} 
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    tooltip: {
                      backgroundColor: '#1e293b',
                      padding: 12,
                      titleFont: { size: 14, weight: 'bold' },
                      bodyFont: { size: 13 },
                      cornerRadius: 12,
                      displayColors: false
                    }
                  }
                }} 
              />
            </div>
          </ChartContainer>

          <ChartContainer title="Evolución Mensual" icon={<TrendingDown className="w-5 h-5 text-blue-500" />}>
            <div className="h-72">
              <Line 
                data={chartDataMeses} 
                options={{
                  ...chartOptions,
                  scales: {
                    ...chartOptions.scales,
                    x: { grid: { display: false } },
                    y: { ...chartOptions.scales.y, grid: { borderDash: [5, 5] } }
                  }
                }} 
              />
            </div>
          </ChartContainer>
        </div>

        {/* Tablas */}
        <div className="space-y-8">
          <TableContainer title="Pedidos Recientes" icon={<FileText className="w-5 h-5 text-purple-500" />}>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Cliente</th>
                  <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Cantidad</th>
                  <th className="px-4 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data?.pedidosRecientes?.slice(0, 5).map((pedido) => (
                  <tr key={pedido?.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-slate-800">{pedido?.cliente?.nombre || 'N/A'}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-slate-500">{pedido?.cantidadSolicitada || 0} {pedido?.unidad || ''}</p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <BadgeEstado estado={pedido?.estado || 'Pendiente'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableContainer>

          <TableContainer title="Pedidos Urgentes" icon={<AlertTriangle className="w-5 h-5 text-rose-500" />}>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Cliente</th>
                  <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Entrega</th>
                  <th className="px-4 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Prioridad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data?.pedidosUrgentesDetalle?.slice(0, 5).map((pedido) => (
                  <tr key={pedido?.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-slate-800">{pedido?.cliente?.nombre || 'N/A'}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-slate-500">
                        {pedido?.fechaEntrega ? format(new Date(pedido.fechaEntrega), 'dd MMM yyyy', { locale: es }) : 'N/A'}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <BadgePrioridad prioridad={pedido?.prioridad || 'Media'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableContainer>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function QuickStat({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="p-2 bg-white/10 rounded-xl mb-2 text-blue-300">
        {icon}
      </div>
      <p className="text-xl font-black leading-none mb-1">{value}</p>
      <p className="text-[10px] font-bold text-blue-200/60 uppercase tracking-widest">{label}</p>
    </div>
  );
}

function MiniKPI({ icon, label, value, color }: any) {
  const colorMap: any = {
    orange: 'bg-orange-50 text-orange-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    pink: 'bg-pink-50 text-pink-600',
    slate: 'bg-slate-100 text-slate-600'
  };
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:shadow-md"
    >
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
        {React.cloneElement(icon, { className: 'w-5 h-5' })}
      </div>
      <div>
        <p className="text-lg font-black text-slate-900 leading-none mb-0.5">{value}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      </div>
    </motion.div>
  );
}

function ChartContainer({ title, icon, children }: any) {
  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-slate-50 rounded-xl">
          {icon}
        </div>
        <h3 className="text-lg font-black text-slate-900 tracking-tight">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function TableContainer({ title, icon, children }: any) {
  return (
    <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 flex flex-col">
      <div className="p-8 border-b border-slate-50 flex items-center gap-3">
        <div className="p-2 bg-slate-50 rounded-xl">
          {icon}
        </div>
        <h3 className="text-lg font-black text-slate-900 tracking-tight">{title}</h3>
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
import React from 'react';
