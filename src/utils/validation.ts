/**
 * src/utils/validation.ts
 * ---------------------------------------------------------------------------
 * Funzioni di validazione/sanitizzazione input condivise.
 *
 * Perché centralizzarle:
 * - Coerenza: la regola "una password valida ha almeno 8 caratteri" deve
 *   vivere in un solo posto, non ripetuta (e magari disallineata) in ogni
 *   form.
 * - Sicurezza: qui concentriamo anche le regole anti-injection di base per
 *   i campi liberi (es. nome materia, nota evento) prima che finiscano in
 *   una query Supabase. NB: Supabase/PostgREST già parametrizza le query,
 *   quindi il rischio di SQL injection classico è basso; qui ci
 *   proteggiamo soprattutto da input "malformati" o eccessivamente lunghi
 *   (denial of service applicativo, dati sporchi) e da contenuti che
 *   potrebbero rompere la UI (es. HTML/script se in futuro renderizzassimo
 *   testo come HTML in una WebView).
 * ---------------------------------------------------------------------------
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Valida la robustezza minima di una password in fase di registrazione.
 * Ritorna null se valida, altrimenti un messaggio d'errore da mostrare.
 *
 * Nota: la policy "vera" e definitiva sulla robustezza password va
 * comunque applicata anche lato Supabase (Auth settings), questa è una
 * validazione client-side di primo livello.
 */
export function isValidPassword(password: string): string | null {
  if (password.length < 8) {
    return 'La password deve contenere almeno 8 caratteri.';
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'La password deve contenere sia lettere che numeri.';
  }
  return null;
}

/** Limiti di lunghezza per i campi testuali liberi più comuni dell'app. */
export const TEXT_FIELD_LIMITS = {
  subjectName: 60,
  chapterName: 100,
  eventName: 200,
  noteText: 2000,
  classInviteCode: 20,
} as const;

/**
 * Sanitizza un campo testo libero:
 * - rimuove spazi bianchi superflui a inizio/fine,
 * - tronca alla lunghezza massima consentita,
 * - rimuove eventuali caratteri di controllo invisibili che potrebbero
 *   arrivare da copia/incolla (es. da PDF) e creare problemi di rendering.
 */
export function sanitizeFreeText(input: string, maxLength: number): string {
  const withoutControlChars = input.replace(/[\u0000-\u001F\u007F]/g, '');
  const trimmed = withoutControlChars.trim();
  return trimmed.slice(0, maxLength);
}

/** Verifica che un nome (materia, capitolo, ecc.) non sia vuoto dopo sanitizzazione. */
export function isNonEmptyName(input: string): boolean {
  return sanitizeFreeText(input, 1000).length > 0;
}

/**
 * Valida il valore di un voto in base alla scala (Sezione 5.9).
 * decimale: 1-10, trentesimi: 1-30.
 */
export function isValidGradeValue(value: number, scale: 'decimale' | 'trentesimi'): boolean {
  if (Number.isNaN(value)) return false;
  if (scale === 'decimale') return value >= 1 && value <= 10;
  return value >= 1 && value <= 30;
}

/**
 * Valida una data "parziale" (usata dal modulo Cronologia/Datapp):
 * l'anno è sempre obbligatorio, mese e giorno sono opzionali ma devono
 * essere coerenti se presenti (es. niente giorno 31 con anno senza mese).
 */
export function isValidPartialDate(date: { year: number; month?: number | null; day?: number | null }): boolean {
  if (!Number.isInteger(date.year)) return false;
  if (date.month != null && (date.month < 1 || date.month > 12)) return false;
  if (date.day != null) {
    if (date.month == null) return false; // un giorno senza mese non ha senso
    if (date.day < 1 || date.day > 31) return false;
  }
  return true;
}
