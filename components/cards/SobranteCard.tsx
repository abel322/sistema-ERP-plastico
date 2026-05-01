'use client';

import { motion } from 'framer-motion';
import { Package, Trash2, Pencil, Calendar, Info, User, MoveHorizontal, MoveVertical, Ruler } from 'lucide-react';

interface ProductoSobrante {
  id: string;
  tipo: string;
  cantidad: number;
  unidad: string;
  descripcion: string | null;
  fecha: string;
  ancho?: number | null;
  largo?: number | null;
  calibre?: number | null;
  cliente?: { nombre: string } | null;
  producto?: { nombreProducto: string } | null;
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
          <div className="flex items-center gap-2 mb-1">
             <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-500 rounded">
               Stock Sobrante
             </span>
             {sobrante.cliente && (
               <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                 <User className="w-3 h-3" />
                 {sobrante.cliente.nombre}
               </div>
             )}
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight mb-1">
            {sobrante.tipo}
          </h3>
          {sobrante.producto && (
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
              Producto: {sobrante.producto.nombreProducto}
            </p>
          )}
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {new Date(sobrante.fecha).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Medidas */}
        {(sobrante.ancho || sobrante.largo || sobrante.calibre) && (
          <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-700/50">
            <div className="flex flex-col items-center">
              <MoveHorizontal className="w-3 h-3 text-slate-400 mb-1" />
              <span className="text-[10px] font-black text-slate-900 dark:text-white">{sobrante.ancho || '-'}</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Ancho</span>
            </div>
            <div className="flex flex-col items-center border-x border-slate-200 dark:border-slate-700">
              <MoveVertical className="w-3 h-3 text-slate-400 mb-1" />
              <span className="text-[10px] font-black text-slate-900 dark:text-white">{sobrante.largo || '-'}</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Largo</span>
            </div>
            <div className="flex flex-col items-center">
              <Ruler className="w-3 h-3 text-slate-400 mb-1" />
              <span className="text-[10px] font-black text-slate-900 dark:text-white">{sobrante.calibre || '-'}</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Calibre</span>
            </div>
          </div>
        )}

        <div className="bg-slate-900 dark:bg-white rounded-2xl p-4 mb-4 shadow-lg shadow-slate-200 dark:shadow-none">
          <div className="text-2xl font-black text-white dark:text-slate-900 flex items-baseline gap-1">
            {sobrante.cantidad.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{sobrante.unidad}</span>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Cantidad Disponible</p>
        </div>

        {sobrante.descripcion && (
          <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
            <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
              {sobrante.descripcion}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
