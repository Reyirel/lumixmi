// components/FirebaseDemo.tsx
'use client';

import { useAuth, useAnalytics } from '@/hooks/useFirebase';
import { signInAnonymously, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { logEvent } from 'firebase/analytics';

export default function FirebaseDemo() {
  const { user, loading } = useAuth();
  const analytics = useAnalytics();

  const handleSignIn = async () => {
    try {
      await signInAnonymously(auth);
      if (analytics) {
        logEvent(analytics, 'login', { method: 'anonymous' });
      }
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      if (analytics) {
        logEvent(analytics, 'logout');
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return <div className="p-4 border rounded">Cargando...</div>;
  }

  return (
    <div className="p-4 border rounded bg-white/50 dark:bg-gray-800/50">
      <h3 className="text-lg font-semibold mb-4">Demo Firebase</h3>
      
      {user ? (
        <div>
          <p className="mb-2">✅ Usuario autenticado</p>
          <p className="text-sm text-gray-600 mb-4">UID: {user.uid}</p>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      ) : (
        <div>
          <p className="mb-4">❌ No autenticado</p>
          <button
            onClick={handleSignIn}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Iniciar Sesión Anónima
          </button>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-500">
        <p>Analytics: {analytics ? '✅ Activado' : '❌ No disponible'}</p>
      </div>
    </div>
  );
}