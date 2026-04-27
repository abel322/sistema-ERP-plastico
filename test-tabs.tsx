// Archivo de prueba para verificar que las pestañas funcionan
'use client';

import { useState } from 'react';

export default function TestTabs() {
  const [activeTab, setActiveTab] = useState('basico');

  return (
    <div className="p-8">
      <h1>Test de Pestañas</h1>
      
      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setActiveTab('basico')}
            className={`py-2 px-1 text-sm font-medium ${
              activeTab === 'basico'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📦 Información Básica
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('maquinas')}
            className={`py-2 px-1 text-sm font-medium ${
              activeTab === 'maquinas'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ⚙️ Parámetros de Máquinas
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'basico' && (
        <div>
          <h2>Información Básica</h2>
          <p>Aquí van los campos básicos del cliente</p>
        </div>
      )}

      {activeTab === 'maquinas' && (
        <div>
          <h2>Parámetros de Máquinas</h2>
          <p>Aquí van los 32 campos de extrusión</p>
          <ul>
            <li>Temperatura Ambiente</li>
            <li>Motor Principal</li>
            <li>Tracción</li>
            <li>Temperaturas Z1-Z20</li>
            <li>etc...</li>
          </ul>
        </div>
      )}
    </div>
  );
}