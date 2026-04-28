'use client';

import { useSession } from 'next-auth/react';
import { User, Mail, Shield, Lock, Key } from 'lucide-react';
import { useState } from 'react';
import { FormInput } from '@/components/forms/form-input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function PerfilPage() {
  const { data: session } = useSession() || {};
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/perfil/action-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al actualizar');
      }

      setMessage({ type: 'success', text: 'Contraseña de autorización actualizada correctamente.' });
      setNewPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="mt-1 text-gray-600">Información de tu cuenta</p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-md">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-3xl font-bold text-white shadow-lg">
              {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {session?.user?.name || 'Usuario'}
              </h2>
              <p className="text-gray-600 capitalize">
                {(session?.user as any)?.rol || 'usuario'}
              </p>
            </div>
          </div>

          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Nombre Completo</p>
                <p className="font-medium text-gray-900">
                  {session?.user?.name || 'No disponible'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Correo Electrónico</p>
                <p className="font-medium text-gray-900">
                  {session?.user?.email || 'No disponible'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Rol</p>
                <p className="font-medium capitalize text-gray-900">
                  {(session?.user as any)?.rol === 'admin'
                    ? 'Administrador'
                    : 'Usuario'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-blue-50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-blue-900">Permisos</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              {(session?.user as any)?.rol === 'admin' ? (
                <>
                  <li>• Acceso completo a todos los módulos</li>
                  <li>• Crear, editar y eliminar clientes</li>
                  <li>• Crear, editar y eliminar pedidos</li>
                  <li>• Ver estadísticas y reportes</li>
                </>
              ) : (
                <>
                  <li>• Ver listado de clientes</li>
                  <li>• Ver listado de pedidos</li>
                  <li>• Ver estadísticas y reportes</li>
                  <li className="text-blue-600">
                    • Acceso de solo lectura (sin permisos de edición)
                  </li>
                </>
              )}
            </ul>
          </div>

          <div className="mt-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm shadow-blue-50">
            <div className="mb-4 flex items-center gap-2 text-indigo-800">
              <Key className="h-5 w-5" />
              <h3 className="text-lg font-bold">Contraseña de Autorización</h3>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              Esta contraseña o PIN te permitirá confirmar acciones críticas como editar o borrar registros en los distintos módulos del sistema. Si no la has configurado, el sistema te pedirá tu contraseña de inicio de sesión por defecto.
            </p>

            <form onSubmit={handleSetPassword} className="space-y-4 max-w-sm">
              {message.text && (
                <div className={`rounded-lg p-3 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {message.text}
                </div>
              )}

              <FormInput
                label="Nuevo PIN / Contraseña de Acción"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 4 caracteres"
                required
              />

              <button
                type="submit"
                disabled={loading || newPassword.length < 4}
                className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {loading ? <LoadingSpinner /> : <><Lock className="h-4 w-4" /> Guardar Contraseña</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
