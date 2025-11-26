"use client"

import {
  getPendingRecords,
  markAsSynced,
  deleteRecord,
  blobToFile,
  getPendingCount,
  isRecordSynced,
  diagnoseRecords,
  getRecordById,
  resetSyncStatus,
  initDB,
  type PendingLuminaria,
} from './offlineStorage';

// Variable para evitar sincronizaciones concurrentes
let isSyncing = false;

// Número máximo de reintentos para cada registro
const MAX_RETRIES = 3;

// Delay entre reintentos (en ms)
const RETRY_DELAY = 2000;

// Función auxiliar para esperar
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Función para verificar si un Blob es válido
function isValidBlob(blob: unknown): blob is Blob {
  return blob instanceof Blob && blob.size > 0;
}

// Función para sincronizar un registro pendiente con reintentos automáticos
export async function syncRecord(record: {
  id?: number;
  colonia_id: number;
  numero_poste: string;
  watts: number;
  latitud: number;
  longitud: number;
  imagen: Blob;
  imagen_watts: Blob;
  imagen_fotocelda: Blob;
  fotocelda_nueva: boolean;
}, retryCount: number = 0): Promise<boolean> {
  // Verificar si el registro ya está sincronizado antes de proceder
  if (record.id) {
    const alreadySynced = await isRecordSynced(record.id);
    if (alreadySynced) {
      console.log(`⏭️ Registro ${record.id} ya está sincronizado, saltando...`);
      return true;
    }
  }

  try {
    // Validar que las imágenes existan y sean válidas
    if (!isValidBlob(record.imagen)) {
      console.error(`❌ Registro ${record.id}: Imagen de luminaria inválida o faltante`);
      throw new Error('Imagen de luminaria inválida');
    }
    if (!isValidBlob(record.imagen_watts)) {
      console.error(`❌ Registro ${record.id}: Imagen de watts inválida o faltante`);
      throw new Error('Imagen de watts inválida');
    }
    if (!isValidBlob(record.imagen_fotocelda)) {
      console.error(`❌ Registro ${record.id}: Imagen de fotocelda inválida o faltante`);
      throw new Error('Imagen de fotocelda inválida');
    }

    // Convertir Blobs a Files
    const imageFile = blobToFile(record.imagen, `luminaria-${record.numero_poste}-${Date.now()}.jpg`);
    const imageWattsFile = blobToFile(record.imagen_watts, `watts-${record.numero_poste}-${Date.now()}.jpg`);
    const imageFotoceldaFile = blobToFile(record.imagen_fotocelda, `fotocelda-${record.numero_poste}-${Date.now()}.jpg`);

    console.log(`📤 Subiendo imágenes para registro ${record.id}...`);

    // Paso 1: Subir las 3 imágenes
    const uploadPromises = [
      fetch('/api/upload', {
        method: 'POST',
        body: (() => {
          const fd = new FormData();
          fd.append('file', imageFile);
          return fd;
        })(),
      }),
      fetch('/api/upload', {
        method: 'POST',
        body: (() => {
          const fd = new FormData();
          fd.append('file', imageWattsFile);
          return fd;
        })(),
      }),
      fetch('/api/upload', {
        method: 'POST',
        body: (() => {
          const fd = new FormData();
          fd.append('file', imageFotoceldaFile);
          return fd;
        })(),
      }),
    ];

    const uploadResponses = await Promise.all(uploadPromises);

    // Verificar que todas las subidas fueron exitosas
    for (let i = 0; i < uploadResponses.length; i++) {
      const response = uploadResponses[i];
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Sin detalles');
        console.error(`❌ Error subiendo imagen ${i + 1}:`, response.status, errorText);
        throw new Error(`Error al subir imagen ${i + 1}: ${response.status}`);
      }
    }

    const [uploadResult1, uploadResult2, uploadResult3] = await Promise.all(
      uploadResponses.map((r) => r.json())
    );

    console.log(`✅ Imágenes subidas exitosamente para registro ${record.id}`);

    // Paso 2: Crear la luminaria
    const payload = {
      colonia_id: record.colonia_id,
      numero_poste: record.numero_poste,
      watts: record.watts,
      latitud: record.latitud,
      longitud: record.longitud,
      imagen_url: uploadResult1.publicUrl,
      imagen_watts_url: uploadResult2.publicUrl,
      imagen_fotocelda_url: uploadResult3.publicUrl,
      fotocelda_nueva: record.fotocelda_nueva,
    };

    console.log(`📝 Creando luminaria para registro ${record.id}...`);

    const response = await fetch('/api/luminarias', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Sin detalles');
      console.error(`❌ Error creando luminaria:`, response.status, errorText);
      throw new Error(`Error al crear la luminaria: ${response.status}`);
    }

    // Marcar como sincronizado (pero NO eliminar para mantener historial)
    if (record.id) {
      await markAsSynced(record.id);
      console.log(`✅ Registro ${record.id} marcado como sincronizado exitosamente`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Error sincronizando registro ${record.id}:`, error);
    
    // Si aún quedan reintentos y el error es recuperable (no es de datos corruptos)
    const errorMessage = error instanceof Error ? error.message : '';
    const isDataCorruptionError = errorMessage.includes('inválida') || errorMessage.includes('faltante');
    
    if (retryCount < MAX_RETRIES && !isDataCorruptionError) {
      console.log(`🔄 Reintentando registro ${record.id} (intento ${retryCount + 1}/${MAX_RETRIES})...`);
      await delay(RETRY_DELAY * (retryCount + 1)); // Incrementar delay en cada reintento
      return syncRecord(record, retryCount + 1);
    }
    
    throw error;
  }
}

// Función para sincronizar todos los registros pendientes con reintentos automáticos
export async function syncAllPendingRecords(): Promise<{
  success: number;
  failed: number;
  skipped: number;
}> {
  // Evitar sincronizaciones concurrentes
  if (isSyncing) {
    console.log('⚠️ Ya hay una sincronización en proceso, saltando...');
    return { success: 0, failed: 0, skipped: 0 };
  }

  isSyncing = true;

  try {
    const pendingRecords = await getPendingRecords();
    
    if (pendingRecords.length === 0) {
      console.log('✅ No hay registros pendientes para sincronizar');
      return { success: 0, failed: 0, skipped: 0 };
    }

    console.log(`🔄 Iniciando sincronización de ${pendingRecords.length} registros pendientes...`);

    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    // Procesar registros uno por uno para evitar sobrecarga
    for (const record of pendingRecords) {
      try {
        // Verificación doble: comprobar si ya está sincronizado
        if (record.id) {
          const alreadySynced = await isRecordSynced(record.id);
          if (alreadySynced) {
            console.log(`⏭️ Registro ${record.id} ya sincronizado, saltando...`);
            skippedCount++;
            continue;
          }
        }

        // Verificar que el registro tenga datos válidos antes de intentar
        const hasValidImages = 
          record.imagen instanceof Blob && record.imagen.size > 0 &&
          record.imagen_watts instanceof Blob && record.imagen_watts.size > 0 &&
          record.imagen_fotocelda instanceof Blob && record.imagen_fotocelda.size > 0;

        if (!hasValidImages) {
          console.warn(`⚠️ Registro ${record.id} tiene imágenes inválidas o faltantes, saltando...`);
          failedCount++;
          continue;
        }

        console.log(`🔄 Procesando registro ${record.id}: Poste ${record.numero_poste}`);
        
        // syncRecord ya tiene reintentos internos
        await syncRecord(record);
        successCount++;
        console.log(`✅ Registro ${record.id} (Poste: ${record.numero_poste}) sincronizado exitosamente`);
        
        // Pequeña pausa entre registros para no sobrecargar el servidor
        await delay(500);
        
      } catch (error) {
        failedCount++;
        console.error(`❌ Error sincronizando registro ${record.id} (Poste: ${record.numero_poste}):`, error);
        if (error instanceof Error) {
          console.error(`Detalles: ${error.message}`);
        }
        // Continuar con el siguiente registro en lugar de detener todo
      }
    }

    console.log(`📊 Sincronización completada: ${successCount} éxito, ${failedCount} fallos, ${skippedCount} saltados`);
    
    return { success: successCount, failed: failedCount, skipped: skippedCount };
  } finally {
    isSyncing = false;
  }
}

// Hook para auto-sincronización cuando se detecta conexión
// Ahora con reintentos automáticos más agresivos
export function useAutoSync(isOnline: boolean) {
  const syncPending = async () => {
    if (!isOnline) return;

    try {
      const count = await getPendingCount();
      if (count > 0) {
        console.log(`🔄 Auto-sincronizando ${count} registros pendientes...`);
        
        const result = await syncAllPendingRecords();
        
        // Si hubo éxitos, notificar al usuario
        if (result.success > 0) {
          console.log(`✅ Auto-sincronización: ${result.success} registros subidos`);
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Sincronización completada', {
              body: `${result.success} registros sincronizados exitosamente`,
              icon: '/icon-192x192.png',
            });
          }
        }
        
        // Si hubo fallos pero también éxitos, es parcialmente exitoso
        if (result.failed > 0 && result.success > 0) {
          console.warn(`⚠️ ${result.failed} registros no pudieron sincronizarse`);
        }
        
        // Si todos fallaron, programar un reintento en 30 segundos
        if (result.failed > 0 && result.success === 0) {
          console.log(`⏰ Programando reintento de sincronización en 30 segundos...`);
          setTimeout(async () => {
            if (navigator.onLine) {
              console.log(`🔄 Reintentando sincronización automática...`);
              await syncAllPendingRecords();
            }
          }, 30000);
        }
      }
    } catch (error) {
      console.error('Error en auto-sincronización:', error);
      // Reintentar en 30 segundos si hay un error general
      setTimeout(async () => {
        if (navigator.onLine) {
          const count = await getPendingCount();
          if (count > 0) {
            console.log(`🔄 Reintentando sincronización después de error...`);
            await syncAllPendingRecords();
          }
        }
      }, 30000);
    }
  };

  return syncPending;
}

// Función de sincronización forzada con reintentos y diagnóstico detallado
export async function forceSyncWithRetry(
  maxRetries: number = 3,
  onProgress?: (message: string, current: number, total: number) => void
): Promise<{
  success: number;
  failed: number;
  errors: Array<{ id: number; poste: string; error: string }>;
}> {
  // Diagnosticar primero
  const diagnosis = await diagnoseRecords();
  console.log('📋 Diagnóstico de registros:', diagnosis);
  
  if (diagnosis.pending === 0) {
    onProgress?.('No hay registros pendientes', 0, 0);
    return { success: 0, failed: 0, errors: [] };
  }
  
  if (diagnosis.corrupted > 0) {
    console.warn(`⚠️ Se detectaron ${diagnosis.corrupted} registros con problemas`);
    onProgress?.(`Detectados ${diagnosis.corrupted} registros con problemas`, 0, diagnosis.pending);
  }
  
  const pendingRecords = await getPendingRecords();
  let successCount = 0;
  let failedCount = 0;
  const errors: Array<{ id: number; poste: string; error: string }> = [];
  
  for (let i = 0; i < pendingRecords.length; i++) {
    const record = pendingRecords[i];
    onProgress?.(`Sincronizando ${record.numero_poste}...`, i + 1, pendingRecords.length);
    
    let lastError = '';
    let synced = false;
    
    // Intentar con reintentos
    for (let attempt = 1; attempt <= maxRetries && !synced; attempt++) {
      try {
        console.log(`🔄 Intento ${attempt}/${maxRetries} para registro ${record.id} (Poste: ${record.numero_poste})`);
        
        // Verificar que el registro tenga todos los datos necesarios
        if (!record.imagen || !(record.imagen instanceof Blob) || record.imagen.size === 0) {
          throw new Error('Imagen de luminaria faltante o corrupta');
        }
        if (!record.imagen_watts || !(record.imagen_watts instanceof Blob) || record.imagen_watts.size === 0) {
          throw new Error('Imagen de watts faltante o corrupta');
        }
        if (!record.imagen_fotocelda || !(record.imagen_fotocelda instanceof Blob) || record.imagen_fotocelda.size === 0) {
          throw new Error('Imagen de fotocelda faltante o corrupta');
        }
        
        await syncRecord(record);
        synced = true;
        successCount++;
        console.log(`✅ Registro ${record.id} sincronizado en intento ${attempt}`);
        
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Error desconocido';
        console.error(`❌ Intento ${attempt} falló para registro ${record.id}:`, lastError);
        
        if (attempt < maxRetries) {
          // Esperar antes del siguiente intento (exponential backoff)
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`⏳ Esperando ${waitTime/1000}s antes del siguiente intento...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    if (!synced) {
      failedCount++;
      errors.push({
        id: record.id || 0,
        poste: record.numero_poste,
        error: lastError,
      });
    }
  }
  
  console.log(`📊 Sincronización forzada completada: ${successCount} éxito, ${failedCount} fallos`);
  
  return { success: successCount, failed: failedCount, errors };
}

// Forzar sincronización de TODOS los registros pendientes (incluso los marcados como sincronizados)
export async function forceSyncAllRecords(
  progressCallback?: (current: number, total: number) => void
): Promise<{ synced: number; failed: number; errors: any[] }> {
  console.log('🚀 Iniciando sincronización forzada de TODOS los registros...');
  
  if (isSyncing) {
    throw new Error('Ya hay una sincronización en progreso');
  }
  
  isSyncing = true;
  
  try {
    // Obtener TODOS los registros (pendientes y sincronizados)
    const allRecords = await getPendingRecords();
    
    if (allRecords.length === 0) {
      console.log('ℹ️ No hay registros para sincronizar');
      return { synced: 0, failed: 0, errors: [] };
    }
    
    console.log(`📊 Encontrados ${allRecords.length} registros para sincronización forzada`);
    
    let syncedCount = 0;
    let failedCount = 0;
    const errors: any[] = [];
    
    // Procesar cada registro
    for (let i = 0; i < allRecords.length; i++) {
      const record = allRecords[i];
      
      // Actualizar progreso
      if (progressCallback) {
        progressCallback(i + 1, allRecords.length);
      }
      
      console.log(`🔄 Procesando registro ${i + 1}/${allRecords.length} (Poste: ${record.numero_poste})`);
      
      try {
        // Resetear estado si está marcado como sincronizado
        if (record.synced && record.id) {
          await resetSyncStatus(record.id);
          record.synced = false;
        }
        
        // Intentar sincronizar
        const success = await syncRecord(record);
        
        if (success) {
          syncedCount++;
          if (record.id) {
            await markAsSynced(record.id);
          }
          console.log(`✅ Registro ${record.id} (Poste: ${record.numero_poste}) sincronizado correctamente`);
        } else {
          throw new Error('La sincronización retornó false');
        }
        
      } catch (error) {
        failedCount++;
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        
        errors.push({
          id: record.id,
          poste: record.numero_poste,
          error: errorMessage,
        });
        
        console.error(`❌ Error sincronizando registro ${record.id} (Poste: ${record.numero_poste}):`, errorMessage);
        
        // Marcar el error en el registro para referencia futura
        if (record.id) {
          try {
            const updatedRecord = await getRecordById(record.id);
            if (updatedRecord) {
              // Actualizar directamente en IndexedDB
              const db = await initDB();
              updatedRecord.lastError = errorMessage;
              updatedRecord.retryCount = (updatedRecord.retryCount || 0) + 1;
              await db.put('pendingLuminarias', updatedRecord);
            }
          } catch (dbError) {
            console.error('Error actualizando registro con error:', dbError);
          }
        }
      }
      
      // Pequeña pausa para no sobrecargar el servidor
      await delay(500);
    }
    
    console.log(`🏁 Sincronización forzada completada: ${syncedCount} exitosos, ${failedCount} fallidos`);
    
    return {
      synced: syncedCount,
      failed: failedCount,
      errors
    };
    
  } finally {
    isSyncing = false;
  }
}

// Sincronizar un registro específico por ID (útil para reintentar uno solo)
export async function syncSingleRecord(recordId: number): Promise<{
  success: boolean;
  error?: string;
}> {
  const record = await getRecordById(recordId);
  
  if (!record) {
    return { success: false, error: 'Registro no encontrado' };
  }
  
  if (record.synced) {
    return { success: false, error: 'El registro ya está sincronizado' };
  }
  
  try {
    await syncRecord(record);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
