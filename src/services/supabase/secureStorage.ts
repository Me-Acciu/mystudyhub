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

import * as SecureStore from 'expo-secure-store';

/**
 * Il client Supabase si aspetta un oggetto storage con l'interfaccia
 * "getItem / setItem / removeItem" (compatibile con lo storage adapter di
 * @supabase/supabase-js). La implementiamo qui sopra SecureStore.
 */
export const secureStorageAdapter = {
  getItem: (key: string): Promise<string | null> => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string): Promise<void> => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string): Promise<void> => {
    return SecureStore.deleteItemAsync(key);
  },
};
