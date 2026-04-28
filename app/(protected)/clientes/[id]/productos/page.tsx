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
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver a Clientes
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Productos de {cliente?.nombre}
            </h1>
            <p className="text-gray-600">RIF: {cliente?.rif}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/pedidos?clienteId=${clienteId}`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              Ver Pedidos
            </button>
            <button
              onClick={() => router.push(`/clientes/${clienteId}/productos/nuevo`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nuevo Producto
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
