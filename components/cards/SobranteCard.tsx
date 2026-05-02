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
  fuelles?: number | null;
  anchoTroquel?: number | null;
  largoTroquel?: number | null;
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
  const isBobina = sobrante.tipo.toLowerCase().includes('bobina');
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200/60 dark:border-slate-800/60 hover:border-blue-500/30 dark:hover:border-blue-400/30 transition-all duration-500 shadow-sm hover:shadow-2xl hover:shadow-blue-500/5 dark:hover:shadow-blue-400/5 flex flex-col h-full"
    >
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/5 dark:bg-blue-400/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div className={`p-3.5 rounded-2xl ${isBobina ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'} shadow-inner`}>
          <Package className="w-6 h-6" />
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-1 group-hover:translate-y-0">
          <button
            onClick={onEdit}
            className="p-2.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            disabled={eliminando}
            className="p-2.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-[9px] font-black uppercase tracking-[0.1em] text-slate-500 rounded-full">
              Sobrante
            </span>
            {sobrante.cliente && (
              <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-[9px] font-black uppercase tracking-[0.1em] text-blue-600 dark:text-blue-400 rounded-full flex items-center gap-1.5">
                <User className="w-2.5 h-2.5" />
                {sobrante.cliente.nombre}
              </span>
            )}
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {sobrante.tipo}
          </h3>
          {sobrante.producto && (
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 border-l-2 border-slate-200 dark:border-slate-700 pl-3">
              {sobrante.producto.nombreProducto}
            </p>
          )}
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-[1.5rem] border border-slate-100 dark:border-slate-800/60 shadow-inner">
           {[
             { label: 'Ancho', val: sobrante.ancho, icon: MoveHorizontal },
             { label: 'Largo', val: sobrante.largo, icon: MoveVertical },
             { label: 'Calibre', val: sobrante.calibre, icon: Ruler },
             { label: 'Fuelles', val: sobrante.fuelles, icon: MoveHorizontal, hide: !sobrante.fuelles },
             { label: 'A. Troquel', val: sobrante.anchoTroquel, icon: Ruler, hide: !sobrante.anchoTroquel },
             { label: 'L. Troquel', val: sobrante.largoTroquel, icon: Ruler, hide: !sobrante.largoTroquel },
           ].filter(s => !s.hide).map((spec, i) => (
             <div key={i} className="flex flex-col items-center justify-center text-center">
               <spec.icon className="w-3.5 h-3.5 text-slate-400 mb-1.5 opacity-60" />
               <span className="text-xs font-black text-slate-900 dark:text-white leading-none mb-1">{spec.val || '-'}</span>
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{spec.label}</span>
             </div>
           ))}
        </div>
      </div>

      {/* Footer Section */}
      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
              {sobrante.cantidad.toLocaleString(undefined, { minimumFractionDigits: 1 })}
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 ml-1.5 uppercase tracking-widest">{sobrante.unidad === 'Kilogramos' ? 'Kg' : sobrante.unidad}</span>
            </span>
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Stock Disponible
            </span>
          </div>
          <div className="text-right">
             <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 justify-end">
               <Calendar className="w-3.5 h-3.5" />
               <span className="text-[10px] font-black uppercase tracking-widest">
                 {new Date(sobrante.fecha).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })}
               </span>
             </div>
          </div>
        </div>

        {sobrante.descripcion && (
          <div className="mt-4 flex items-start gap-2.5 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/60 group/desc">
            <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 group-hover/desc:text-blue-500 transition-colors" />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 italic">
              "{sobrante.descripcion}"
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
