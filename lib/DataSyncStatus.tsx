"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPendingCount, getStorageStats } from './offlineStorage';
import { useOnlineStatus } from './useOnlineStatus';

export function DataSyncStatus() {
  const [pendingCount, setPendingCount] = useState(0);
  const [storageStats, setStorageStats] = useState<{
    totalRecords: number;
    totalSize: number;
    pendingRecords: number;
    syncedRecords: number;
    corruptedRecords: number;
    duplicateGroups: number;
    estimatedQuotaUsage?: number;
  } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    updateStats();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(updateStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const updateStats = async () => {
    try {
      const count = await getPendingCount();
      const stats = await getStorageStats();
      setPendingCount(count);
      setStorageStats(stats);
    } catch (error) {
      console.error('Error updating sync stats:', error);
    }
  };

  if (pendingCount === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-green-800 font-medium">Todos los datos están sincronizados</span>
        </div>
        <Link href="/datos-pendientes" className="text-green-600 hover:text-green-700 text-sm underline">
          Ver gestión
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg overflow-hidden">
      <div 
        className="p-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {!isOnline ? (
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            )}
            <span className="text-yellow-800 font-medium">
              {pendingCount} registro{pendingCount > 1 ? 's' : ''} pendiente{pendingCount > 1 ? 's' : ''}
              {!isOnline && ' (Sin conexión)'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Link 
              href="/datos-pendientes" 
              className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              Gestionar
            </Link>
            <button className="text-yellow-600 hover:text-yellow-700">
              <svg 
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {isExpanded && storageStats && (
        <div className="px-3 pb-3 border-t border-yellow-200 bg-yellow-25">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-yellow-700 mt-2">
            <div className="flex items-center space-x-1">
              <span>📊 Total:</span>
              <span className="font-medium">{storageStats.totalRecords}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>💾 Tamaño:</span>
              <span className="font-medium">{(storageStats.totalSize / 1024 / 1024).toFixed(1)}MB</span>
            </div>
            {storageStats.corruptedRecords > 0 && (
              <div className="flex items-center space-x-1 text-red-600">
                <span>⚠️ Corruptos:</span>
                <span className="font-medium">{storageStats.corruptedRecords}</span>
              </div>
            )}
            {storageStats.duplicateGroups > 0 && (
              <div className="flex items-center space-x-1 text-orange-600">
                <span>🔄 Duplicados:</span>
                <span className="font-medium">{storageStats.duplicateGroups}</span>
              </div>
            )}
          </div>
          
          {(storageStats.corruptedRecords > 0 || storageStats.duplicateGroups > 0) && (
            <div className="mt-2 p-2 bg-white rounded border border-yellow-300">
              <p className="text-xs text-yellow-800 mb-1">
                💡 <strong>Recomendación:</strong> Usa las herramientas de limpieza para optimizar el almacenamiento.
              </p>
              <Link 
                href="/datos-pendientes" 
                className="text-xs text-purple-600 hover:text-purple-700 underline"
              >
                Ir a herramientas de optimización →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
