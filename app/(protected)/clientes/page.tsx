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
    <div className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
      {/* Header Area */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-none">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight">Clientes</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded">Directorio Principal</span>
                <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">{filteredClientes.length} clientes encontrados</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative min-w-[280px]">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por nombre o RIF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 transition-all text-sm outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>
            <button
              onClick={handleOpenModal}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none active:scale-95"
            >
              <Plus className="w-4 h-4" />
              NUEVO CLIENTE
            </button>
          </div>
        </div>
      </div>      {/* Tabla de clientes moderna */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Empresa</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Contacto Directo</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Ubicación Fiscal</th>
                <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredClientes.map((cliente) => (
                <tr key={cliente.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors duration-200">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform shadow-sm border border-blue-100/50 dark:border-blue-800/50">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {cliente.nombre}
                        </p>
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          RIF: {cliente.rif}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{cliente.contacto || 'N/A'}</p>
                      <div className="flex flex-col text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {cliente.email && <span className="truncate max-w-[180px]">{cliente.email}</span>}
                        {cliente.telefono && <span>{cliente.telefono}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-start gap-2 max-w-[220px]">
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 italic" title={cliente.direccion}>
                        {cliente.direccion || 'Sin dirección registrada'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleViewProducts(cliente)}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-all shadow-sm group/btn"
                      >
                        <Package className="w-3.5 h-3.5 text-blue-500 group-hover/btn:text-white" />
                        Productos
                      </button>
                      <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-800 mx-1" />
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditCliente(cliente)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cliente.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredClientes.length === 0 && (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 max-w-lg mx-auto mt-10 transition-colors">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-600">
            <Search className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No se encontraron clientes</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Intenta ajustar tu búsqueda o agrega uno nuevo.</p>
        </div>
      )}

      {/* Modal de cliente */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 border border-slate-100 dark:border-slate-800">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Completa los datos del directorio empresarial.</p>
            </div>

            <div className="p-8 overflow-y-auto">
              <form id="cliente-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField 
                    label="Nombre de la Empresa" 
                    required 
                    value={formData.nombre} 
                    onChange={(val) => setFormData({ ...formData, nombre: val })}
                    placeholder="Ej. Plasticos del Caribe C.A."
                  />
                  <FormField 
                    label="RIF" 
                    required 
                    value={formData.rif} 
                    onChange={(val) => setFormData({ ...formData, rif: val })}
                    placeholder="J-12345678-9"
                  />
                  <FormField 
                    label="Persona de Contacto" 
                    value={formData.contacto} 
                    onChange={(val) => setFormData({ ...formData, contacto: val })}
                    placeholder="Nombre del contacto"
                  />
                  <FormField 
                    label="Teléfono" 
                    value={formData.telefono} 
                    onChange={(val) => setFormData({ ...formData, telefono: val })}
                    placeholder="+58 412-0000000"
                  />
                  <FormField 
                    label="Email Corporativo" 
                    type="email"
                    value={formData.email} 
                    onChange={(val) => setFormData({ ...formData, email: val })}
                    placeholder="contacto@empresa.com"
                  />
                  <FormField 
                    label="Dirección Fiscal" 
                    value={formData.direccion} 
                    onChange={(val) => setFormData({ ...formData, direccion: val })}
                    placeholder="Ciudad, Estado, Calle..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Observaciones Internas
                  </label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    rows={4}
                    placeholder="Notas adicionales sobre este cliente..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm"
                  />
                </div>
              </form>
            </div>

            <div className="p-8 bg-slate-50 dark:bg-slate-800/50 flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 text-slate-500 dark:text-slate-400 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                CANCELAR
              </button>
              <button
                type="submit"
                form="cliente-form"
                className="px-8 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 dark:shadow-none transition-all active:scale-95"
              >
                {isEditing ? 'GUARDAR CAMBIOS' : 'CREAR CLIENTE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function ClientInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</span>
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{value}</span>
    </div>
  );
}

function FormField({ label, required, value, onChange, type = "text", placeholder }: any) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
      />
    </div>
  );
}
