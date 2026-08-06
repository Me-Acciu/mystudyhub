/**
 * App.tsx — Entry point dell'app MyStudyHub.
 *
 * Ordine dei provider (dall'esterno verso l'interno):
 * 1. QueryClientProvider  → React Query per dati server (Supabase)
 * 2. AuthProvider         → Sessione Supabase + funzioni auth
 * 3. RootNavigator        → Decide Auth vs Main stack in base alla sessione
 *
 * GestureHandlerRootView è richiesto da react-navigation su Android.
 */
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from '@/services/auth/AuthContext';
import { RootNavigator } from '@/navigation/RootNavigator';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minuti
    },
  },
});

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
