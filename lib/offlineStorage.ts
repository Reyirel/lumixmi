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
  const record = {
    ...data,
    timestamp: Date.now(),
    synced: false,
  };
  
  const id = await db.add('pendingLuminarias', record);
  console.log('✅ Registro guardado offline con ID:', id);
  return id;
}

// Obtener todos los registros pendientes
export async function getPendingRecords(): Promise<PendingLuminaria[]> {
  const db = await initDB();
  const allRecords = await db.getAll('pendingLuminarias');
  return allRecords.filter((record: PendingLuminaria) => !record.synced);
}

// Marcar un registro como sincronizado
export async function markAsSynced(id: number) {
  const db = await initDB();
  const tx = db.transaction('pendingLuminarias', 'readwrite');
  const record = await tx.store.get(id);
  
  if (record) {
    record.synced = true;
    await tx.store.put(record);
    console.log('✅ Registro marcado como sincronizado:', id);
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
