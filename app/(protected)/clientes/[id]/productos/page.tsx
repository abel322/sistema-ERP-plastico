'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Plus, ArrowLeft, ShoppingCart, Package } from 'lucide-react';
import { NuevoPedidoModal } from '@/components/modals/NuevoPedidoModal';
import { ProductoClienteCard } from '@/components/cards/ProductoClienteCard';

interface Cliente {
  id: string;
  nombre: string;
  rif: string;
}

interface ProductoCliente {
  id: string;
  clienteId: string;
  nombreProducto: string;
  codigoProducto?: string;
  activo: boolean;
  tipoProducto: string;
  conImpresion: boolean;
  ancho?: number;
  largo?: number;
  calibre?: number;
  diametroAnchoBolsa?: number;
  material?: string;
  unidadVenta: string;
}

export default function ProductosClientePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const clienteId = params.id as string;

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [productos, setProductos] = useState<ProductoCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductoId, setSelectedProductoId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router, clienteId]);

  const fetchData = async () => {
    try {
      // Obtener cliente
      const clienteRes = await fetch(`/api/clientes/${clienteId}`);
      if (clienteRes.ok) {
        const clienteData = await clienteRes.json();
        setCliente(clienteData);
      }

      // Obtener productos
      const productosRes = await fetch(`/api/clientes/${clienteId}/productos`);
      if (productosRes.ok) {
        const productosData = await productosRes.json();
        setProductos(productosData);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
      const response = await fetch(`/api/clientes/${clienteId}/productos/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchData();
      } else {
        alert('Error al eliminar producto');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar producto');
    }
  };

  const handleToggleActivo = async (producto: ProductoCliente) => {
    try {
      const response = await fetch(`/api/clientes/${clienteId}/productos/${producto.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...producto, activo: !producto.activo })
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (status === 'loading' || loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-wider">Volver a Clientes</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                Productos de <span className="text-blue-600">{cliente?.nombre}</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded">RIF: {cliente?.rif}</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className="text-slate-400 text-xs font-medium">{productos.length} productos registrados</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push(`/pedidos?clienteId=${clienteId}`)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 font-bold text-sm rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95"
            >
              <ShoppingCart className="w-4 h-4 text-blue-500" />
              VER PEDIDOS
            </button>
            <button
              onClick={() => router.push(`/clientes/${clienteId}/productos/nuevo`)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              NUEVO PRODUCTO
            </button>
          </div>
        </div>
      </div>

      {/* Lista de productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {productos.map((producto) => (
          <ProductoClienteCard
            key={producto.id}
            producto={producto}
            onEdit={() => router.push(`/clientes/${clienteId}/productos/${producto.id}/editar-completo`)}
            onDelete={() => handleDelete(producto.id)}
            onToggleActivo={() => handleToggleActivo(producto)}
            onCreatePedido={() => {
              setSelectedProductoId(producto.id);
              setIsModalOpen(true);
            }}
          />
        ))}
      </div>

      {productos.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">No hay productos registrados</p>
          <p className="text-sm">Agrega el primer producto para este cliente</p>
        </div>
      )}

      <NuevoPedidoModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProductoId(null);
        }}
        onSuccess={() => {
          setIsModalOpen(false);
          setSelectedProductoId(null);
        }}
        initialClienteId={clienteId}
        initialProductoId={selectedProductoId || undefined}
      />
    </div>
  );
}
