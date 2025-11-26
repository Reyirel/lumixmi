"use client"

import { useState, useEffect } from 'react';
import { 
  getPendingRecords, 
  exportPendingData,
  type PendingLuminaria 
} from '../../lib/offlineStorage';
import { 
  forceSyncAllRecords, 
  syncAllPendingRecords, 
  resetSyncState, 
  autoRecoverySync,
  smartSync,
  getSyncStats,
  advancedDiagnosis,
  cleanupOldRecords
} from '../../lib/syncService';
import { useOnlineStatus } from '../../lib/useOnlineStatus';

export default function DatosPendientes() {
  const [pendingRecords, setPendingRecords] = useState<PendingLuminaria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0, status: '' });
  const [syncStats, setSyncStats] = useState<any>(null);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [showAdvancedInfo, setShowAdvancedInfo] = useState(false);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    const initializeApp = async () => {
      // Auto-recovery automático al cargar la página
      try {
        console.log('🔧 Iniciando auto-recovery automático...');
        const recoveryResult = await autoRecoverySync();
        
        if (recoveryResult.recovered) {
          if (recoveryResult.synced > 0 || recoveryResult.basicDataOnly > 0) {
            console.log(`✅ Auto-recovery completado: ${recoveryResult.synced} completos, ${recoveryResult.basicDataOnly} solo datos básicos`);
          }
        }
      } catch (error) {
        console.error('❌ Error en auto-recovery:', error);
      }
      
      // Cargar registros después del recovery
      await loadPendingRecords();
    };
    
    initializeApp();
  }, []);

  // Auto-sincronización inteligente cuando hay conexión
  useEffect(() => {
    if (isOnline && pendingRecords.length > 0) {
      const autoSync = async () => {
        try {
          // Intentar auto-recovery primero
          const recoveryResult = await autoRecoverySync();
          if (recoveryResult.synced > 0 || recoveryResult.basicDataOnly > 0) {
            console.log(`✅ Auto-sync con recovery: ${recoveryResult.synced} completos, ${recoveryResult.basicDataOnly} solo datos`);
          }
          
          // Intentar sync normal para cualquier registro que quede
          await syncAllPendingRecords();
          await loadPendingRecords();
        } catch (error) {
          console.error('Error en auto-sincronización:', error);
        }
      };
      
      // Esperar 3 segundos antes de auto-sincronizar (más tiempo para recovery)
      const timer = setTimeout(autoSync, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingRecords.length]);

  const loadPendingRecords = async () => {
    try {
      const records = await getPendingRecords();
      setPendingRecords(records);
      await loadSyncStats(); // Cargar estadísticas junto con los registros
    } catch (error) {
      console.error('Error cargando registros pendientes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar estadísticas de sincronización
  const loadSyncStats = async () => {
    try {
      const stats = await getSyncStats();
      setSyncStats(stats);
      
      const diagnosisData = await advancedDiagnosis();
      setDiagnosis(diagnosisData);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  // Función para limpiar registros antiguos
  const handleCleanup = async () => {
    if (!confirm('¿Eliminar registros sincronizados de más de 30 días y registros corruptos?\n\nEsta acción no se puede deshacer.')) {
      return;
    }

    try {
      const result = await cleanupOldRecords(30);
      
      let message = `Limpieza completada:\n`;
      message += `✓ ${result.deleted} registros eliminados\n`;
      
      if (result.errors.length > 0) {
        message += `⚠ ${result.errors.length} errores durante la limpieza`;
      }
      
      alert(message);
      await loadPendingRecords(); // Recargar datos
      
    } catch (error) {
      console.error('Error en limpieza:', error);
      alert('Error durante la limpieza: ' + error);
    }
  };

  // Sincronización inteligente (recomendada)
  const handleSmartSync = async () => {
    if (!isOnline) {
      alert('No hay conexión a internet. Por favor, conéctate y vuelve a intentar.');
      return;
    }

    if (!confirm('¿Iniciar sincronización inteligente? Esta es la opción recomendada.')) {
      return;
    }
    
    setIsSyncing(true);
    try {
      const result = await smartSync((current, total, status) => {
        setSyncProgress({ current, total, status });
      });
      
      let message = `Sincronización completada:\n`;
      message += `✓ ${result.success} registros exitosos\n`;
      if (result.failed > 0) {
        message += `⚠ ${result.failed} registros fallidos\n`;
      }
      if (result.skipped > 0) {
        message += `⏭ ${result.skipped} registros saltados\n`;
      }
      message += `Estrategia utilizada: ${result.strategy}`;
      
      alert(message);
      
    } catch (error) {
      console.error('Error en sincronización inteligente:', error);
      resetSyncState();
      alert('Error en la sincronización: ' + error);
    } finally {
      setIsSyncing(false);
      setSyncProgress({ current: 0, total: 0, status: '' });
      await loadPendingRecords();
      await loadSyncStats();
    }
  };

  // Función simplificada para forzar subida (fallback)
  const handleForceUpload = async () => {
    if (!isOnline) {
      alert('No hay conexión a internet. Por favor, conéctate y vuelve a intentar.');
      return;
    }

    const message = '⚠️ Esta es la opción de emergencia.\n\n' +
                   'Se recomienda usar "Sincronización Inteligente" primero.\n\n' +
                   '¿Continuar con la subida forzada?';

    if (!confirm(message)) {
      return;
    }
    
    setIsSyncing(true);
    try {
      const result = await forceSyncAllRecords((current, total) => {
        setSyncProgress({ current, total, status: `Forzando ${current}/${total}` });
      });
      
      if (result.synced > 0) {
        alert(`✓ ${result.synced} registros subidos exitosamente`);
      }
      if (result.failed > 0) {
        alert(`⚠ ${result.failed} registros fallaron. Revisa los errores en la lista.`);
      }
    } catch (error) {
      console.error('Error en forzar subida:', error);
      resetSyncState();
      alert('Error al forzar la subida: ' + error);
    } finally {
      setIsSyncing(false);
      setSyncProgress({ current: 0, total: 0, status: '' });
      await loadPendingRecords();
      await loadSyncStats();
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
          <div className="flex justify-center items-center space-x-8 text-sm mb-4">
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
          
          {/* Estadísticas avanzadas */}
          {syncStats && (
            <div className="bg-gray-50 rounded-lg p-4 max-w-2xl mx-auto">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700">Análisis de Datos</h3>
                <button
                  onClick={() => setShowAdvancedInfo(!showAdvancedInfo)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {showAdvancedInfo ? 'Ocultar detalles' : 'Ver detalles'}
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                <div>
                  <span className="text-gray-500">Tamaño total:</span>
                  <div className="font-medium">{syncStats.totalSize}</div>
                </div>
                <div>
                  <span className="text-gray-500">Promedio por registro:</span>
                  <div className="font-medium">{syncStats.avgFileSize}</div>
                </div>
                <div>
                  <span className="text-gray-500">Archivos grandes:</span>
                  <div className="font-medium">{syncStats.largeFiles}</div>
                </div>
                <div>
                  <span className="text-gray-500">Sincronizados:</span>
                  <div className="font-medium">{syncStats.synced}</div>
                </div>
              </div>

              {/* Diagnóstico avanzado */}
              {showAdvancedInfo && diagnosis && (
                <div className="border-t pt-4">
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-700 mb-1">
                      Estrategia Recomendada: {diagnosis.recommendedStrategy}
                    </div>
                    <div className="text-xs text-gray-600">
                      Tiempo estimado: {diagnosis.estimatedTime}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
                    <div className="text-center">
                      <div className="font-medium">{diagnosis.sizeBrackets.small}</div>
                      <div className="text-gray-500">Pequeños</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{diagnosis.sizeBrackets.medium}</div>
                      <div className="text-gray-500">Medianos</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{diagnosis.sizeBrackets.large}</div>
                      <div className="text-gray-500">Grandes</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-red-600">{diagnosis.sizeBrackets.xlarge}</div>
                      <div className="text-gray-500">XL</div>
                    </div>
                  </div>

                  {diagnosis.risks.length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs font-medium text-red-700 mb-1">⚠️ Advertencias:</div>
                      {diagnosis.risks.map((risk: string, index: number) => (
                        <div key={index} className="text-xs text-red-600">• {risk}</div>
                      ))}
                    </div>
                  )}

                  {diagnosis.recommendations.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-green-700 mb-1">💡 Recomendaciones:</div>
                      {diagnosis.recommendations.slice(0, 3).map((rec: string, index: number) => (
                        <div key={index} className="text-xs text-green-600">• {rec}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Estado de conexión */}
        <div className="mb-8 text-center">
          <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full border ${
            isOnline ? 'border-black bg-black text-white' : 'border-gray-300 bg-white text-black'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm font-medium">
              {isOnline ? 'Conectado - Auto-recovery y sincronización automática activa' : 'Sin conexión - Datos almacenados localmente'}
            </span>
          </div>
          

        </div>

        {/* Botones principales */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12 justify-center">
          {/* Sincronización Inteligente - Opción Recomendada */}
          <button
            onClick={handleSmartSync}
            disabled={isSyncing || !isOnline}
            className={`flex items-center justify-center space-x-3 px-8 py-4 border-2 border-green-600 transition-all relative ${
              isSyncing || !isOnline 
                ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' 
                : 'bg-green-600 text-white hover:bg-white hover:text-green-600'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="font-medium">{isSyncing ? 'Sincronizando...' : 'Sync Inteligente'}</span>
            <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              Recomendado
            </div>
          </button>

          {/* Forzar Subida - Opción de Emergencia */}
          <button
            onClick={handleForceUpload}
            disabled={isSyncing || !isOnline}
            className={`flex items-center justify-center space-x-3 px-8 py-4 border-2 border-black transition-all ${
              isSyncing || !isOnline 
                ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-black hover:bg-black hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="font-medium">Forzar Subida</span>
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

          <button
            onClick={handleCleanup}
            disabled={isSyncing}
            className={`flex items-center justify-center space-x-3 px-6 py-4 border-2 border-gray-300 transition-all ${
              isSyncing 
                ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-400'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="font-medium text-sm">Limpiar</span>
          </button>
        </div>

        {/* Progreso de sincronización */}
        {isSyncing && (
          <div className="mb-8 bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between text-sm text-black mb-2">
              <span className="font-medium">
                {syncProgress.status || 'Procesando registros...'}
              </span>
              <span className="text-gray-600">{syncProgress.current} / {syncProgress.total}</span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${syncProgress.total > 0 ? (syncProgress.current / syncProgress.total) * 100 : 0}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-gray-500 text-center">
              Sincronización inteligente con compresión automática y control de errores
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
