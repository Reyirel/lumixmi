import { openDB, IDBPDatabase } from 'idb';

// Tipo para los registros pendientes
export type PendingLuminaria = {
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
  timestamp: number;
  synced: boolean;
  hash?: string; // Identificador único basado en los datos
  retryCount?: number; // Número de intentos de sincronización
  lastError?: string; // Último error de sincronización
};

const DB_NAME = 'lumixmi-offline';
const DB_VERSION = 1;

// Inicializar la base de datos
export async function initDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Crear object store para luminarias pendientes
      if (!db.objectStoreNames.contains('pendingLuminarias')) {
        const store = db.createObjectStore('pendingLuminarias', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('by-synced', 'synced');
        store.createIndex('by-timestamp', 'timestamp');
      }
    },
  });
}

// Generar un identificador único para un registro basado en sus datos
function generateRecordHash(data: {
  colonia_id: number;
  numero_poste: string;
  watts: number;
  latitud: number;
  longitud: number;
}): string {
  return `${data.colonia_id}-${data.numero_poste}-${data.watts}-${data.latitud.toFixed(6)}-${data.longitud.toFixed(6)}`;
}

// Verificar si ya existe un registro similar pendiente (para evitar duplicados)
export async function existsSimilarPendingRecord(data: {
  colonia_id: number;
  numero_poste: string;
  watts: number;
  latitud: number;
  longitud: number;
}): Promise<boolean> {
  const db = await initDB();
  const allRecords = await db.getAll('pendingLuminarias');
  const newHash = generateRecordHash(data);
  
  // Buscar si existe un registro con los mismos datos que aún no ha sido sincronizado
  const existingRecord = allRecords.find((record: PendingLuminaria) => {
    const existingHash = generateRecordHash({
      colonia_id: record.colonia_id,
      numero_poste: record.numero_poste,
      watts: record.watts,
      latitud: record.latitud,
      longitud: record.longitud,
    });
    return existingHash === newHash && !record.synced;
  });
  
  return !!existingRecord;
}

// Guardar un registro offline
export async function saveOfflineRecord(data: {
  colonia_id: number;
  numero_poste: string;
  watts: number;
  latitud: number;
  longitud: number;
  imagen: Blob;
  imagen_watts: Blob;
  imagen_fotocelda: Blob;
  fotocelda_nueva: boolean;
}) {
  const db = await initDB();
  
  // Verificar si ya existe un registro similar pendiente
  const exists = await existsSimilarPendingRecord(data);
  if (exists) {
    console.log('⚠️ Ya existe un registro similar pendiente, no se guardará duplicado');
    return null;
  }
  
  const record = {
    ...data,
    timestamp: Date.now(),
    synced: false,
    hash: generateRecordHash(data), // Añadir hash para identificación única
  };
  
  const id = await db.add('pendingLuminarias', record);
  console.log('✅ Registro guardado offline con ID:', id);
  return id;
}

// Obtener todos los registros pendientes (no sincronizados)
export async function getPendingRecords(): Promise<PendingLuminaria[]> {
  const db = await initDB();
  const allRecords = await db.getAll('pendingLuminarias');
  // Filtrar solo registros que NO están sincronizados (synced === false o undefined)
  const pendingRecords = allRecords.filter((record: PendingLuminaria) => record.synced !== true);
  console.log(`📊 Total de registros en DB: ${allRecords.length}, Pendientes: ${pendingRecords.length}`);
  return pendingRecords;
}

// Verificar si un registro específico ya está sincronizado
export async function isRecordSynced(id: number): Promise<boolean> {
  const db = await initDB();
  const record = await db.get('pendingLuminarias', id);
  return record ? record.synced === true : false;
}

// Marcar un registro como sincronizado
export async function markAsSynced(id: number) {
  const db = await initDB();
  const tx = db.transaction('pendingLuminarias', 'readwrite');
  const record = await tx.store.get(id);
  
  if (record) {
    record.synced = true;
    await tx.store.put(record);
    await tx.done;
    console.log('✅ Registro marcado como sincronizado:', id);
  } else {
    console.warn('⚠️ No se encontró el registro con ID:', id);
  }
}

// Eliminar un registro
export async function deleteRecord(id: number) {
  const db = await initDB();
  await db.delete('pendingLuminarias', id);
  console.log('🗑️ Registro eliminado:', id);
}

// Obtener el conteo de registros pendientes
export async function getPendingCount(): Promise<number> {
  const db = await initDB();
  const allRecords = await db.getAll('pendingLuminarias');
  const pendingRecords = allRecords.filter((record: PendingLuminaria) => !record.synced);
  return pendingRecords.length;
}

// Limpiar registros sincronizados antiguos (más de 7 días)
export async function cleanupSyncedRecords() {
  const db = await initDB();
  const allRecords = await db.getAll('pendingLuminarias');
  const syncedRecords = allRecords.filter((record: PendingLuminaria) => record.synced);
  
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  
  for (const record of syncedRecords) {
    if (record.timestamp < sevenDaysAgo && record.id) {
      await db.delete('pendingLuminarias', record.id);
    }
  }
  
  console.log('🧹 Registros antiguos limpiados');
}

// Convertir File a Blob (útil para almacenar imágenes)
export function fileToBlob(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const blob = new Blob([reader.result as ArrayBuffer], { type: file.type });
      resolve(blob);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// Convertir Blob a File (útil para enviar datos)
export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type });
}

// Obtener todos los registros (sincronizados y no sincronizados) - útil para debugging
export async function getAllRecords(): Promise<PendingLuminaria[]> {
  const db = await initDB();
  const allRecords = await db.getAll('pendingLuminarias');
  console.log(`📊 Total de registros almacenados: ${allRecords.length}`);
  return allRecords;
}

// Obtener estadísticas de registros
export async function getRecordStats() {
  const db = await initDB();
  const allRecords = await db.getAll('pendingLuminarias');
  const pending = allRecords.filter((r: PendingLuminaria) => !r.synced).length;
  const synced = allRecords.filter((r: PendingLuminaria) => r.synced).length;
  
  return {
    total: allRecords.length,
    pending,
    synced
  };
}

// Diagnóstico de registros pendientes - detecta problemas con datos antiguos
export async function diagnoseRecords(): Promise<{
  total: number;
  pending: number;
  healthy: number;
  corrupted: number;
  details: Array<{
    id: number;
    poste: string;
    timestamp: number;
    dateFormatted: string;
    hasImages: boolean;
    hasCoords: boolean;
    hasColonia: boolean;
    issues: string[];
  }>;
}> {
  const db = await initDB();
  const allRecords = await db.getAll('pendingLuminarias');
  const pendingRecords = allRecords.filter((r: PendingLuminaria) => !r.synced);
  
  let healthy = 0;
  let corrupted = 0;
  const details: Array<{
    id: number;
    poste: string;
    timestamp: number;
    dateFormatted: string;
    hasImages: boolean;
    hasCoords: boolean;
    hasColonia: boolean;
    issues: string[];
  }> = [];
  
  for (const record of pendingRecords) {
    const issues: string[] = [];
    
    // Verificar imágenes
    const hasImagen = record.imagen instanceof Blob && record.imagen.size > 0;
    const hasImagenWatts = record.imagen_watts instanceof Blob && record.imagen_watts.size > 0;
    const hasImagenFotocelda = record.imagen_fotocelda instanceof Blob && record.imagen_fotocelda.size > 0;
    const hasImages = hasImagen && hasImagenWatts && hasImagenFotocelda;
    
    if (!hasImagen) issues.push('Falta imagen de luminaria');
    if (!hasImagenWatts) issues.push('Falta imagen de watts');
    if (!hasImagenFotocelda) issues.push('Falta imagen de fotocelda');
    
    // Verificar coordenadas
    const hasCoords = typeof record.latitud === 'number' && typeof record.longitud === 'number' &&
                      !isNaN(record.latitud) && !isNaN(record.longitud) &&
                      record.latitud !== 0 && record.longitud !== 0;
    if (!hasCoords) issues.push('Coordenadas inválidas o faltantes');
    
    // Verificar colonia
    const hasColonia = typeof record.colonia_id === 'number' && record.colonia_id > 0;
    if (!hasColonia) issues.push('Colonia no especificada');
    
    // Verificar número de poste
    if (!record.numero_poste || record.numero_poste.trim() === '') {
      issues.push('Número de poste vacío');
    }
    
    // Verificar watts
    if (typeof record.watts !== 'number' || record.watts <= 0) {
      issues.push('Watts inválidos');
    }
    
    if (issues.length === 0) {
      healthy++;
    } else {
      corrupted++;
    }
    
    details.push({
      id: record.id || 0,
      poste: record.numero_poste || 'Sin número',
      timestamp: record.timestamp || 0,
      dateFormatted: record.timestamp 
        ? new Date(record.timestamp).toLocaleString('es-MX') 
        : 'Fecha desconocida',
      hasImages,
      hasCoords,
      hasColonia,
      issues,
    });
  }
  
  return {
    total: allRecords.length,
    pending: pendingRecords.length,
    healthy,
    corrupted,
    details,
  };
}

// Obtener un registro específico por ID
export async function getRecordById(id: number): Promise<PendingLuminaria | undefined> {
  const db = await initDB();
  return await db.get('pendingLuminarias', id);
}

// Resetear el estado de sincronización de un registro (para reintentar)
export async function resetSyncStatus(id: number): Promise<boolean> {
  const db = await initDB();
  const tx = db.transaction('pendingLuminarias', 'readwrite');
  const record = await tx.store.get(id);
  
  if (record) {
    record.synced = false;
    await tx.store.put(record);
    await tx.done;
    console.log('🔄 Estado de sincronización reseteado para registro:', id);
    return true;
  }
  return false;
}

// Resetear TODOS los registros marcados como sincronizados (útil si hubo errores)
export async function resetAllSyncedRecords(): Promise<number> {
  const db = await initDB();
  const allRecords = await db.getAll('pendingLuminarias');
  const syncedRecords = allRecords.filter((r: PendingLuminaria) => r.synced);
  
  let count = 0;
  for (const record of syncedRecords) {
    if (record.id) {
      record.synced = false;
      await db.put('pendingLuminarias', record);
      count++;
    }
  }
  
  console.log(`🔄 ${count} registros reseteados para re-sincronización`);
  return count;
}

// Exportar registros pendientes como JSON (para backup/debugging)
export async function exportPendingRecordsAsJSON(): Promise<string> {
  const pendingRecords = await getPendingRecords();
  
  const exportData = pendingRecords.map(record => ({
    id: record.id,
    colonia_id: record.colonia_id,
    numero_poste: record.numero_poste,
    watts: record.watts,
    latitud: record.latitud,
    longitud: record.longitud,
    fotocelda_nueva: record.fotocelda_nueva,
    timestamp: record.timestamp,
    dateFormatted: new Date(record.timestamp).toLocaleString('es-MX'),
    synced: record.synced,
    // Las imágenes se indican como presentes pero no se exportan en JSON
    imagen_size: record.imagen?.size || 0,
    imagen_watts_size: record.imagen_watts?.size || 0,
    imagen_fotocelda_size: record.imagen_fotocelda?.size || 0,
  }));
  
  return JSON.stringify(exportData, null, 2);
}

// Limpiar TODOS los datos (PELIGROSO - usar con precaución)
export async function clearAllData(): Promise<void> {
  const db = await initDB();
  await db.clear('pendingLuminarias');
  console.log('🗑️ Todos los datos offline han sido eliminados');
}

// Exportar datos pendientes para backup
export async function exportPendingData(): Promise<{
  version: string;
  timestamp: number;
  count: number;
  records: unknown[];
}> {
  const db = await initDB();
  const allRecords = await db.getAll('pendingLuminarias');
  
  // Convertir blobs a base64 para poder exportar
  const exportRecords = await Promise.all(allRecords.map(async record => {
    try {
      return {
        ...record,
        imagen_base64: await blobToBase64(record.imagen),
        imagen_watts_base64: await blobToBase64(record.imagen_watts),
        imagen_fotocelda_base64: await blobToBase64(record.imagen_fotocelda),
        // Remover blobs originales del export
        imagen: undefined,
        imagen_watts: undefined,
        imagen_fotocelda: undefined,
      };
    } catch (error) {
      console.error('Error convirtiendo registro para export:', record.id, error);
      return {
        ...record,
        imagen_base64: null,
        imagen_watts_base64: null,
        imagen_fotocelda_base64: null,
        imagen: undefined,
        imagen_watts: undefined,
        imagen_fotocelda: undefined,
        export_error: error instanceof Error ? error.message : String(error),
      };
    }
  }));
  
  return {
    version: '1.0',
    timestamp: Date.now(),
    count: exportRecords.length,
    records: exportRecords
  };
}

// Importar datos desde backup
export async function importPendingData(data: {
  version?: string;
  timestamp?: number;
  count?: number;
  records: unknown[];
}): Promise<void> {
  if (!data || !data.records || !Array.isArray(data.records)) {
    throw new Error('Formato de datos inválido');
  }
  
  const db = await initDB();
  let importedCount = 0;
  let errorCount = 0;
  
  for (const record of data.records) {
    try {
      const recordData = record as Record<string, unknown>;
      
      // Convertir base64 de vuelta a blobs
      const importRecord: PendingLuminaria = {
        colonia_id: recordData.colonia_id as number,
        numero_poste: recordData.numero_poste as string,
        watts: recordData.watts as number,
        latitud: recordData.latitud as number,
        longitud: recordData.longitud as number,
        fotocelda_nueva: recordData.fotocelda_nueva as boolean,
        timestamp: (recordData.timestamp as number) || Date.now(),
        synced: false, // Forzar como no sincronizado al importar
        imagen: recordData.imagen_base64 ? base64ToBlob(recordData.imagen_base64 as string) : new Blob(),
        imagen_watts: recordData.imagen_watts_base64 ? base64ToBlob(recordData.imagen_watts_base64 as string) : new Blob(),
        imagen_fotocelda: recordData.imagen_fotocelda_base64 ? base64ToBlob(recordData.imagen_fotocelda_base64 as string) : new Blob(),
      };
      
      // Verificar si ya existe un registro similar
      const exists = await existsSimilarPendingRecord(importRecord);
      if (!exists) {
        await db.add('pendingLuminarias', importRecord);
        importedCount++;
      }
    } catch (error) {
      console.error('Error importando registro:', error);
      errorCount++;
    }
  }
  
  console.log(`📥 Importación completada: ${importedCount} importados, ${errorCount} errores`);
}

// Función auxiliar para convertir Blob a base64
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // Remover el prefijo "data:..."
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Función auxiliar para convertir base64 a Blob
function base64ToBlob(base64: string, mimeType: string = 'image/jpeg'): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

// Función para limpiar registros duplicados basándose en hash
export async function cleanDuplicateRecords(): Promise<{ removed: number; kept: number }> {
  const db = await initDB();
  const allRecords = await db.getAll('pendingLuminarias');
  
  const hashMap = new Map<string, PendingLuminaria[]>();
  
  // Agrupar registros por hash
  for (const record of allRecords) {
    const hash = generateRecordHash({
      colonia_id: record.colonia_id,
      numero_poste: record.numero_poste,
      watts: record.watts,
      latitud: record.latitud,
      longitud: record.longitud,
    });
    
    if (!hashMap.has(hash)) {
      hashMap.set(hash, []);
    }
    hashMap.get(hash)!.push(record);
  }
  
  let removedCount = 0;
  let keptCount = 0;
  
  // Para cada grupo de duplicados, mantener solo el más reciente y no sincronizado
  for (const [hash, records] of hashMap) {
    if (records.length > 1) {
      // Ordenar por timestamp descendente (más reciente primero)
      records.sort((a, b) => b.timestamp - a.timestamp);
      
      // Encontrar el mejor registro para mantener (preferir no sincronizados)
      const recordToKeep = records.find(r => !r.synced) || records[0];
      
      // Eliminar todos los demás
      for (const record of records) {
        if (record.id && record.id !== recordToKeep.id) {
          await db.delete('pendingLuminarias', record.id);
          removedCount++;
        }
      }
      keptCount++;
    } else {
      keptCount++;
    }
  }
  
  console.log(`🧹 Limpieza de duplicados completada: ${removedCount} eliminados, ${keptCount} mantenidos`);
  return { removed: removedCount, kept: keptCount };
}

// Función para limpiar registros corruptos (sin imágenes válidas)
export async function cleanCorruptedRecords(): Promise<{ removed: number; errors: string[] }> {
  const db = await initDB();
  const allRecords = await db.getAll('pendingLuminarias');
  
  let removedCount = 0;
  const errors: string[] = [];
  
  for (const record of allRecords) {
    let isCorrupted = false;
    const issues: string[] = [];
    
    // Verificar imágenes
    if (!record.imagen || !(record.imagen instanceof Blob) || record.imagen.size === 0) {
      issues.push('imagen principal faltante o corrupta');
      isCorrupted = true;
    }
    
    if (!record.imagen_watts || !(record.imagen_watts instanceof Blob) || record.imagen_watts.size === 0) {
      issues.push('imagen de watts faltante o corrupta');
      isCorrupted = true;
    }
    
    if (!record.imagen_fotocelda || !(record.imagen_fotocelda instanceof Blob) || record.imagen_fotocelda.size === 0) {
      issues.push('imagen de fotocelda faltante o corrupta');
      isCorrupted = true;
    }
    
    // Verificar datos básicos
    if (!record.numero_poste || record.numero_poste.trim() === '') {
      issues.push('número de poste faltante');
      isCorrupted = true;
    }
    
    if (!record.colonia_id || record.colonia_id <= 0) {
      issues.push('ID de colonia inválido');
      isCorrupted = true;
    }
    
    if (isCorrupted && record.id) {
      console.warn(`🗑️ Eliminando registro corrupto ${record.id} (Poste: ${record.numero_poste}): ${issues.join(', ')}`);
      await db.delete('pendingLuminarias', record.id);
      removedCount++;
      errors.push(`Registro ${record.id}: ${issues.join(', ')}`);
    }
  }
  
  console.log(`🧹 Limpieza de registros corruptos completada: ${removedCount} eliminados`);
  return { removed: removedCount, errors };
}

// Función para optimizar el almacenamiento (comprimir imágenes grandes)
export async function optimizeStorage(): Promise<{ 
  optimized: number; 
  spaceSaved: number; 
  errors: string[] 
}> {
  const db = await initDB();
  const allRecords = await db.getAll('pendingLuminarias');
  
  let optimizedCount = 0;
  let spaceSaved = 0;
  const errors: string[] = [];
  
  for (const record of allRecords) {
    if (!record.id) continue;
    
    try {
      let updated = false;
      const originalSize = (record.imagen?.size || 0) + (record.imagen_watts?.size || 0) + (record.imagen_fotocelda?.size || 0);
      
      // Optimizar solo imágenes muy grandes (> 5MB)
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      
      if (record.imagen && record.imagen.size > MAX_SIZE) {
        const optimized = await compressImage(record.imagen, 0.8);
        if (optimized.size < record.imagen.size) {
          record.imagen = optimized;
          updated = true;
        }
      }
      
      if (record.imagen_watts && record.imagen_watts.size > MAX_SIZE) {
        const optimized = await compressImage(record.imagen_watts, 0.8);
        if (optimized.size < record.imagen_watts.size) {
          record.imagen_watts = optimized;
          updated = true;
        }
      }
      
      if (record.imagen_fotocelda && record.imagen_fotocelda.size > MAX_SIZE) {
        const optimized = await compressImage(record.imagen_fotocelda, 0.8);
        if (optimized.size < record.imagen_fotocelda.size) {
          record.imagen_fotocelda = optimized;
          updated = true;
        }
      }
      
      if (updated) {
        await db.put('pendingLuminarias', record);
        const newSize = (record.imagen?.size || 0) + (record.imagen_watts?.size || 0) + (record.imagen_fotocelda?.size || 0);
        spaceSaved += originalSize - newSize;
        optimizedCount++;
      }
      
    } catch (error) {
      const errorMsg = `Error optimizando registro ${record.id}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }
  }
  
  console.log(`🚀 Optimización completada: ${optimizedCount} registros optimizados, ${(spaceSaved / 1024 / 1024).toFixed(2)}MB ahorrados`);
  return { optimized: optimizedCount, spaceSaved, errors };
}

// Función auxiliar para comprimir imágenes
async function compressImage(blob: Blob, quality: number = 0.8): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calcular nuevo tamaño manteniendo aspect ratio
      const MAX_WIDTH = 1920;
      const MAX_HEIGHT = 1080;
      
      let { width, height } = img;
      if (width > height) {
        if (width > MAX_WIDTH) {
          height = (height * MAX_WIDTH) / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = (width * MAX_HEIGHT) / height;
          height = MAX_HEIGHT;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((compressedBlob) => {
        resolve(compressedBlob || blob);
      }, 'image/jpeg', quality);
    };
    
    img.onerror = () => resolve(blob);
    img.src = URL.createObjectURL(blob);
  });
}

// Función para obtener estadísticas de almacenamiento
export async function getStorageStats(): Promise<{
  totalRecords: number;
  totalSize: number;
  pendingRecords: number;
  syncedRecords: number;
  corruptedRecords: number;
  duplicateGroups: number;
  estimatedQuotaUsage?: number;
}> {
  const db = await initDB();
  const allRecords = await db.getAll('pendingLuminarias');
  
  let totalSize = 0;
  let pendingRecords = 0;
  let syncedRecords = 0;
  let corruptedRecords = 0;
  
  const hashMap = new Map<string, number>();
  
  for (const record of allRecords) {
    // Calcular tamaño
    totalSize += (record.imagen?.size || 0) + (record.imagen_watts?.size || 0) + (record.imagen_fotocelda?.size || 0);
    
    // Contar estados
    if (record.synced) {
      syncedRecords++;
    } else {
      pendingRecords++;
    }
    
    // Detectar corruptos
    const hasValidImages = 
      record.imagen instanceof Blob && record.imagen.size > 0 &&
      record.imagen_watts instanceof Blob && record.imagen_watts.size > 0 &&
      record.imagen_fotocelda instanceof Blob && record.imagen_fotocelda.size > 0;
    
    if (!hasValidImages) {
      corruptedRecords++;
    }
    
    // Detectar duplicados
    const hash = generateRecordHash({
      colonia_id: record.colonia_id,
      numero_poste: record.numero_poste,
      watts: record.watts,
      latitud: record.latitud,
      longitud: record.longitud,
    });
    
    hashMap.set(hash, (hashMap.get(hash) || 0) + 1);
  }
  
  const duplicateGroups = Array.from(hashMap.values()).filter(count => count > 1).length;
  
  // Intentar obtener uso de cuota del navegador
  let estimatedQuotaUsage: number | undefined;
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      if (estimate.usage && estimate.quota) {
        estimatedQuotaUsage = (estimate.usage / estimate.quota) * 100;
      }
    } catch (error) {
      console.warn('No se pudo obtener información de cuota de almacenamiento:', error);
    }
  }
  
  return {
    totalRecords: allRecords.length,
    totalSize,
    pendingRecords,
    syncedRecords,
    corruptedRecords,
    duplicateGroups,
    estimatedQuotaUsage,
  };
}
