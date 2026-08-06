/**
 * src/config/env.ts
 * ---------------------------------------------------------------------------
 * Punto UNICO di accesso alle variabili d'ambiente.
 *
 * Perché centralizzare qui e non leggere `process.env.XXX` sparso nel codice?
 * 1) Sicurezza: se domani cambiamo il modo in cui iniettiamo le variabili
 *    (es. da Expo Constants a un file di config remoto), tocchiamo un solo
 *    file invece di cercare in tutta la codebase.
 * 2) Fail-fast: se manca una variabile obbligatoria, l'app deve accorgersene
 *    subito all'avvio con un errore chiaro, non con un crash criptico più
 *    avanti (es. "fetch failed" dentro una chiamata Supabase).
 * 3) Le uniche variabili che possiamo esporre qui sono quelle con prefisso
 *    EXPO_PUBLIC_: Expo le inietta nel bundle client, quindi per definizione
 *    NON devono mai contenere segreti "veri" (service role key, chiavi
 *    private, ecc.). Quei segreti restano lato server/Supabase Functions.
 * ---------------------------------------------------------------------------
 */

/**
 * Legge una variabile d'ambiente pubblica obbligatoria.
 * Lancia un errore esplicito in fase di avvio se manca, invece di lasciare
 * che l'app parta "silenziosamente rotta".
 */
function readRequiredEnv(value: string | undefined, key: string, fallback?: string): string {
  // In Expo (SDK 49+) le variabili con prefisso EXPO_PUBLIC_ sono già
  // disponibili su process.env sia in dev che in build.
  if (!value || value.trim().length === 0) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(
      `[env] Variabile d'ambiente mancante: "${key}". ` +
        'Controlla il tuo file .env (vedi .env.example) e riavvia Expo con la cache pulita ("expo start -c").'
    );
  }

  return value;
}

export const env = {
  /** URL pubblico del progetto Supabase (non sensibile in sé). */
  SUPABASE_URL: readRequiredEnv(process.env.EXPO_PUBLIC_SUPABASE_URL, 'EXPO_PUBLIC_SUPABASE_URL'),

  /**
   * Chiave "anon" pubblica di Supabase.
   * Sicurezza: questa chiave dà accesso SOLO a ciò che le policy di
   * Row Level Security permettono per l'utente autenticato (o anonimo).
   * Non è quindi un segreto "critico", ma va comunque trattata come
   * configurazione e non hardcodata nei sorgenti.
   */
  SUPABASE_ANON_KEY: readRequiredEnv(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY, 'EXPO_PUBLIC_SUPABASE_ANON_KEY'),

  /** true negli ambienti di sviluppo, utile per log/feature flag. */
  IS_DEV: typeof __DEV__ !== 'undefined' ? __DEV__ : true,
} as const;

// Non-sensitive debug helper: log the Supabase host (not the key) in dev to aid debugging.
if (env.IS_DEV) {
  try {
    const supabaseHost = new URL(env.SUPABASE_URL).host;
    // eslint-disable-next-line no-console
    console.info(`[env] Supabase host: ${supabaseHost}`);
  } catch {
    // ignore malformed URL here; readRequiredEnv already enforces presence
  }
}
