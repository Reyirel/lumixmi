import { openDB, IDBPDatabase } from 'idb';

// Tipo para los registros pendientes
type PendingLuminaria = {
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
