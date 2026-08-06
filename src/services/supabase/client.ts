/**
 * src/services/supabase/client.ts
 * ---------------------------------------------------------------------------
 * Istanza SINGOLA (singleton) del client Supabase, usata da tutta l'app.
 *
 * Perché un singleton e non "new SupabaseClient()" ovunque?
 * - Evita connessioni realtime duplicate (Sezione 8.2 del design doc: il
 *   realtime serve per aggiornare il tabellone delle pedine in diretta).
 * - Garantisce che tutta l'app condivida la stessa sessione di auth.
 *
 * Note di sicurezza importanti:
 * 1) Qui usiamo SOLO la chiave "anon". La sicurezza reale dei dati non è
 *    delegata a questa chiave, ma alle policy di Row Level Security (RLS)
 *    configurate su ogni tabella Postgres lato Supabase: es. "uno studente
 *    può leggere/scrivere solo le proprie materie, capitoli, flashcard,
 *    voti" (Sezione 8.4). La RLS NON è opzionale: senza di essa, la chiave
 *    anon permetterebbe di leggere/scrivere i dati di chiunque.
 * 2) `persistSession: true` + storage custom (SecureStore) => la sessione
 *    sopravvive al riavvio dell'app, ma è cifrata a livello di sistema
 *    operativo (Keychain/Keystore), non in un file di testo.
 * 3) `autoRefreshToken: true` fa sì che il client rinnovi da solo l'access
 *    token prima che scada, senza dover ri-autenticare l'utente.
 * 4) `detectSessionInUrl: false` perché su mobile non gestiamo redirect da
 *    browser come sul web: evitiamo che il client provi a leggere sessioni
 *    da un URL che su RN non esiste.
 * ---------------------------------------------------------------------------
 */

import 'react-native-url-polyfill/auto'; // richiesto da supabase-js su RN
import 'react-native-get-random-values'; // richiesto per generare UUID lato client
import { createClient } from '@supabase/supabase-js';

import { env } from '@/config/env';
import { secureStorageAdapter } from './secureStorage';

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    storage: secureStorageAdapter,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
