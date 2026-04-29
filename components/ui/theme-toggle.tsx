'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-10 w-10 rounded-xl bg-slate-100/50 border border-slate-200/60" />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="relative h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200/60 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 group overflow-hidden"
      aria-label="Alternar tema"
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === 'dark' ? (
          <motion.div
            key="moon"
            initial={{ y: 20, opacity: 0, rotate: 45 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -20, opacity: 0, rotate: -45 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Moon className="h-5 w-5 text-blue-400 fill-blue-400/10" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ y: 20, opacity: 0, rotate: 45 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -20, opacity: 0, rotate: -45 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Sun className="h-5 w-5 text-amber-500 fill-amber-500/10" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Subtle Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-current to-transparent opacity-0 group-hover:opacity-5 transition-opacity" />
    </button>
  );
}
