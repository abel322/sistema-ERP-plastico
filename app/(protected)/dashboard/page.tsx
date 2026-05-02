'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatsCard } from '@/components/dashboard/stats-card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { BadgeEstado } from '@/components/ui/badge-estado';
import { 
  Users, 
  ShoppingCart, 
  CheckCircle, 
  Package, 
  TrendingDown, 
  Truck, 
  TrendingUp,
  AlertTriangle,
  Factory,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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
    totalMateriaPrima: number;
    produccionHoy: number;
    mermaHoy: number;
    despachosHoy: number;
    pedidosPendientes: number;
    stockBajoCount: number;
    eficienciaHoy: number;
  };
  pedidosRecientes: any[];
  pedidosPorEstado: { estado: string; count: number }[];
  pedidosPorMes: { mes: string; count: number }[];
  materiaPrimaDetalle: any[];
  pedidosPendientesDetalle: any[];
  productoTerminadoDetalle: any[];
  produccionEnProcesoDetalle: any[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const chartDataEstados = {
    labels: (data?.pedidosPorEstado ?? []).map((item) => item?.estado || 'Desconocido'),
    datasets: [
      {
        label: 'Pedidos',
        data: (data?.pedidosPorEstado ?? []).map((item) => item?.count || 0),
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
        borderRadius: 8,
      },
    ],
  };

  const chartDataMeses = {
    labels: (data?.pedidosPorMes ?? []).map((item) => {
      if (!item?.mes) return 'N/A';
      try {
        const parts = item.mes.split('-');
        if (parts.length === 2) {
          const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1);
          return isValid(date) ? format(date, 'MMM', { locale: es }) : item.mes;
        }
        return item.mes;
      } catch {
        return item.mes;
      }
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
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1, color: '#94a3b8' }, grid: { color: '#e2e8f010' } },
      x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
    },
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-4 lg:p-8 space-y-8 transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="w-2 h-8 bg-blue-600 rounded-full" />
            Panel de Control
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium ml-5">Resumen operativo y métricas en tiempo real.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Sistema Activo</span>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard index={0} title="CLIENTES" value={data?.stats?.totalClientes ?? 0} icon={Users} color="blue" onClick={() => router.push('/clientes')} />
        <StatsCard index={1} title="PEDIDOS" value={data?.stats?.pedidosActivos ?? 0} icon={ShoppingCart} color="purple" onClick={() => router.push('/pedidos')} />
        <StatsCard index={2} title="COMPLETADOS" value={data?.stats?.pedidosCompletadosMes ?? 0} icon={CheckCircle} color="emerald" onClick={() => router.push('/pedidos')} />
        <StatsCard index={3} title="MATERIA PRIMA" value={<span className="flex items-baseline gap-1">{(data?.stats?.totalMateriaPrima ?? 0).toLocaleString()}<small className="text-[10px] opacity-50">KG</small></span>} icon={Package} color="amber" onClick={() => router.push('/inventario')} />
        <StatsCard index={4} title="PRODUCCIÓN" value={data?.stats?.produccionHoy ?? 0} icon={TrendingUp} color="indigo" onClick={() => router.push('/produccion')} />
        <StatsCard index={5} title="DESPACHOS" value={data?.stats?.despachosHoy ?? 0} icon={Truck} color="cyan" onClick={() => router.push('/despachos')} />
      </div>

      {/* Mini KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniKPI icon={<TrendingDown />} label="Merma Hoy" value={`${data?.stats?.mermaHoy ?? 0} kg`} color="orange" onClick={() => router.push('/produccion')} />
        <MiniKPI icon={<FileText />} label="Pendientes" value={data?.stats?.pedidosPendientes ?? 0} color="blue" onClick={() => router.push('/pedidos')} />
        <MiniKPI icon={<AlertTriangle />} label="Stock Bajo" value={data?.stats?.stockBajoCount ?? 0} color="yellow" onClick={() => router.push('/inventario')} />
        <MiniKPI icon={<TrendingUp />} label="Eficiencia" value={`${(data?.stats?.eficienciaHoy ?? 0).toFixed(1)}%`} color="emerald" onClick={() => router.push('/produccion')} />
      </div>

      {/* Summary Tables Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TableContainer title="Materia Prima (Resumen Stock)" icon={<Package className="text-amber-500" />}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Material</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {data?.materiaPrimaDetalle?.length ? data.materiaPrimaDetalle.map((item, i) => (
                <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{item?.nombre || 'N/A'}</p>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mt-0.5">{item?.codigo || 'S/C'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-black text-blue-600 dark:text-blue-400">{(item?.cantidad || 0).toLocaleString()} {item?.unidad || 'kg'}</span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={2} className="px-6 py-8 text-center text-slate-400 text-xs italic">No hay registros disponibles</td></tr>
              )}
            </tbody>
          </table>
        </TableContainer>

        <TableContainer title="Pedidos Pendientes" icon={<FileText className="text-blue-500" />}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Cliente</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {data?.pedidosPendientesDetalle?.length ? data.pedidosPendientesDetalle.map((pedido, i) => (
                <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{pedido?.cliente?.nombre || 'Desconocido'}</p>
                  </td>
                  <td className="px-6 py-4 text-right text-xs font-bold text-slate-500">
                    {pedido?.fechaPedido ? format(new Date(pedido.fechaPedido), 'dd/MM/yy', { locale: es }) : 'N/A'}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={2} className="px-6 py-8 text-center text-slate-400 text-xs italic">No hay pedidos en espera</td></tr>
              )}
            </tbody>
          </table>
        </TableContainer>
      </div>

      {/* Summary Tables Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TableContainer title="Stock Producto Terminado" icon={<CheckCircle className="text-emerald-500" />}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Producto</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Cantidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {data?.productoTerminadoDetalle?.length ? data.productoTerminadoDetalle.map((item, i) => (
                <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{item?.nombre || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{(item?.cantidad || 0).toLocaleString()} {item?.unidad || 'kg'}</span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={2} className="px-6 py-8 text-center text-slate-400 text-xs italic">Sin stock de producto terminado</td></tr>
              )}
            </tbody>
          </table>
        </TableContainer>

        <TableContainer title="Producción en Proceso" icon={<Factory className="text-indigo-500" />}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Máquina / Cliente</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {data?.produccionEnProcesoDetalle?.length ? data.produccionEnProcesoDetalle.map((item, i) => (
                <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{item?.maquina?.nombre || 'Máquina'}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black">{item?.pedido?.cliente?.nombre || 'Varios'}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-lg">EN PROCESO</span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={2} className="px-6 py-8 text-center text-slate-400 text-xs italic">No hay producción activa</td></tr>
              )}
            </tbody>
          </table>
        </TableContainer>
      </div>

      {/* Charts & Bottom Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
        <ChartContainer title="Pedidos por Estado" icon={<BadgeEstado estado="EnProceso" />}>
          <div className="h-72">
            <Bar data={chartDataEstados} options={chartOptions} />
          </div>
        </ChartContainer>

        <TableContainer title="Pedidos Recientes" icon={<FileText className="text-purple-500" />}>
          <table className="w-full">
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {data?.pedidosRecientes?.slice(0, 5).map((pedido) => (
                <tr key={pedido?.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{pedido?.cliente?.nombre || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <BadgeEstado estado={pedido?.estado || 'Pendiente'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableContainer>
      </div>
    </div>
  );
}

function MiniKPI({ icon, label, value, color, onClick }: any) {
  const colorMap: any = {
    orange: 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400',
    blue: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
    indigo: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400',
    purple: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400'
  };
  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-5 transition-all hover:shadow-xl ${onClick ? 'cursor-pointer active:scale-95' : ''}`}
    >
      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${colorMap[color] || colorMap.blue}`}>
        {icon && React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
      </div>
      <div>
        <p className="text-xl font-black text-slate-900 dark:text-slate-100 leading-none mb-1">{value}</p>
        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">{label}</p>
      </div>
    </motion.div>
  );
}

function ChartContainer({ title, icon, children }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">{icon}</div>
        <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function TableContainer({ title, icon, children }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col transition-colors">
      <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center gap-3">
        <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">{icon}</div>
        <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{title}</h3>
      </div>
      <div className="flex-1 overflow-x-auto">{children}</div>
    </div>
  );
}
