'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, FileText, Users, Factory, Package, Receipt, Truck, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  tipo: string;
  titulo: string;
  subtitulo?: string;
  url: string;
}

const iconMap: { [key: string]: any } = {
  cliente: Users,
  pedido: FileText,
  produccion: Factory,
  inventario: Package,
  factura: Receipt,
  despacho: Truck,
  proveedor: Building2,
};

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Atajo de teclado para abrir búsqueda
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input cuando se abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Búsqueda con debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/busqueda?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.resultados || []);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Error en búsqueda:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = useCallback((result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    router.push(result.url);
  }, [router]);

  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  return (
    <>
      {/* Botón de búsqueda */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Buscar...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-white rounded border border-gray-300">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Modal de búsqueda */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[10vh] px-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Input de búsqueda */}
              <div className="flex items-center px-4 border-b border-gray-200">
                <Search className="h-5 w-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyNavigation}
                  placeholder="Buscar clientes, pedidos, facturas..."
                  className="flex-1 px-4 py-4 text-gray-900 placeholder-gray-400 focus:outline-none"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="p-1 hover:bg-gray-100 rounded">
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>

              {/* Resultados */}
              <div className="max-h-[60vh] overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                    Buscando...
                  </div>
                ) : results.length > 0 ? (
                  <ul className="py-2">
                    {results.map((result, index) => {
                      const Icon = iconMap[result.tipo] || FileText;
                      return (
                        <li key={`${result.tipo}-${result.id}`}>
                          <button
                            onClick={() => handleSelect(result)}
                            className={cn(
                              'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                              index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                            )}
                          >
                            <div className={cn(
                              'h-10 w-10 rounded-lg flex items-center justify-center',
                              result.tipo === 'cliente' && 'bg-green-100 text-green-600',
                              result.tipo === 'pedido' && 'bg-blue-100 text-blue-600',
                              result.tipo === 'produccion' && 'bg-purple-100 text-purple-600',
                              result.tipo === 'factura' && 'bg-yellow-100 text-yellow-600',
                              result.tipo === 'inventario' && 'bg-orange-100 text-orange-600',
                              result.tipo === 'despacho' && 'bg-cyan-100 text-cyan-600',
                              result.tipo === 'proveedor' && 'bg-pink-100 text-pink-600'
                            )}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{result.titulo}</div>
                              {result.subtitulo && (
                                <div className="text-sm text-gray-500 truncate">{result.subtitulo}</div>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 capitalize">{result.tipo}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : query ? (
                  <div className="p-8 text-center text-gray-500">
                    No se encontraron resultados para "{query}"
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    Escribe para buscar en todo el sistema
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white rounded border">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-white rounded border">↓</kbd>
                  navegar
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white rounded border">Enter</kbd>
                  seleccionar
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white rounded border">Esc</kbd>
                  cerrar
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
