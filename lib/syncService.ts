"use client"

import {
  getPendingRecords,
  markAsSynced,
  blobToFile,
  getPendingCount,
  isRecordSynced,
  diagnoseRecords,
  getRecordById,
  resetSyncStatus,
  initDB,
} from './offlineStorage';

// Variable para evitar sincronizaciones concurrentes
let isSyncing = false;

// Resetear el estado al cargar el módulo por seguridad
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    isSyncing = false;
  });
  
  // Resetear después de 30 segundos de estar bloqueado (safety net)
  setInterval(() => {
    if (isSyncing) {
      console.warn('⚠️ Estado de sincronización bloqueado por más de 30s, reseteando automáticamente');
      isSyncing = false;
    }
  }, 30000);
}

// Función para resetear el estado de sincronización (útil en caso de errores)
export function resetSyncState(): void {
  isSyncing = false;
  console.log('🔄 Estado de sincronización reseteado');
}

// Función para verificar el estado de sincronización
export function getSyncState(): boolean {
  return isSyncing;
}

// Configuración para chunking y sincronización
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB por archivo (límite seguro para Vercel)
const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB por chunk
// const MAX_CONCURRENT_UPLOADS = 2; // Máximo 2 uploads concurrentes (reservado para uso futuro)
const RECORDS_PER_BATCH = 3; // Procesar máximo 3 registros por lote

// Función auxiliar para esperar
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Función para comprimir imagen si es muy grande
async function compressImageIfNeeded(blob: Blob, maxSize: number = MAX_FILE_SIZE): Promise<Blob> {
  if (blob.size <= maxSize) {
    return blob;
  }

  console.log(`🗜️ Comprimiendo imagen de ${(blob.size / 1024 / 1024).toFixed(2)}MB a menos de ${(maxSize / 1024 / 1024).toFixed(2)}MB`);
  
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calcular nuevas dimensiones manteniendo aspect ratio
      let { width, height } = img;
      const aspectRatio = width / height;
      
      // Reducir dimensiones si la imagen es muy grande
      const maxDimension = 1920; // Full HD máximo
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          width = maxDimension;
          height = width / aspectRatio;
        } else {
          height = maxDimension;
          width = height * aspectRatio;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convertir a blob con compresión
      canvas.toBlob(
        (compressedBlob) => {
          if (compressedBlob && compressedBlob.size < blob.size) {
            console.log(`✅ Imagen comprimida: ${(blob.size / 1024 / 1024).toFixed(2)}MB → ${(compressedBlob.size / 1024 / 1024).toFixed(2)}MB`);
            resolve(compressedBlob);
          } else {
            console.log(`⚠️ No se pudo comprimir, usando imagen original`);
            resolve(blob);
          }
        },
        'image/jpeg',
        0.8 // 80% calidad
      );
    };
    
    img.onerror = () => resolve(blob);
    img.src = URL.createObjectURL(blob);
  });
}

// Función para subir archivo con reintentos y control de tamaño
async function uploadFileWithRetry(
  file: File, 
  retryCount: number = 0
): Promise<{ publicUrl: string }> {
  try {
    // Verificar tamaño antes de subir
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`Archivo demasiado grande: ${(file.size / 1024 / 1024).toFixed(2)}MB > ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(2)}MB`);
    }

    console.log(`📤 Subiendo archivo: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Sin detalles');
      
      // Si es error 413 (Payload Too Large), la imagen es muy grande
      if (response.status === 413) {
        throw new Error(`Archivo demasiado grande para el servidor: ${file.name}`);
      }
      
      throw new Error(`Error ${response.status} subiendo ${file.name}: ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ Archivo subido exitosamente: ${file.name}`);
    return result;

  } catch (error) {
    console.error(`❌ Error subiendo archivo ${file.name}:`, error);
    
    if (retryCount < MAX_RETRIES) {
      console.log(`🔄 Reintentando subida de ${file.name} (intento ${retryCount + 1}/${MAX_RETRIES})`);
      await delay(RETRY_DELAY * (retryCount + 1));
      return uploadFileWithRetry(file, retryCount + 1);
    }
    
    throw error;
  }
}

// Función para dividir archivos muy grandes en chunks
async function uploadLargeFileInChunks(
  file: File,
  chunkSize: number = CHUNK_SIZE
): Promise<{ publicUrl: string }> {
  const totalChunks = Math.ceil(file.size / chunkSize);
  
  if (totalChunks === 1) {
    // Si no necesita chunking, usar método normal
    return uploadFileWithRetry(file);
  }

  console.log(`📦 Archivo grande detectado: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
  console.log(`🔪 Dividiendo en ${totalChunks} chunks de ${(chunkSize / 1024 / 1024).toFixed(2)}MB`);

  const uploadId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const uploadedChunks: string[] = [];

  // Subir cada chunk
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    
    const chunkFile = new File(
      [chunk], 
      `${file.name}.chunk.${chunkIndex}.${uploadId}`,
      { type: file.type }
    );

    console.log(`📤 Subiendo chunk ${chunkIndex + 1}/${totalChunks} (${(chunk.size / 1024 / 1024).toFixed(2)}MB)`);

    try {
      const result = await uploadFileWithRetry(chunkFile);
      uploadedChunks.push(result.publicUrl);
      
      // Pausa pequeña entre chunks
      await delay(500);
      
    } catch (error) {
      console.error(`❌ Error subiendo chunk ${chunkIndex + 1}:`, error);
      throw new Error(`Error en chunk ${chunkIndex + 1}/${totalChunks}: ${error}`);
    }
  }

  // Una vez subidos todos los chunks, enviar info al servidor para reconstruir
  try {
    console.log(`🔧 Reconstruyendo archivo desde ${totalChunks} chunks...`);
    
    const reconstructResponse = await fetch('/api/upload/reconstruct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploadId,
        fileName: file.name,
        chunks: uploadedChunks,
        totalChunks,
        fileSize: file.size,
        mimeType: file.type
      })
    });

    if (!reconstructResponse.ok) {
      throw new Error(`Error reconstruyendo archivo: ${reconstructResponse.status}`);
    }

    const result = await reconstructResponse.json();
    console.log(`✅ Archivo reconstruido exitosamente: ${file.name}`);
    
    return result;

  } catch (error) {
    console.error(`❌ Error reconstruyendo archivo:`, error);
    throw error;
  }
}

// Función inteligente que decide si usar chunking o no
async function smartUploadFile(file: File): Promise<{ publicUrl: string }> {
  console.log(`🔍 Analizando archivo: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

  // Si el archivo es menor al límite, usar método normal
  if (file.size <= MAX_FILE_SIZE) {
    console.log(`✅ Archivo dentro del límite, subida normal`);
    return uploadFileWithRetry(file);
  }

  // Si es muy grande pero menos de 3x el límite, intentar compresión primero
  if (file.size <= MAX_FILE_SIZE * 3 && file.type.startsWith('image/')) {
    console.log(`🗜️ Intentando compresión antes de chunking...`);
    
    try {
      const compressedBlob = await compressImageIfNeeded(file, MAX_FILE_SIZE * 0.8); // 80% del límite para margen
      
      if (compressedBlob.size < file.size) {
        const compressedFile = new File([compressedBlob], file.name, { type: file.type });
        console.log(`✅ Compresión exitosa: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
        return uploadFileWithRetry(compressedFile);
      }
    } catch (compressionError) {
      console.warn(`⚠️ Compresión falló, usando chunking:`, compressionError);
    }
  }

  // Si todo lo demás falla, usar chunking
  console.log(`📦 Archivo demasiado grande, usando chunking...`);
  return uploadLargeFileInChunks(file);
}

// Función para verificar si un Blob es válido
function isValidBlob(blob: unknown): blob is Blob {
  return blob instanceof Blob && blob.size > 0;
}

// Función para sincronizar un registro pendiente con reintentos automáticos y chunking
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

    console.log(`📤 Preparando imágenes para registro ${record.id} (Poste: ${record.numero_poste})`);
    
    // Comprimir imágenes si son muy grandes
    const compressedImagen = await compressImageIfNeeded(record.imagen);
    const compressedImagenWatts = await compressImageIfNeeded(record.imagen_watts);
    const compressedImagenFotocelda = await compressImageIfNeeded(record.imagen_fotocelda);

    // Convertir Blobs comprimidos a Files
    const imageFile = blobToFile(compressedImagen, `luminaria-${record.numero_poste}-${Date.now()}.jpg`);
    const imageWattsFile = blobToFile(compressedImagenWatts, `watts-${record.numero_poste}-${Date.now()}.jpg`);
    const imageFotoceldaFile = blobToFile(compressedImagenFotocelda, `fotocelda-${record.numero_poste}-${Date.now()}.jpg`);

    console.log(`📤 Subiendo imágenes para registro ${record.id} con sistema inteligente...`);

    // SISTEMA INTELIGENTE: Usar subida inteligente que decide automáticamente
    // entre compresión, chunking o subida normal según el tamaño
    
    console.log(`📤 [1/3] Procesando imagen de luminaria...`);
    const uploadResult1 = await smartUploadFile(imageFile);
    
    // Pausa pequeña entre subidas para no sobrecargar
    await delay(800);
    
    console.log(`📤 [2/3] Procesando imagen de watts...`);
    const uploadResult2 = await smartUploadFile(imageWattsFile);
    
    await delay(800);
    
    console.log(`📤 [3/3] Procesando imagen de fotocelda...`);
    const uploadResult3 = await smartUploadFile(imageFotoceldaFile);

    console.log(`✅ Las 3 imágenes procesadas y subidas exitosamente para registro ${record.id}`);

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

// Función para sincronizar todos los registros pendientes con control de lotes (batches)
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

    console.log(`🔄 Iniciando sincronización inteligente de ${pendingRecords.length} registros en lotes de ${RECORDS_PER_BATCH}...`);

    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    // Filtrar registros válidos primero
    const validRecords = [];
    for (const record of pendingRecords) {
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

      validRecords.push(record);
    }

    if (validRecords.length === 0) {
      console.log('✅ No hay registros válidos para sincronizar');
      return { success: successCount, failed: failedCount, skipped: skippedCount };
    }

    // Procesar en lotes pequeños para evitar sobrecarga
    console.log(`📦 Procesando ${validRecords.length} registros válidos en lotes de ${RECORDS_PER_BATCH}`);
    
    for (let i = 0; i < validRecords.length; i += RECORDS_PER_BATCH) {
      const batch = validRecords.slice(i, i + RECORDS_PER_BATCH);
      const batchNumber = Math.floor(i / RECORDS_PER_BATCH) + 1;
      const totalBatches = Math.ceil(validRecords.length / RECORDS_PER_BATCH);
      
      console.log(`📦 Procesando lote ${batchNumber}/${totalBatches} (${batch.length} registros)`);
      
      // Procesar cada registro del lote secuencialmente
      for (const record of batch) {
        try {
          console.log(`🔄 [Lote ${batchNumber}] Procesando registro ${record.id}: Poste ${record.numero_poste}`);
          
          // syncRecord ya tiene reintentos internos y compresión de imágenes
          await syncRecord(record);
          successCount++;
          console.log(`✅ [Lote ${batchNumber}] Registro ${record.id} (Poste: ${record.numero_poste}) sincronizado exitosamente`);
          
          // Pequeña pausa entre registros dentro del lote
          await delay(1000);
          
        } catch (error) {
          failedCount++;
          console.error(`❌ [Lote ${batchNumber}] Error sincronizando registro ${record.id} (Poste: ${record.numero_poste}):`, error);
          if (error instanceof Error) {
            console.error(`Detalles: ${error.message}`);
          }
          // Continuar con el siguiente registro en lugar de detener todo
        }
      }
      
      // Pausa más larga entre lotes para dar respiro al servidor
      if (i + RECORDS_PER_BATCH < validRecords.length) {
        console.log(`⏳ Pausa entre lotes... (${successCount + failedCount}/${validRecords.length} procesados)`);
        await delay(3000); // 3 segundos entre lotes
      }
    }

    console.log(`📊 Sincronización por lotes completada: ${successCount} éxito, ${failedCount} fallos, ${skippedCount} saltados`);
    
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
): Promise<{ synced: number; failed: number; errors: Array<{ id: number; poste: string; error: string }> }> {
  console.log('🚀 Iniciando sincronización forzada de TODOS los registros...');
  
  if (isSyncing) {
    console.warn('⚠️ Sincronización ya en progreso, reseteando estado...');
    isSyncing = false; // Resetear el estado si está bloqueado
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
    const errors: Array<{ id: number; poste: string; error: string }> = [];
    
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
          id: record.id || 0,
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

// Función para sincronizar solo datos básicos (sin imágenes) como último recurso
async function syncBasicDataOnly(record: {
  id?: number;
  colonia_id: number;
  numero_poste: string;
  watts: number;
  latitud: number;
  longitud: number;
  fotocelda_nueva: boolean;
  timestamp: number;
}): Promise<boolean> {
  try {
    console.log(`🔄 Sincronizando datos básicos para poste ${record.numero_poste} (sin imágenes)`);
    
    const response = await fetch('/api/luminarias', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        colonia_id: record.colonia_id,
        numero_poste: record.numero_poste,
        watts: record.watts,
        latitud: record.latitud,
        longitud: record.longitud,
        fotocelda_nueva: record.fotocelda_nueva,
        observaciones: 'Registro subido sin imágenes - imágenes corruptas o faltantes',
        fecha_instalacion: new Date(record.timestamp).toISOString().split('T')[0],
        // No incluimos imágenes
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ Datos básicos sincronizados para poste ${record.numero_poste}:`, result);
    return true;
    
  } catch (error) {
    console.error(`❌ Error sincronizando datos básicos para poste ${record.numero_poste}:`, error);
    throw error;
  }
}

// Función de auto-recovery que se ejecuta automáticamente
export async function autoRecoverySync(): Promise<{
  recovered: boolean;
  synced: number;
  basicDataOnly: number;
  failed: number;
}> {
  console.log('🔧 Iniciando auto-recovery del sistema de sincronización...');
  
  // 1. Resetear cualquier estado bloqueado
  if (isSyncing) {
    console.log('🔄 Reseteando estado de sincronización bloqueado...');
    isSyncing = false;
  }
  
  let totalSynced = 0;
  let totalBasicOnly = 0;
  let totalFailed = 0;
  
  try {
    // 2. Obtener registros pendientes
    const pendingRecords = await getPendingRecords();
    const unsyncedRecords = pendingRecords.filter(r => !r.synced);
    
    if (unsyncedRecords.length === 0) {
      console.log('✅ No hay registros pendientes para recuperar');
      return { recovered: true, synced: 0, basicDataOnly: 0, failed: 0 };
    }
    
    console.log(`🔍 Encontrados ${unsyncedRecords.length} registros para auto-recovery`);
    
    // 3. Procesar cada registro con estrategia inteligente
    for (const record of unsyncedRecords) {
      try {
        // Estrategia 1: Intentar sincronización completa (con imágenes)
        const hasValidImages = 
          record.imagen instanceof Blob && record.imagen.size > 0 &&
          record.imagen_watts instanceof Blob && record.imagen_watts.size > 0 &&
          record.imagen_fotocelda instanceof Blob && record.imagen_fotocelda.size > 0;
        
        if (hasValidImages) {
          try {
            await syncRecord(record);
            totalSynced++;
            console.log(`✅ Recovery completo para poste ${record.numero_poste}`);
            continue;
          } catch {
            console.warn(`⚠️ Falló sync completo para poste ${record.numero_poste}, intentando datos básicos...`);
          }
        }
        
        // Estrategia 2: Sincronizar solo datos básicos (sin imágenes)
        try {
          await syncBasicDataOnly(record);
          
          // Marcar como sincronizado pero anotar que fue solo datos básicos
          if (record.id) {
            await markAsSynced(record.id);
            const db = await initDB();
            const updatedRecord = await getRecordById(record.id);
            if (updatedRecord) {
              updatedRecord.lastError = 'Sincronizado sin imágenes - imágenes corruptas o faltantes';
              await db.put('pendingLuminarias', updatedRecord);
            }
          }
          
          totalBasicOnly++;
          console.log(`📝 Recovery de datos básicos para poste ${record.numero_poste}`);
          
        } catch (error) {
          // Estrategia 3: Marcar error pero no bloquear el sistema
          totalFailed++;
          console.error(`❌ Falló recovery completo para poste ${record.numero_poste}:`, error);
          
          if (record.id) {
            try {
              const db = await initDB();
              const updatedRecord = await getRecordById(record.id);
              if (updatedRecord) {
                updatedRecord.lastError = `Auto-recovery falló: ${error instanceof Error ? error.message : 'Error desconocido'}`;
                updatedRecord.retryCount = (updatedRecord.retryCount || 0) + 1;
                await db.put('pendingLuminarias', updatedRecord);
              }
            } catch (dbError) {
              console.error('Error actualizando registro con fallo de recovery:', dbError);
            }
          }
        }
        
        // Pausa pequeña para no sobrecargar
        await delay(300);
        
      } catch (error) {
        totalFailed++;
        console.error(`❌ Error general en auto-recovery para registro ${record.id}:`, error);
      }
    }
    
    console.log(`🏁 Auto-recovery completado: ${totalSynced} completos, ${totalBasicOnly} solo datos, ${totalFailed} fallidos`);
    
    return {
      recovered: true,
      synced: totalSynced,
      basicDataOnly: totalBasicOnly,
      failed: totalFailed
    };
    
  } catch (error) {
    console.error('❌ Error en auto-recovery:', error);
    return { recovered: false, synced: totalSynced, basicDataOnly: totalBasicOnly, failed: totalFailed };
  }
}

// Función de sincronización inteligente con chunking automático
export async function smartSync(
  onProgress?: (current: number, total: number, status: string) => void
): Promise<{
  success: number;
  failed: number;
  skipped: number;
  totalProcessed: number;
  strategy: string;
}> {
  if (isSyncing) {
    console.log('⚠️ Ya hay una sincronización en proceso, saltando...');
    return { success: 0, failed: 0, skipped: 0, totalProcessed: 0, strategy: 'skipped' };
  }

  isSyncing = true;

  try {
    const pendingRecords = await getPendingRecords();
    const unsyncedRecords = pendingRecords.filter(r => !r.synced);
    
    if (unsyncedRecords.length === 0) {
      onProgress?.(0, 0, 'No hay registros pendientes');
      return { success: 0, failed: 0, skipped: 0, totalProcessed: 0, strategy: 'no-records' };
    }

    // Analizar el tamaño total de los datos para decidir estrategia
    let totalSize = 0;
    let largeFilesCount = 0;
    
    for (const record of unsyncedRecords) {
      const recordSize = (record.imagen?.size || 0) + 
                        (record.imagen_watts?.size || 0) + 
                        (record.imagen_fotocelda?.size || 0);
      totalSize += recordSize;
      
      if (recordSize > MAX_FILE_SIZE * 2) { // Si las 3 imágenes juntas > 8MB
        largeFilesCount++;
      }
    }

    // Decidir estrategia basada en el análisis
    let strategy = 'standard';
    let batchSize = RECORDS_PER_BATCH;
    let delayBetweenRecords = 1000;
    let delayBetweenBatches = 3000;

    if (totalSize > 50 * 1024 * 1024) { // > 50MB total
      strategy = 'ultra-conservative';
      batchSize = 1;
      delayBetweenRecords = 3000;
      delayBetweenBatches = 5000;
    } else if (largeFilesCount > 5) { // Muchos archivos grandes
      strategy = 'conservative';
      batchSize = 2;
      delayBetweenRecords = 2000;
      delayBetweenBatches = 4000;
    } else if (unsyncedRecords.length > 20) { // Muchos registros
      strategy = 'batch-optimized';
      batchSize = 5;
      delayBetweenRecords = 800;
      delayBetweenBatches = 2000;
    }

    console.log(`🧠 Estrategia inteligente: ${strategy}`);
    console.log(`📊 Análisis: ${unsyncedRecords.length} registros, ${(totalSize / 1024 / 1024).toFixed(2)}MB total, ${largeFilesCount} archivos grandes`);
    console.log(`⚙️ Configuración: Lotes de ${batchSize}, pausa ${delayBetweenRecords}ms entre registros, ${delayBetweenBatches}ms entre lotes`);

    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    // Validar registros primero
    const validRecords = [];
    for (const record of unsyncedRecords) {
      const hasValidImages = 
        record.imagen instanceof Blob && record.imagen.size > 0 &&
        record.imagen_watts instanceof Blob && record.imagen_watts.size > 0 &&
        record.imagen_fotocelda instanceof Blob && record.imagen_fotocelda.size > 0;

      if (!hasValidImages) {
        console.warn(`⚠️ Registro ${record.id} tiene imágenes inválidas, saltando...`);
        skippedCount++;
        continue;
      }

      validRecords.push(record);
    }

    // Procesar en lotes según la estrategia
    for (let i = 0; i < validRecords.length; i += batchSize) {
      const batch = validRecords.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(validRecords.length / batchSize);
      
      onProgress?.(i + 1, validRecords.length, `Procesando lote ${batchNumber}/${totalBatches}`);
      
      for (const record of batch) {
        try {
          onProgress?.(successCount + failedCount + 1, validRecords.length, `Sincronizando poste ${record.numero_poste}`);
          
          await syncRecord(record);
          successCount++;
          
          console.log(`✅ [${strategy}] Registro ${record.id} sincronizado (${successCount}/${validRecords.length})`);
          
          // Pausa entre registros según estrategia
          if (successCount + failedCount < validRecords.length) {
            await delay(delayBetweenRecords);
          }
          
        } catch (error) {
          failedCount++;
          console.error(`❌ [${strategy}] Error en registro ${record.id}:`, error);
        }
      }
      
      // Pausa entre lotes según estrategia
      if (i + batchSize < validRecords.length) {
        onProgress?.(successCount + failedCount, validRecords.length, `Pausa entre lotes...`);
        await delay(delayBetweenBatches);
      }
    }

    const result = {
      success: successCount,
      failed: failedCount,
      skipped: skippedCount,
      totalProcessed: validRecords.length,
      strategy
    };

    console.log(`🏁 Sincronización inteligente completada:`, result);
    onProgress?.(validRecords.length, validRecords.length, `Completado: ${successCount} éxito, ${failedCount} fallos`);
    
    return result;

  } finally {
    isSyncing = false;
  }
}

// Función para obtener estadísticas de sincronización
export async function getSyncStats(): Promise<{
  total: number;
  pending: number;
  synced: number;
  failed: number;
  totalSize: string;
  avgFileSize: string;
  largeFiles: number;
}> {
  const allRecords = await getPendingRecords();
  const pendingCount = allRecords.filter(r => !r.synced).length;
  const syncedCount = allRecords.filter(r => r.synced).length;
  const failedCount = allRecords.filter(r => r.lastError && !r.synced).length;
  
  let totalSize = 0;
  let largeFilesCount = 0;
  
  for (const record of allRecords) {
    const recordSize = (record.imagen?.size || 0) + 
                      (record.imagen_watts?.size || 0) + 
                      (record.imagen_fotocelda?.size || 0);
    totalSize += recordSize;
    
    if (recordSize > MAX_FILE_SIZE * 2) {
      largeFilesCount++;
    }
  }
  
  const avgFileSize = allRecords.length > 0 ? totalSize / allRecords.length : 0;
  
  return {
    total: allRecords.length,
    pending: pendingCount,
    synced: syncedCount,
    failed: failedCount,
    totalSize: `${(totalSize / 1024 / 1024).toFixed(2)}MB`,
    avgFileSize: `${(avgFileSize / 1024 / 1024).toFixed(2)}MB`,
    largeFiles: largeFilesCount
  };
}

// Función de diagnóstico avanzado del sistema
export async function advancedDiagnosis(): Promise<{
  summary: {
    totalRecords: number;
    pendingRecords: number;
    syncedRecords: number;
    errorRecords: number;
    totalSizeMB: number;
    avgSizeMB: number;
  };
  sizeBrackets: {
    small: number;    // < 2MB por registro
    medium: number;   // 2-8MB por registro  
    large: number;    // 8-20MB por registro
    xlarge: number;   // > 20MB por registro
  };
  recommendedStrategy: string;
  estimatedTime: string;
  risks: string[];
  recommendations: string[];
}> {
  const allRecords = await getPendingRecords();
  const unsyncedRecords = allRecords.filter(r => !r.synced);
  
  let totalSize = 0;
  const sizeBrackets = { small: 0, medium: 0, large: 0, xlarge: 0 };
  const risks: string[] = [];
  const recommendations: string[] = [];
  
  // Analizar cada registro
  for (const record of allRecords) {
    const recordSize = (record.imagen?.size || 0) + 
                      (record.imagen_watts?.size || 0) + 
                      (record.imagen_fotocelda?.size || 0);
    totalSize += recordSize;
    
    const sizeInMB = recordSize / (1024 * 1024);
    
    if (sizeInMB < 2) sizeBrackets.small++;
    else if (sizeInMB < 8) sizeBrackets.medium++;
    else if (sizeInMB < 20) sizeBrackets.large++;
    else sizeBrackets.xlarge++;
  }
  
  const avgSize = allRecords.length > 0 ? totalSize / allRecords.length : 0;
  const totalSizeMB = totalSize / (1024 * 1024);
  const avgSizeMB = avgSize / (1024 * 1024);
  
  // Determinar estrategia recomendada
  let recommendedStrategy = 'standard';
  let estimatedTime = '5-10 minutos';
  
  if (sizeBrackets.xlarge > 5) {
    recommendedStrategy = 'chunking-heavy';
    estimatedTime = '20-40 minutos';
    risks.push('Archivos extremadamente grandes detectados');
    recommendations.push('Usar sincronización inteligente con chunking automático');
    recommendations.push('Verificar conexión estable a internet');
  } else if (totalSizeMB > 100) {
    recommendedStrategy = 'batch-conservative';
    estimatedTime = '15-30 minutos';
    risks.push('Volumen total de datos muy alto');
    recommendations.push('Procesar en lotes pequeños');
  } else if (sizeBrackets.large > 10) {
    recommendedStrategy = 'compression-first';
    estimatedTime = '10-20 minutos';
    risks.push('Muchos archivos grandes que pueden beneficiarse de compresión');
    recommendations.push('Aplicar compresión automática');
  } else if (unsyncedRecords.length > 50) {
    recommendedStrategy = 'high-volume';
    estimatedTime = '10-15 minutos';
    recommendations.push('Procesar en lotes para evitar timeouts');
  }
  
  // Riesgos adicionales
  if (totalSizeMB > 200) {
    risks.push('Riesgo alto de timeout en conexiones lentas');
  }
  
  if (sizeBrackets.xlarge > 0) {
    risks.push(`${sizeBrackets.xlarge} archivos requieren chunking especial`);
  }
  
  const errorCount = allRecords.filter(r => r.lastError && !r.synced).length;
  if (errorCount > 0) {
    risks.push(`${errorCount} registros con errores previos`);
    recommendations.push('Revisar y corregir errores antes de sincronizar');
  }
  
  // Recomendaciones generales
  if (avgSizeMB > 5) {
    recommendations.push('Considerar reducir calidad de imágenes para futuras capturas');
  }
  
  if (unsyncedRecords.length > 20) {
    recommendations.push('Sincronizar con mayor frecuencia para evitar acumulación');
  }
  
  recommendations.push('Mantener conexión estable durante todo el proceso');
  recommendations.push('Usar "Sincronización Inteligente" para mejor rendimiento');
  
  return {
    summary: {
      totalRecords: allRecords.length,
      pendingRecords: unsyncedRecords.length,
      syncedRecords: allRecords.filter(r => r.synced).length,
      errorRecords: errorCount,
      totalSizeMB: Math.round(totalSizeMB * 100) / 100,
      avgSizeMB: Math.round(avgSizeMB * 100) / 100,
    },
    sizeBrackets,
    recommendedStrategy,
    estimatedTime,
    risks,
    recommendations
  };
}

// Función para limpiar registros muy antiguos o corruptos
export async function cleanupOldRecords(daysOld: number = 30): Promise<{
  deleted: number;
  errors: string[];
}> {
  console.log(`🧹 Iniciando limpieza de registros anteriores a ${daysOld} días...`);
  
  const allRecords = await getPendingRecords();
  const cutoffDate = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
  
  let deletedCount = 0;
  const errors: string[] = [];
  
  const db = await initDB();
  
  for (const record of allRecords) {
    // Solo eliminar registros muy antiguos que ya estén sincronizados
    if (record.timestamp < cutoffDate && record.synced) {
      try {
        if (record.id) {
          await db.delete('pendingLuminarias', record.id);
          deletedCount++;
          console.log(`🗑️ Eliminado registro antiguo: ${record.numero_poste} (${new Date(record.timestamp).toLocaleDateString()})`);
        }
      } catch (error) {
        const errorMsg = `Error eliminando registro ${record.id}: ${error}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }
    
    // También eliminar registros claramente corruptos (sin imágenes válidas)
    if (!record.synced) {
      const hasValidImages = 
        record.imagen instanceof Blob && record.imagen.size > 0 &&
        record.imagen_watts instanceof Blob && record.imagen_watts.size > 0 &&
        record.imagen_fotocelda instanceof Blob && record.imagen_fotocelda.size > 0;
      
      if (!hasValidImages && record.timestamp < cutoffDate) {
        try {
          if (record.id) {
            await db.delete('pendingLuminarias', record.id);
            deletedCount++;
            console.log(`🗑️ Eliminado registro corrupto: ${record.numero_poste}`);
          }
        } catch (error) {
          const errorMsg = `Error eliminando registro corrupto ${record.id}: ${error}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }
    }
  }
  
  console.log(`✅ Limpieza completada: ${deletedCount} registros eliminados`);
  
  return { deleted: deletedCount, errors };
}
