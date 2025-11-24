"use client"

import { useEffect, useState } from 'react';

export function NotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Verificar si el navegador soporta notificaciones
    if ('Notification' in window) {
      setPermission(Notification.permission);
      
      // Mostrar banner si no se ha concedido permiso
      if (Notification.permission === 'default') {
        // Esperar 3 segundos antes de mostrar el banner
        setTimeout(() => setShowBanner(true), 3000);
      }
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      setShowBanner(false);
      
      if (result === 'granted') {
        // Mostrar notificación de prueba
        new Notification('¡Notificaciones activadas!', {
          body: 'Recibirás notificaciones cuando se sincronicen tus registros',
          icon: '/icon-192x192.svg',
        });
      }
    }
  };

  if (!showBanner || permission !== 'default') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 animate-slide-up">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Activar notificaciones
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            Recibe notificaciones cuando tus registros se sincronicen automáticamente
          </p>
          <div className="flex space-x-2">
            <button
              onClick={requestPermission}
              className="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded hover:bg-blue-600 transition-colors"
            >
              Permitir
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded hover:bg-gray-200 transition-colors"
            >
              Ahora no
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowBanner(false)}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
