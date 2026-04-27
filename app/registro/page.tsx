'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Loader2, ArrowLeft } from 'lucide-react';
import { FormInput } from '@/components/forms/form-input';

export default function RegistroPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al registrar usuario');
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 shadow-lg">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">ERP Plásticos</h1>
          <p className="mt-2 text-gray-600">Crear una cuenta nueva</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">Registrarse</h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-600">
              ¡Registro exitoso! Redirigiendo al inicio de sesión...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Nombre Completo"
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Juan Pérez"
            />

            <FormInput
              label="Correo Electrónico"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="usuario@ejemplo.com"
            />

            <FormInput
              label="Contraseña"
              type="password"
              required
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Mínimo 6 caracteres"
            />

            <FormInput
              label="Confirmar Contraseña"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              placeholder="Repite tu contraseña"
            />

            <button
              type="submit"
              disabled={loading || success}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  Crear Cuenta
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              ¿Ya tienes cuenta? Inicia sesión
            </Link>
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-gray-600">
          © 2026 ERP Plásticos. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
