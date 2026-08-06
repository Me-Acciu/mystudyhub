/**
 * src/store/useThemeStore.ts
 * ---------------------------------------------------------------------------
 * Stato locale UI per la personalizzazione (Sezione 6.7 del design doc):
 * tema colore, modalità chiara/scura, skin della pedina.
 *
 * Perché Zustand e non React Context per questo? Il design doc (Sezione
 * 8.1) distingue esplicitamente:
 *  - React Query per lo stato "server" (dati che vivono su Supabase),
 *  - uno store leggero (Zustand) per lo stato locale di UI/preferenze.
 * Il tema è tipicamente letto da moltissimi componenti (ogni schermata),
 * quindi uno store globale leggero evita sia il "prop drilling" sia i
 * re-render inutili tipici di un Context troppo generico.
 *
 * Nota: questi dati (colori, emoji pedina) NON sono sensibili, quindi qui
 * usare AsyncStorage per la persistenza locale è appropriato — a differenza
 * dei token di sessione, che vanno in SecureStore (vedi services/supabase).
 * ---------------------------------------------------------------------------
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ThemePreferences } from '@/types/models';

interface ThemeState {
  preferences: ThemePreferences;
  setColorScheme: (scheme: ThemePreferences['colorScheme']) => void;
  setAccentTheme: (accent: ThemePreferences['accentTheme']) => void;
  setPawnEmoji: (emoji: string) => void;
}

const DEFAULT_PREFERENCES: ThemePreferences = {
  colorScheme: 'system',
  accentTheme: 'indigo',
  pawnEmoji: '🚀',
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preferences: DEFAULT_PREFERENCES,

      setColorScheme: (colorScheme) =>
        set((state) => ({ preferences: { ...state.preferences, colorScheme } })),

      setAccentTheme: (accentTheme) =>
        set((state) => ({ preferences: { ...state.preferences, accentTheme } })),

      setPawnEmoji: (pawnEmoji) =>
        set((state) => ({ preferences: { ...state.preferences, pawnEmoji } })),
    }),
    {
      name: 'mystudyhub.theme-preferences', // chiave AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/**
 * Mappa di token colore per ciascun "accentTheme" disponibile in v1.
 * Centralizzare qui i valori esadecimali evita che ogni schermata
 * definisca la propria tonalità di indaco leggermente diversa.
 */
export const ACCENT_THEME_TOKENS: Record<ThemePreferences['accentTheme'], { primary: string; primaryDark: string }> = {
  indigo: { primary: '#6366F1', primaryDark: '#4338CA' },
  emerald: { primary: '#10B981', primaryDark: '#047857' },
  sunset: { primary: '#F59E0B', primaryDark: '#C2410C' },
};
