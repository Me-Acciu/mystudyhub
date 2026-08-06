/**
 * src/features/auth/screens/SignUpScreen.tsx
 * ---------------------------------------------------------------------------
 * Schermata di registrazione. Come per il login, nessuna chiamata diretta
 * a Supabase: tutto passa da `useAuth().signUp`.
 * ---------------------------------------------------------------------------
 */

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuth } from '@/services/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import type { AuthStackParamList } from '@/navigation/AuthNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: Props) {
  const { signUp, isSubmitting } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage('Le due password inserite non coincidono.');
      return;
    }

    const error = await signUp(email, password);
    if (error) {
      setErrorMessage(error);
      return;
    }

    // Supabase, di default, richiede conferma email prima del primo login:
    // informiamo l'utente invece di dare per scontato l'accesso immediato.
    setSuccessMessage('Registrazione avviata! Controlla la tua email per confermare l\'account.');
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Text style={styles.title}>Crea il tuo account</Text>
        <Text style={styles.subtitle}>Inizia a organizzare il tuo studio</Text>

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
            placeholder="Almeno 8 caratteri, lettere e numeri"
            placeholderTextColor="#64748B"
            secureTextEntry
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Conferma Password</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="••••••••"
            placeholderTextColor="#64748B"
            secureTextEntry
            style={styles.input}
          />
        </View>

        {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
        {successMessage && <Text style={styles.success}>{successMessage}</Text>}

        <Button label="Registrati" onPress={handleSubmit} isLoading={isSubmitting} style={styles.submitButton} />

        <Button
          label="Hai già un account? Accedi"
          variant="secondary"
          onPress={() => navigation.navigate('Login')}
          style={styles.secondaryButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0F172A' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 26, fontWeight: '800', color: '#F1F5F9', textAlign: 'center' },
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
  success: { color: '#34D399', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  submitButton: { marginTop: 8 },
  secondaryButton: { marginTop: 12 },
});
