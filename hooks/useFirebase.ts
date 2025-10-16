// hooks/useFirebase.ts
'use client';

import { useEffect, useState } from 'react';
import { auth, analytics } from '@/lib/firebase';
import { User, onAuthStateChanged } from 'firebase/auth';
import { Analytics } from 'firebase/analytics';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
};

export const useAnalytics = () => {
  const [analyticsInstance, setAnalyticsInstance] = useState<Analytics | null>(null);

  useEffect(() => {
    analytics().then((instance) => {
      setAnalyticsInstance(instance);
    });
  }, []);

  return analyticsInstance;
};