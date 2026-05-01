'use client';

import { motion } from 'framer-motion';
import { Package, Trash2, Pencil, Calendar, Info } from 'lucide-react';

interface ProductoSobrante {
  id: string;
  tipo: string;
  cantidad: number;
  unidad: string;
  descripcion: string | null;
  fecha: string;
}

interface SobranteCardProps {
  sobrante: ProductoSobrante;
  onEdit: () => void;
  onDelete: () => void;
  eliminando?: boolean;
}

export function SobranteCard({ sobrante, onEdit, onDelete, eliminando }: SobranteCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 shadow-sm hover:shadow-xl overflow-hidden"
    >
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 dark:bg-slate-800/50 rounded-full -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-110" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-400">
            <Package className="w-6 h-6" />
          </div>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="p-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-all hover:scale-110"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              disabled={eliminando}
              className="p-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-all hover:scale-110 disabled:opacity-50"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight mb-1">
            {sobrante.tipo}
          </h3>
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {new Date(sobrante.fecha).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-4 border border-slate-100 dark:border-slate-700/50">
          <div className="text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
            {sobrante.cantidad.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{sobrante.unidad}</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Cantidad en stock</p>
        </div>

        {sobrante.descripcion && (
          <div className="flex items-start gap-2 bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100/50 dark:border-blue-900/20">
            <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5" />
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
              "{sobrante.descripcion}"
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
