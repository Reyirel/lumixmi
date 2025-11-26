"use client"

import { useState, useEffect } from 'react';
import { 
  getPendingRecords, 
  exportPendingData,
  type PendingLuminaria 
} from '../../lib/offlineStorage';
import { forceSyncAllRecords, syncAllPendingRecords } from '../../lib/syncService';
import { useOnlineStatus } from '../../lib/useOnlineStatus';

export default function DatosPendientes() {
  const [pendingRecords, setPendingRecords] = useState<PendingLuminaria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const isOnline = useOnlineStatus();

  useEffect(() => {
    loadPendingRecords();
  }, []);

  // Auto-sincronización cuando hay conexión
  useEffect(() => {
    if (isOnline && pendingRecords.length > 0) {
      const autoSync = async () => {
        try {
          await syncAllPendingRecords();
          await loadPendingRecords();
        } catch (error) {
          console.error('Error en auto-sincronización:', error);
        }
      };
      
      // Esperar 2 segundos antes de auto-sincronizar
      const timer = setTimeout(autoSync, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingRecords.length]);

  const loadPendingRecords = async () => {
    try {
      const records = await getPendingRecords();
      setPendingRecords(records);
    } catch (error) {
      console.error('Error cargando registros pendientes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Función simplificada para forzar subida
  const handleForceUpload = async () => {
    if (!isOnline) {
      alert('No hay conexión a internet. Por favor, conectate y vuelve a intentar.');
      return;
    }

    if (!confirm('¿Forzar la subida de todos los datos pendientes?')) {
      return;
    }
    
    setIsSyncing(true);
    try {
      const result = await forceSyncAllRecords((current, total) => {
        setSyncProgress({ current, total });
      });
      
      if (result.synced > 0) {
        alert(`✓ ${result.synced} registros subidos exitosamente`);
      }
      if (result.failed > 0) {
        alert(`⚠ ${result.failed} registros fallaron. Revisa los errores en la lista.`);
      }
    } catch (error) {
      console.error('Error en forzar subida:', error);
      alert('Error al forzar la subida: ' + error);
    } finally {
      setIsSyncing(false);
      setSyncProgress({ current: 0, total: 0 });
      await loadPendingRecords();
    }
  };

  // Función para descargar datos como backup
  const handleDownloadData = async () => {
    try {
      const data = await exportPendingData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lumixmi-datos-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('Datos descargados correctamente. Guarda este archivo para poder resubirlos más tarde.');
    } catch (error) {
      console.error('Error descargando datos:', error);
      alert('Error al descargar los datos');
    }
  };

  // Obtener estadísticas simples
  const pendingCount = pendingRecords.filter(r => !r.synced).length;
  const errorCount = pendingRecords.filter(r => r.lastError && !r.synced).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-black">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header minimalista */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-light text-black mb-4">Gestión de Datos</h1>
          <div className="flex justify-center items-center space-x-8 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-black rounded-full"></div>
              <span className="text-black">{pendingRecords.length} registros totales</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 border-2 border-black rounded-full"></div>
              <span className="text-black">{pendingCount} pendientes</span>
            </div>
            {errorCount > 0 && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-black">{errorCount} con errores</span>
              </div>
            )}
          </div>
        </div>

        {/* Estado de conexión */}
        <div className="mb-8 text-center">
          <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full border ${
            isOnline ? 'border-black bg-black text-white' : 'border-gray-300 bg-white text-black'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm font-medium">
              {isOnline ? 'Conectado - Se subirán automáticamente' : 'Sin conexión - Datos almacenados localmente'}
            </span>
          </div>
        </div>

        {/* Botones principales */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12 justify-center">
          <button
            onClick={handleForceUpload}
            disabled={isSyncing || !isOnline}
            className={`flex items-center justify-center space-x-3 px-8 py-4 border-2 border-black transition-all ${
              isSyncing || !isOnline 
                ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' 
                : 'bg-black text-white hover:bg-white hover:text-black'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="font-medium">{isSyncing ? 'Subiendo...' : 'Forzar Subida'}</span>
          </button>

          <button
            onClick={handleDownloadData}
            disabled={isSyncing}
            className={`flex items-center justify-center space-x-3 px-8 py-4 border-2 border-black transition-all ${
              isSyncing 
                ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-black hover:bg-black hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-medium">Descargar Datos</span>
          </button>
        </div>

        {/* Progreso de sincronización */}
        {isSyncing && (
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm text-black mb-2">
              <span>Procesando registros...</span>
              <span>{syncProgress.current} / {syncProgress.total}</span>
            </div>
            <div className="w-full bg-gray-200 h-1">
              <div 
                className="bg-black h-1 transition-all duration-300"
                style={{ width: `${syncProgress.total > 0 ? (syncProgress.current / syncProgress.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Lista de registros con errores */}
        {errorCount > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-light text-black mb-6">Registros con Errores</h2>
            <div className="space-y-3">
              {pendingRecords
                .filter(r => r.lastError && !r.synced)
                .slice(0, 5)
                .map((record) => (
                  <div key={record.id} className="border border-gray-200 p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-sm">#{record.numero_poste}</span>
                        <span className="text-sm text-gray-600">Colonia {record.colonia_id}</span>
                        <span className="text-sm text-gray-600">{record.watts}W</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(record.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-sm text-black">{record.lastError}</span>
                    </div>
                  </div>
                ))}
              {errorCount > 5 && (
                <div className="text-center text-sm text-gray-600">
                  ... y {errorCount - 5} errores más
                </div>
              )}
            </div>
          </div>
        )}

        {/* Estado cuando no hay datos */}
        {pendingRecords.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-light text-black mb-2">Todos los datos están sincronizados</h3>
            <p className="text-gray-600">No hay registros pendientes de subir.</p>
          </div>
        )}
      </div>
    </div>
  );
}
