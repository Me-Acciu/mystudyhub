/**
 * src/navigation/RootNavigator.tsx
 * ---------------------------------------------------------------------------
 * Punto di ingresso della navigazione. Decide UNA sola cosa: se mostrare lo
 * stack di autenticazione o l'app principale, guardando esclusivamente
 * `useAuth()`. Nessun'altra logica di business qui dentro: la navigazione
 * deve restare "dumb" e delegare tutto ai moduli feature.
 *
 * Sicurezza: questa è anche la nostra prima linea di difesa "UX" contro
 * l'accesso a schermate riservate da parte di utenti non autenticati —
 * ma è solo un livello di comodità: la vera protezione dei dati resta
 * sempre la Row Level Security lato Supabase (un token rubato non basterebbe
 * comunque a bypassare le policy sul database).
 * ---------------------------------------------------------------------------
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';

import { useAuth } from '@/services/auth/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { session, isInitializing } = useAuth();

  // Finché non sappiamo se esiste già una sessione persistita (letta da
  // SecureStore), mostriamo un semplice loader invece di "sbattere" per
  // un istante lo schermo di login prima di quello principale.
  if (isInitializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A' }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <RootStack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
