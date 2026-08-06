/**
 * src/features/auth/screens/LoginScreen.tsx
 * ---------------------------------------------------------------------------
 * Schermata di accesso. Tutta la logica di autenticazione vive in
 * `useAuth()` (services/auth/AuthContext): questa schermata si limita a
 * raccogliere l'input e mostrare feedback, senza mai parlare direttamente
 * con Supabase.
 * ---------------------------------------------------------------------------
 */

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuth } from '@/services/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import type { AuthStackParamList } from '@/navigation/AuthNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signIn, isSubmitting } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Messaggio di errore "safe" (non specifico), vedi AuthContext.signIn
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErrorMessage(null);
    const error = await signIn(email, password);
    if (error) setErrorMessage(error);
    // In caso di successo non serve fare nulla: onAuthStateChange in
    // AuthContext aggiorna la sessione e RootNavigator passa a "Main".
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.title}>MyStudyHub</Text>
        <Text style={styles.subtitle}>Accedi al tuo spazio di studio</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="nome@esempio.it"
            placeholderTextColor="#64748B"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#64748B"
            secureTextEntry
            autoComplete="password"
            style={styles.input}
          />
        </View>

        {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

        <Button label="Accedi" onPress={handleSubmit} isLoading={isSubmitting} style={styles.submitButton} />

        <Button
          label="Non hai un account? Registrati"
          variant="secondary"
          onPress={() => navigation.navigate('SignUp')}
          style={styles.secondaryButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0F172A' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 30, fontWeight: '800', color: '#F1F5F9', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginTop: 6, marginBottom: 32 },
  field: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginBottom: 6 },
  input: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#F1F5F9',
    fontSize: 15,
  },
  error: { color: '#F87171', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  submitButton: { marginTop: 8 },
  secondaryButton: { marginTop: 12 },
});
