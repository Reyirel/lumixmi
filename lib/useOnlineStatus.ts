"use client"

import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Inicializar con el estado actual
    setIsOnline(navigator.onLine);

    // Handlers para eventos de conexión
    const handleOnline = () => {
      console.log('🌐 Conexión restaurada');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('📡 Sin conexión');
      setIsOnline(false);
    };

    // Agregar event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
