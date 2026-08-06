/**
 * src/services/auth/AuthContext.tsx
 * ---------------------------------------------------------------------------
 * Context React per l'autenticazione.
 *
 * Perché un Context dedicato invece di leggere `supabase.auth` direttamente
 * dentro ogni schermata?
 * - Un solo "source of truth" per sapere se l'utente è loggato: la
 *   navigazione (RootNavigator) decide quale stack mostrare (Auth vs Main)
 *   guardando SOLO questo Context.
 * - I componenti UI non parlano mai direttamente con Supabase: passano da
 *   qui, così se domani cambiamo backend auth, tocchiamo un solo file.
 *
 * Sicurezza:
 * - Non salviamo MAI la password in stato React più a lungo del necessario
 *   (viene passata subito a Supabase e non conservata).
 * - Le funzioni di login/signup validano gli input PRIMA di inviarli alla
 *   rete, per ridurre richieste inutili e dare feedback immediato
 *   all'utente (la validazione "vera" resta comunque lato server/Supabase).
 * - Gli errori mostrati all'utente sono messaggi generici e non espongono
 *   dettagli interni (es. non diciamo "utente non trovato" vs "password
 *   errata" separatamente, per non facilitare l'enumerazione di account).
 * ---------------------------------------------------------------------------
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/services/supabase/client';
import { isValidEmail, isValidPassword } from '@/utils/validation';

interface AuthContextValue {
  /** Sessione Supabase corrente (contiene i token), null se non loggato. */
  session: Session | null;
  /** Utente autenticato corrente, comodo accessor derivato da session. */
  user: User | null;
  /** true finché non abbiamo ancora determinato lo stato iniziale della sessione. */
  isInitializing: boolean;
  /** true mentre una richiesta di login/signup è in corso (per disabilitare i bottoni). */
  isSubmitting: boolean;
  /** Effettua il login con email e password. Ritorna un messaggio di errore "safe" o null. */
  signIn: (email: string, password: string) => Promise<string | null>;
  /** Registra un nuovo utente. Ritorna un messaggio di errore "safe" o null. Aggiunto parametro opzionale fullName */
  signUp: (email: string, password: string, fullName?: string) =>   Promise<string | null>;
  /** Effettua il logout e ripulisce la sessione locale. */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Messaggio di errore generico, non specifico, da mostrare in caso di credenziali errate. */
const GENERIC_AUTH_ERROR = 'Email o password non validi. Riprova.';
const GENERIC_NETWORK_ERROR = 'Impossibile completare l\'operazione. Controlla la connessione e riprova.';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // 1) Alla partenza, recuperiamo l'eventuale sessione già persistita
    //    (letta in modo sicuro da SecureStore tramite il nostro adapter).
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsInitializing(false);
    });

    // 2) Ci mettiamo in ascolto di ogni cambio di stato auth (login, logout,
    //    refresh token, sessione scaduta) così tutta l'app resta sincronizzata.
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<string | null> => {
    // Validazione client-side "leggera": serve solo per UX rapida,
    // la validazione autoritativa resta lato Supabase.
    if (!isValidEmail(email)) return 'Inserisci un indirizzo email valido.';
    if (password.length === 0) return 'Inserisci la password.';

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) {
        // Non esponiamo error.message grezzo all'utente: potrebbe contenere
        // dettagli utili a un attaccante per capire se un'email esiste o meno.
        return GENERIC_AUTH_ERROR;
      }
      return null;
    } catch {
      return GENERIC_NETWORK_ERROR;
    } finally {
      setIsSubmitting(false);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string): Promise<string | null> => {
    if (!isValidEmail(email)) return 'Inserisci un indirizzo email valido.';
    const passwordError = isValidPassword(password);
    if (passwordError) return passwordError;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        //  Aggiunti i metadati per il trigger SQL
        options: {
          data: {
            full_name: fullName?.trim() || null,
          },
        },
      });
      if (error) {
        return 'Non è stato possibile completare la registrazione. Riprova più tardi.';
      }
      return null;
    } catch {
      return GENERIC_NETWORK_ERROR;
    } finally {
      setIsSubmitting(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // Non serve azzerare manualmente `session`: onAuthStateChange lo farà.
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isInitializing,
      isSubmitting,
      signIn,
      signUp,
      signOut,
    }),
    [session, isInitializing, isSubmitting]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook di comodo per consumare il context, con controllo che sia usato dentro il Provider. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve essere usato dentro un <AuthProvider>.');
  }
  return ctx;
}
