/**
 * src/navigation/AuthNavigator.tsx
 * ---------------------------------------------------------------------------
 * Stack di navigazione mostrato quando l'utente NON è autenticato.
 * Volutamente minimale: solo Login e SignUp in v1 (niente "password
 * dimenticata" per ora, da aggiungere in roadmap v1/v2).
 * ---------------------------------------------------------------------------
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { SignUpScreen } from '@/features/auth/screens/SignUpScreen';

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}
