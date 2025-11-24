"use client"

import { useState } from 'react';
import { getPendingRecords, getPendingCount } from '@/lib/offlineStorage';

type PendingRecord = {
  id?: number;
  colonia_id: number;
  numero_poste: string;
  watts: number;
  latitud: number;
  longitud: number;
  fotocelda_nueva: boolean;
  timestamp: number;
  synced: boolean;
};

export default function OfflineTestPage() {
  const [pendingRecords, setPendingRecords] = useState<PendingRecord[]>([]);
  const [count, setCount] = useState(0);

  const loadPendingRecords = async () => {
    const records = await getPendingRecords();
    const pendingCount = await getPendingCount();
    setPendingRecords(records);
    setCount(pendingCount);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 Test de Almacenamiento Offline
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Registros Pendientes</h2>
          
          <button
            onClick={loadPendingRecords}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
          >
            Cargar Registros Pendientes ({count})
          </button>

          {pendingRecords.length > 0 ? (
            <div className="space-y-4">
              {pendingRecords.map((record) => (
                <div key={record.id} className="border rounded p-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>ID:</strong> {record.id}</div>
                    <div><strong>Poste:</strong> {record.numero_poste}</div>
                    <div><strong>Watts:</strong> {record.watts}W</div>
                    <div><strong>Colonia ID:</strong> {record.colonia_id}</div>
                    <div><strong>Latitud:</strong> {record.latitud}</div>
                    <div><strong>Longitud:</strong> {record.longitud}</div>
                    <div className="col-span-2">
                      <strong>Fotocelda Nueva:</strong> {record.fotocelda_nueva ? 'Sí' : 'No'}
                    </div>
                    <div className="col-span-2">
                      <strong>Timestamp:</strong> {new Date(record.timestamp).toLocaleString()}
                    </div>
                    <div className="col-span-2">
                      <strong>Sincronizado:</strong> {record.synced ? '✅ Sí' : '❌ No'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No hay registros pendientes</p>
          )}
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Instrucciones de Prueba</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Abre DevTools (F12) → Network → Selecciona Offline</li>
            <li>Ve a /form y llena el formulario</li>
            <li>Envía el formulario (se guardará offline)</li>
            <li>Vuelve a esta página y haz clic en Cargar Registros Pendientes</li>
            <li>Verás tu registro guardado localmente</li>
            <li>Vuelve a Online en DevTools</li>
            <li>El registro se sincronizará automáticamente</li>
          </ol>
        </div>

        <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
          <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Verificación de IndexedDB</h3>
          <p className="text-sm text-yellow-800 mb-2">
            Para ver los datos en IndexedDB:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
            <li>Abre DevTools (F12)</li>
            <li>Ve a la pestaña Application</li>
            <li>En el sidebar, expande IndexedDB</li>
            <li>Busca lumixmi-offline</li>
            <li>Expande y selecciona pendingLuminarias</li>
            <li>Verás todos los registros almacenados</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
