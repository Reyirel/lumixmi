"use client"

import {
  getPendingRecords,
  markAsSynced,
  deleteRecord,
  blobToFile,
  getPendingCount,
} from './offlineStorage';

// Función para sincronizar un registro pendiente
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
}) {
  try {
    // Convertir Blobs a Files
    const imageFile = blobToFile(record.imagen, `luminaria-${record.numero_poste}.jpg`);
    const imageWattsFile = blobToFile(record.imagen_watts, `watts-${record.numero_poste}.jpg`);
    const imageFotoceldaFile = blobToFile(record.imagen_fotocelda, `fotocelda-${record.numero_poste}.jpg`);

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
    for (const response of uploadResponses) {
      if (!response.ok) {
        throw new Error('Error al subir las imágenes');
      }
    }

    const [uploadResult1, uploadResult2, uploadResult3] = await Promise.all(
      uploadResponses.map((r) => r.json())
    );

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

    const response = await fetch('/api/luminarias', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Error al crear la luminaria');
    }

    // Marcar como sincronizado (pero NO eliminar para mantener historial)
    if (record.id) {
      await markAsSynced(record.id);
      console.log(`✅ Registro ${record.id} marcado como sincronizado exitosamente`);
    }

    return true;
  } catch (error) {
    console.error('❌ Error sincronizando registro:', error);
    if (error instanceof Error) {
      console.error('Detalles del error:', error.message);
    }
    throw error;
  }
}

// Función para sincronizar todos los registros pendientes
export async function syncAllPendingRecords() {
  const pendingRecords = await getPendingRecords();
  
  if (pendingRecords.length === 0) {
    console.log('✅ No hay registros pendientes para sincronizar');
    return { success: 0, failed: 0 };
  }

  console.log(`🔄 Sincronizando ${pendingRecords.length} registros pendientes...`);

  let successCount = 0;
  let failedCount = 0;

  for (const record of pendingRecords) {
    try {
      console.log(`🔄 Procesando registro ${record.id}: Poste ${record.numero_poste}`);
      await syncRecord(record);
      successCount++;
      console.log(`✅ Registro ${record.id} (Poste: ${record.numero_poste}) sincronizado exitosamente`);
      
      // NO eliminamos el registro, solo lo marcamos como sincronizado
      // Esto permite mantener un historial y verificar qué se ha sincronizado
    } catch (error) {
      failedCount++;
      console.error(`❌ Error sincronizando registro ${record.id} (Poste: ${record.numero_poste}):`, error);
      if (error instanceof Error) {
        console.error(`Detalles: ${error.message}`);
      }
    }
  }

  console.log(`📊 Sincronización completada: ${successCount} éxito, ${failedCount} fallos`);
  
  return { success: successCount, failed: failedCount };
}

// Hook para auto-sincronización cuando se detecta conexión
export function useAutoSync(isOnline: boolean) {
  const syncPending = async () => {
    if (!isOnline) return;

    const count = await getPendingCount();
    if (count > 0) {
      console.log(`🔄 Auto-sincronizando ${count} registros pendientes...`);
      try {
        const result = await syncAllPendingRecords();
        if (result.success > 0) {
          // Notificar al usuario
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Sincronización completada', {
              body: `${result.success} registros sincronizados exitosamente`,
              icon: '/icon-192x192.png',
            });
          }
        }
      } catch (error) {
        console.error('Error en auto-sincronización:', error);
      }
    }
  };

  return syncPending;
}
