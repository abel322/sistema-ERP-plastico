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
    <>
      <div className="space-y-6 lg:space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600 sm:text-base">
            Resumen general del sistema de gestión
          </p>
        </div>

        {/* KPI Principal - Facturación del Mes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-blue-100 text-sm font-medium">Facturación - {mesActual} {anioActual}</p>
              <p className="text-3xl sm:text-4xl font-bold">
                ${(data?.statsFacturacion?.totalFacturado ?? 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              <div className="text-center">
                <p className="text-2xl font-bold">{data?.statsFacturacion?.facturasEmitidas ?? 0}</p>
                <p className="text-xs text-blue-100">Facturas Emitidas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{data?.statsFacturacion?.facturasPagadas ?? 0}</p>
                <p className="text-xs text-blue-100">Facturas Pagadas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{data?.statsFacturacion?.despachosPendientes ?? 0}</p>
                <p className="text-xs text-blue-100">Por Facturar</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{data?.stats?.mantenimientosProgramados ?? 0}</p>
                <p className="text-xs text-blue-100">Mantenimientos</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          <StatsCard
            title="Total Clientes"
            value={data?.stats?.totalClientes ?? 0}
            icon={Users}
            color="bg-blue-600"
            index={0}
          />
          <StatsCard
            title="Pedidos Activos"
            value={data?.stats?.pedidosActivos ?? 0}
            icon={FileText}
            color="bg-purple-600"
            index={1}
          />
          <StatsCard
            title="Completados Mes"
            value={data?.stats?.pedidosCompletadosMes ?? 0}
            icon={CheckCircle}
            color="bg-green-600"
            index={2}
          />
          <StatsCard
            title="Urgentes"
            value={data?.stats?.pedidosUrgentes ?? 0}
            icon={AlertTriangle}
            color="bg-red-600"
            index={3}
          />
          <StatsCard
            title="Producción Hoy"
            value={data?.stats?.produccionHoy ?? 0}
            icon={Factory}
            color="bg-indigo-600"
            index={4}
          />
          <StatsCard
            title="Despachos Hoy"
            value={data?.stats?.despachosHoy ?? 0}
            icon={Truck}
            color="bg-cyan-600"
            index={5}
          />
        </div>

        {/* Indicadores Secundarios */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data?.stats?.mermaHoy ?? 0} kg</p>
                <p className="text-xs text-gray-500">Merma Hoy</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data?.stats?.mejorasPendientes ?? 0}</p>
                <p className="text-xs text-gray-500">Mejoras Pendientes</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-pink-100 flex items-center justify-center">
                <Package className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data?.stats?.muestrasPendientes ?? 0}</p>
                <p className="text-xs text-gray-500">Muestras Pendientes</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Wrench className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data?.stats?.registrosProduccionHoy ?? 0}</p>
                <p className="text-xs text-gray-500">Registros Producción</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-4 shadow-md sm:p-6">
            <h3 className="mb-4 text-base font-semibold text-gray-900 sm:text-lg">
              Pedidos por Estado
            </h3>
            <div className="h-48 sm:h-64">
              <Bar data={chartDataEstados} options={chartOptions} />
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-md sm:p-6">
            <h3 className="mb-4 text-base font-semibold text-gray-900 sm:text-lg">
              Pedidos por Mes
            </h3>
            <div className="h-48 sm:h-64">
              <Line data={chartDataMeses} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Pedidos Recientes */}
          <div className="rounded-xl bg-white p-4 shadow-md sm:p-6">
            <h3 className="mb-4 text-base font-semibold text-gray-900 sm:text-lg">
              Pedidos Recientes
            </h3>
            <div className="-mx-4 overflow-x-auto sm:-mx-6">
              <div className="inline-block min-w-full px-4 align-middle sm:px-6">
                <table className="min-w-full">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium uppercase text-gray-600 sm:px-4 sm:py-3">
                        Cliente
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium uppercase text-gray-600 sm:px-4 sm:py-3">
                        Cantidad
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium uppercase text-gray-600 sm:px-4 sm:py-3">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data?.pedidosRecientes?.slice(0, 5).map((pedido) => (
                      <tr key={pedido?.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-900 sm:px-4 sm:py-3 sm:text-sm">
                          {pedido?.cliente?.nombre || 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-600 sm:px-4 sm:py-3 sm:text-sm">
                          {pedido?.cantidadSolicitada || 0} {pedido?.unidad || ''}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 sm:px-4 sm:py-3">
                          <BadgeEstado estado={pedido?.estado || 'Pendiente'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pedidos Urgentes */}
          <div className="rounded-xl bg-white p-4 shadow-md sm:p-6">
            <h3 className="mb-4 text-base font-semibold text-gray-900 sm:text-lg">
              Pedidos Urgentes (Próx. 7 Días)
            </h3>
            <div className="-mx-4 overflow-x-auto sm:-mx-6">
              <div className="inline-block min-w-full px-4 align-middle sm:px-6">
                <table className="min-w-full">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium uppercase text-gray-600 sm:px-4 sm:py-3">
                        Cliente
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium uppercase text-gray-600 sm:px-4 sm:py-3">
                        Entrega
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium uppercase text-gray-600 sm:px-4 sm:py-3">
                        Prioridad
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data?.pedidosUrgentesDetalle?.slice(0, 5).map((pedido) => (
                      <tr key={pedido?.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-900 sm:px-4 sm:py-3 sm:text-sm">
                          {pedido?.cliente?.nombre || 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-600 sm:px-4 sm:py-3 sm:text-sm">
                          {pedido?.fechaEntrega
                            ? format(new Date(pedido.fechaEntrega), 'dd/MM/yyyy')
                            : 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 sm:px-4 sm:py-3">
                          <BadgePrioridad prioridad={pedido?.prioridad || 'Media'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
