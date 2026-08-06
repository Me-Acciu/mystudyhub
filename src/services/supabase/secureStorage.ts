/**
 * src/services/supabase/secureStorage.ts
 * ---------------------------------------------------------------------------
 * SICUREZZA: dove salviamo il token di sessione dell'utente?
 *
 * Supabase, di default, se non gli forniamo uno storage custom, usa
 * AsyncStorage. AsyncStorage su iOS/Android NON è cifrato: qualunque
 * processo con accesso al filesystem dell'app (o un backup non cifrato)
 * potrebbe leggere il token di sessione in chiaro.
 *
 * Per questo implementiamo un adapter che usa `expo-secure-store`, che:
 *  - su iOS si appoggia al Keychain,
 *  - su Android si appoggia a Keystore (con EncryptedSharedPreferences).
 *
 * Nota tecnica: SecureStore ha un limite di ~2KB per valore. I JWT di
 * Supabase di solito rientrano, ma se in futuro dovessimo superare il
 * limite (es. sessioni con molti custom claims), andrebbe introdotta una
 * strategia "chunking" o un formato più compatto: da tenere d'occhio in
 * fase di test.
 * ---------------------------------------------------------------------------
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Il client Supabase si aspetta un oggetto storage con l'interfaccia
 * "getItem / setItem / removeItem" (compatibile con lo storage adapter di
 * @supabase/supabase-js). Su web usiamo localStorage come fallback, perché
 * `expo-secure-store` non espone il NativeModule di SecureStore in ambiente web.
 */
const isWeb = Platform.OS === 'web';

async function webGetItem(key: string): Promise<string | null> {
  try {
    return globalThis.localStorage.getItem(key);
  } catch {
    return null;
  }
}

async function webSetItem(key: string, value: string): Promise<void> {
  try {
    globalThis.localStorage.setItem(key, value);
  } catch {
    // localStorage may be unavailable in some web contexts; ignore and let auth fall back to unauthenticated state.
  }
}

async function webRemoveItem(key: string): Promise<void> {
  try {
    globalThis.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export const secureStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (isWeb) {
      return webGetItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (isWeb) {
      return webSetItem(key, value);
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (isWeb) {
      return webRemoveItem(key);
    }
    await SecureStore.deleteItemAsync(key);
  },
};
