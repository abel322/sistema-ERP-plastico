'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
    Workflow,
    ArrowRight,
    ArrowDown,
    Recycle,
    Factory,
    Paintbrush,
    Scissors,
    Layers,
    PackageCheck
} from 'lucide-react';
import { useState } from 'react';

// Interfaces
interface FlujoPaso {
    id: string;
    titulo: string;
    descripcion: string;
    icono: React.ReactNode;
    color: string;
    opcional?: boolean;
}

const pasosFabricacionBolsa: FlujoPaso[] = [
    {
        id: 'materia-prima',
        titulo: 'Materia Prima / Mezcla',
        descripcion: 'Recepción y pesado de resinas (Polietileno, Masterbatch, Aditivos).',
        icono: <Recycle className="w-8 h-8" />,
        color: 'bg-emerald-500'
    },
    {
        id: 'extrusion',
        titulo: 'Extrusión',
        descripcion: 'Fundición del material y formación de la bobina o película plástica tubular.',
        icono: <Factory className="w-8 h-8" />,
        color: 'bg-blue-600'
    },
    {
        id: 'serigrafia',
        titulo: 'Serigrafía',
        descripcion: 'Impresión de diseños sobre el plástico. (Proceso opcional para bolsas impresas).',
        icono: <Paintbrush className="w-8 h-8" />,
        color: 'bg-indigo-500',
        opcional: true
    },
    {
        id: 'refilado',
        titulo: 'Refilado',
        descripcion: 'Corte lateral o división de la bobina si el diseño lo requiere.',
        icono: <Scissors className="w-8 h-8" />,
        color: 'bg-purple-500',
        opcional: true
    },
    {
        id: 'sellado',
        titulo: 'Sellado y Corte',
        descripcion: 'La bobina se sella térmicamente y se corta para darle la forma final de bolsa.',
        icono: <Layers className="w-8 h-8" />,
        color: 'bg-orange-500'
    },
    {
        id: 'producto-terminado',
        titulo: 'Producto Terminado',
        descripcion: 'Inspección final, empaquetado y envío a almacén para su despacho.',
        icono: <PackageCheck className="w-8 h-8" />,
        color: 'bg-teal-500'
    }
];

export default function DiagramasPage() {
    const [activeStep, setActiveStep] = useState<string | null>(null);

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <Workflow className="h-8 w-8 text-indigo-600" />
                    Flujos de Proceso
                </h1>
                <p className="text-gray-500">
                    Visualización interactiva de los procesos involucrados en fabricación.
                </p>
            </div>

            {/* Main Container */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <div className="mb-8 text-center max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Fabricación de Bolsas Plásticas</h2>
                    <p className="text-gray-500 text-sm">
                        Este diagrama ilustra el recorrido completo desde la materia prima hasta el producto final empacado listos para despacho.
                        Las etapas marcadas como opcionales dependen de las especificaciones del cliente.
                    </p>
                </div>

                {/* Diagram Area */}
                <div className="relative py-10 w-full max-w-5xl mx-auto">

                    <div className="hidden lg:flex flex-row items-center justify-between relative z-10 w-full">
                        {pasosFabricacionBolsa.map((paso, index) => (
                            <div key={paso.id} className="flex flex-row items-center relative group">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.15 }}
                                    onMouseEnter={() => setActiveStep(paso.id)}
                                    onMouseLeave={() => setActiveStep(null)}
                                    className={`
                    flex flex-col items-center gap-4 transition-all duration-300 w-32 cursor-pointer
                    ${activeStep && activeStep !== paso.id ? 'opacity-40 scale-95' : 'opacity-100 scale-100'}
                    ${activeStep === paso.id ? 'scale-110 -translate-y-2' : ''}
                  `}
                                >
                                    <div className={`p-4 rounded-2xl text-white shadow-lg ${paso.color} ${paso.opcional ? 'ring-4 ring-offset-2 ring-indigo-200 ring-dashed' : ''} transition-all duration-300`}>
                                        {paso.icono}
                                    </div>

                                    <div className="text-center">
                                        <h3 className="font-bold text-gray-800 text-sm">{paso.titulo}</h3>
                                        {paso.opcional && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                                                Opcional
                                            </span>
                                        )}
                                    </div>
                                </motion.div>

                                {/* Flecha separadora (no mostrar en el último) */}
                                {index < pasosFabricacionBolsa.length - 1 && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.15 + 0.1 }}
                                        className="mx-2 lg:mx-4 flex items-center shrink-0"
                                    >
                                        <ArrowRight className={`w-6 h-6 ${activeStep ? 'text-gray-200' : 'text-gray-400'} transition-colors`} strokeWidth={3} />
                                    </motion.div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Versión responsiva (móvil y tablet) */}
                    <div className="flex lg:hidden flex-col items-center gap-6 relative z-10 w-full">
                        {pasosFabricacionBolsa.map((paso, index) => (
                            <div key={paso.id} className="flex flex-col items-center group w-full">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.15 }}
                                    onMouseEnter={() => setActiveStep(paso.id)}
                                    onMouseLeave={() => setActiveStep(null)}
                                    className={`
                    flex flex-row items-center gap-6 p-4 rounded-2xl w-full max-w-sm transition-all duration-300 cursor-pointer
                    border-2 ${activeStep === paso.id ? 'border-indigo-100 bg-indigo-50/50 shadow-md' : 'border-transparent bg-white shadow-sm'}
                    ${activeStep && activeStep !== paso.id ? 'opacity-50' : 'opacity-100'}
                  `}
                                >
                                    <div className={`p-4 rounded-xl text-white shadow-md shrink-0 ${paso.color} ${paso.opcional ? 'ring-4 ring-offset-1 ring-indigo-200 ring-dashed' : ''}`}>
                                        {paso.icono}
                                    </div>

                                    <div className="flex-1 text-left">
                                        <h3 className="font-bold text-gray-800 text-base">{paso.titulo}</h3>
                                        {paso.opcional && (
                                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full mt-1 mb-1 inline-block">
                                                Condicional
                                            </span>
                                        )}
                                        <p className="text-xs text-gray-500 leading-relaxed mt-1">
                                            {paso.descripcion}
                                        </p>
                                    </div>
                                </motion.div>

                                {/* Flecha separadora vertical */}
                                {index < pasosFabricacionBolsa.length - 1 && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.15 + 0.1 }}
                                        className="my-3 flex justify-center shrink-0"
                                    >
                                        <ArrowDown className={`w-5 h-5 ${activeStep ? 'text-gray-200' : 'text-gray-400'}`} strokeWidth={3} />
                                    </motion.div>
                                )}
                            </div>
                        ))}
                    </div>

                </div>

                {/* Panel de Detalles Informativos (Desktop) */}
                <AnimatePresence mode="wait">
                    {activeStep && (
                        <motion.div
                            key={activeStep}
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            className="hidden lg:block mt-12 bg-gray-50 rounded-2xl p-6 border border-gray-100 max-w-3xl mx-auto shadow-inner"
                        >
                            {pasosFabricacionBolsa.filter(p => p.id === activeStep).map((paso) => (
                                <div key={paso.id} className="flex gap-6 items-start">
                                    <div className={`p-3 rounded-xl text-white shadow-sm mt-1 shrink-0 ${paso.color}`}>
                                        {paso.icono}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{paso.titulo}</h3>
                                        <p className="text-gray-600 leading-relaxed mt-2 text-sm">
                                            {paso.descripcion}
                                        </p>
                                        {paso.opcional && (
                                            <p className="text-indigo-600 text-xs font-semibold mt-3 bg-indigo-50 inline-block px-3 py-1 rounded-full">
                                                Esta fase se activa únicamente si el cliente especificó este requerimiento al crear el pedido.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Helper state when nothing is hovered */}
                {!activeStep && (
                    <div className="hidden lg:flex mt-12 h-[120px] items-center justify-center text-gray-400 bg-gray-50 rounded-2xl border border-gray-100 border-dashed max-w-3xl mx-auto">
                        <p className="text-sm font-medium">Pasa el ratón sobre un paso para ver los detalles.</p>
                    </div>
                )}

            </div>
        </div>
    );
}
