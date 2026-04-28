'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, ShieldCheck } from 'lucide-react';
import { FormInput } from '@/components/forms/form-input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ActionPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    actionType: 'editar' | 'eliminar';
}

export function ActionPasswordModal({ isOpen, onClose, onSuccess, actionType }: ActionPasswordModalProps) {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/perfil/verify-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Contraseña incorrecta');
            }

            // Exito, ejecutar callback
            onSuccess();
            setPassword(''); // limpiar para la prox
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col"
                >
                    <div className="p-6 bg-gradient-to-r from-gray-900 to-gray-800 text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Lock className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Autorización</h2>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <p className="text-sm text-gray-600 text-center mb-2">
                                Para <strong>{actionType}</strong> este registro, por favor ingrese su contraseña de autorización.
                            </p>

                            {error && (
                                <div className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 text-center">
                                    {error}
                                </div>
                            )}

                            <FormInput
                                label="Contraseña de Autorización"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="text-center text-lg"
                            />

                            <button
                                type="submit"
                                disabled={loading || !password}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 mt-2"
                            >
                                {loading ? <LoadingSpinner /> : <><ShieldCheck className="h-5 w-5" /> Autorizar</>}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
