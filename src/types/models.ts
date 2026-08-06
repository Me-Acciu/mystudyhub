/**
 * src/types/models.ts
 * ---------------------------------------------------------------------------
 * Tipi di dominio condivisi da tutta l'app.
 *
 * Questi tipi rispecchiano 1:1 il "Modello Dati Concettuale" descritto nella
 * Sezione 5 del documento di design, e devono restare allineati allo schema
 * Postgres/Supabase (vedi Sezione 8.2). Tenerli in un unico file evita che
 * ogni feature si crei una propria versione leggermente diversa dello stesso
 * concetto (es. tre definizioni diverse di "Capitolo").
 *
 * Convenzione: i campi lato client sono in camelCase; il mapping da/verso
 * gli snake_case di Postgres avviene nel livello "services/api" (vedi
 * src/features/#/api), MAI dentro i componenti UI.
 * ---------------------------------------------------------------------------
 */

/** Data "parziale": può avere solo l'anno, oppure anno+mese, oppure completa. */
export interface PartialDate {
  year: number;
  month?: number | null; // 1-12
  day?: number | null; // 1-31
}

/** 5.2 Studente (User) */
export interface UserProfile {
  id: string; // UUID (coincide con l'id utente Supabase Auth)
  displayName: string;
  username: string;
  avatarUrl?: string | null;
  theme: ThemePreferences;
  studyPath?: string | null; // percorso_studi, opzionale
}

/** Sotto-struttura di personalizzazione (Sezione 6.7) */
export interface ThemePreferences {
  colorScheme: 'light' | 'dark' | 'system';
  accentTheme: 'indigo' | 'emerald' | 'sunset'; // temi colore predefiniti v1
  pawnEmoji: string; // skin della pedina scelta dall'utente
}

/** 5.3 Materia (Subject) */
export interface Subject {
  id: string;
  ownerId: string;
  name: string;
  color: string; // token colore/gradiente, es. "from-amber-500 to-orange-600"
  icon: string; // nome icona (lucide-react-native)
  sharedWithClassIds: string[]; // classi_condivise[]
  archived: boolean;
}

/** Stato di avanzamento di un capitolo */
export type ChapterStatus = 'da_iniziare' | 'in_corso' | 'completato';

/** 5.4 Capitolo (Chapter) */
export interface Chapter {
  id: string;
  subjectId: string;
  name: string;
  order: number;
  status: ChapterStatus;
  notes?: string | null;
}

/** 5.5 Flashcard e Mazzo */
export type FlashcardSrState = 'nuova' | 'in_apprendimento' | 'consolidata';

export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  srState: FlashcardSrState;
  nextReviewDate: string | null; // ISO date, calcolata dall'algoritmo SM-2
  easeFactor: number; // parametro SM-2
  interval: number; // giorni, parametro SM-2
}

export interface FlashcardDeck {
  id: string;
  chapterId: string;
  title: string;
}

/** 5.6 Cronologia / Datapp — evoluzione del prototipo esistente */
export interface TimelineEvent {
  id: string;
  chapterId: string;
  name: string;
  startDate: PartialDate;
  endDate?: PartialDate | null; // periodo opzionale
}

export interface TimelineQuizSession {
  id: string;
  chapterId: string;
  score: number; // risultato dell'ultimo quiz
  totalQuestions: number;
  completedAt: string; // ISO datetime
}

/** 5.7 Calendario (CalendarEvent) */
export type CalendarEventType = 'verifica' | 'scadenza' | 'sessione_studio' | 'altro';

export interface CalendarEvent {
  id: string;
  userId: string;
  subjectId?: string | null;
  chapterId?: string | null;
  title: string;
  type: CalendarEventType;
  dateTime: string; // ISO datetime
  reminderMinutesBefore?: number | null;
}

/** 5.8 Classe (Class) e Iscrizione */
export type ClassRole = 'membro' | 'amministratore';

export interface StudyClass {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string; // UUID utente
}

export interface ClassMembership {
  classId: string;
  userId: string;
  pawnPosition: number;
  role: ClassRole;
  /** Impostazioni privacy per membro (Sezione 6.5) */
  privacy: {
    showSubjectAndProgress: boolean; // se false, mostra solo la posizione pedina
  };
}

/** 5.9 Voti e Risultati Attività */
export type GradeScale = 'decimale' | 'trentesimi';

export interface Grade {
  id: string;
  userId: string;
  subjectId?: string | null;
  chapterId?: string | null;
  value: number;
  scale: GradeScale;
  note?: string | null;
  createdAt: string;
}

export type ActivityResultType = 'flashcard' | 'quiz_cronologia';

export interface ActivityResult {
  id: string;
  userId: string;
  type: ActivityResultType;
  correctPercentage: number; // 0-100, base per il Punteggio Progresso
  createdAt: string;
}

/**
 * Punteggio Progresso calcolato (Sezione 9):
 * Punteggio = 0.6 * componenteVoti + 0.4 * componenteAttivita
 * Questo tipo rappresenta il risultato già calcolato (lato server, vedi
 * services/progress), da mostrare in UI: la formula NON va duplicata nei
 * componenti React.
 */
export interface ProgressScore {
  subjectId: string | 'ALL';
  gradesComponent: number; // 0-100
  activityComponent: number; // 0-100
  total: number; // 0-100, già pesato
  periodStart: string;
  periodEnd: string;
}
