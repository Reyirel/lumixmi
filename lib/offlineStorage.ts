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
