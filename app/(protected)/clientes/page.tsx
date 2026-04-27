'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Plus, Search, Edit, Trash2, Package, Building2, ChevronRight } from 'lucide-react';

interface Cliente {
  id: string;
  nombre: string;
  rif: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  observaciones?: string;
  productos?: ProductoCliente[];
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
}

export default function ClientesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form data para cliente
  const [formData, setFormData] = useState({
    nombre: '',
    rif: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
    observaciones: ''
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchClientes();
    }
  }, [status, router]);

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/clientes');
      if (response.ok) {
        const data = await response.json();
        // La API devuelve { clientes: [...] }
        setClientes(data.clientes || data);
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setIsEditing(false);
    setFormData({
      nombre: '',
      rif: '',
      contacto: '',
      telefono: '',
      email: '',
      direccion: '',
      observaciones: ''
    });
    setShowModal(true);
  };

  const handleEditCliente = (cliente: Cliente) => {
    setIsEditing(true);
    setFormData({
      nombre: cliente.nombre,
      rif: cliente.rif,
      contacto: cliente.contacto || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      direccion: cliente.direccion || '',
      observaciones: cliente.observaciones || ''
    });
    setSelectedCliente(cliente);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = isEditing ? `/api/clientes/${selectedCliente?.id}` : '/api/clientes';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchClientes();
        setShowModal(false);
      } else {
        alert('Error al guardar cliente');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar cliente');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;

    try {
      const response = await fetch(`/api/clientes/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchClientes();
      } else {
        alert('Error al eliminar cliente');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar cliente');
    }
  };

  const handleViewProducts = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    // Aquí puedes navegar a una página de productos o abrir un modal
    router.push(`/clientes/${cliente.id}/productos`);
  };

  const filteredClientes = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.rif.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === 'loading' || loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Clientes</h1>
        <p className="text-gray-600">Gestiona los clientes y sus productos</p>
      </div>

      {/* Barra de búsqueda y botón nuevo */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre o RIF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Cliente
        </button>
      </div>

      {/* Lista de clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClientes.map((cliente) => (
          <div
            key={cliente.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">{cliente.nombre}</h3>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEditCliente(cliente)}
                  className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(cliente.id)}
                  className="p-1 text-gray-600 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1 text-sm text-gray-600 mb-3">
              <p><span className="font-medium">RIF:</span> {cliente.rif}</p>
              {cliente.contacto && <p><span className="font-medium">Contacto:</span> {cliente.contacto}</p>}
              {cliente.telefono && <p><span className="font-medium">Teléfono:</span> {cliente.telefono}</p>}
              {cliente.email && <p><span className="font-medium">Email:</span> {cliente.email}</p>}
            </div>

            <button
              onClick={() => handleViewProducts(cliente)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              <Package className="w-4 h-4" />
              Ver Productos
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {filteredClientes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No se encontraron clientes
        </div>
      )}

      {/* Modal de cliente */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      RIF *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.rif}
                      onChange={(e) => setFormData({ ...formData, rif: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contacto
                    </label>
                    <input
                      type="text"
                      value={formData.contacto}
                      onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={formData.direccion}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones
                  </label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {isEditing ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
