/**
 * src/store/useStudyStore.ts
 * ---------------------------------------------------------------------------
 * Store Zustand per i dati locali di studio.
 *
 * In v1 questo store NON è connesso a Supabase: è uno stato locale in-memory
 * con seed data che permettono di sviluppare e testare tutta l'app offline.
 * La struttura dei tipi rispecchia esattamente models.ts, così il passaggio
 * alle API reali richiederà solo di popolare i dati da React Query.
 *
 * Architettura:
 * - I dati "server" (soggetti, capitoli, eventi, voti...) vivono qui localmente
 * - I risultati delle attività (quiz completati, sessioni flashcards SM-2)
 *   vengono salvati qui e usati per calcolare il ProgressScore come da
 *   formula Sezione 9 del design doc:
 *   Punteggio = 0.6 * componenteVoti + 0.4 * componenteAttività
 * ---------------------------------------------------------------------------
 */

import { create } from 'zustand';
import type {
  Subject,
  Chapter,
  TimelineEvent,
  Flashcard,
  FlashcardDeck,
  Grade,
  CalendarEvent,
  ActivityResult,
  StudyClass,
  ClassMembership,
} from '@/types/models';

// ---------------------------------------------------------------------------
// SEED DATA — da mystudyhub_bozza.tsx e datapp.html
// ---------------------------------------------------------------------------

const SEED_SUBJECTS: Subject[] = [
  {
    id: 'sub-1',
    ownerId: 'local-user',
    name: 'Storia Contemporanea',
    color: 'from-amber-500 to-orange-600',
    icon: 'BookOpen',
    sharedWithClassIds: ['cls-1'],
    archived: false,
  },
  {
    id: 'sub-2',
    ownerId: 'local-user',
    name: 'Filosofia',
    color: 'from-purple-500 to-indigo-600',
    icon: 'BrainCircuit',
    sharedWithClassIds: ['cls-1'],
    archived: false,
  },
];

const SEED_CHAPTERS: Chapter[] = [
  {
    id: 'chap-1',
    subjectId: 'sub-1',
    name: 'La Seconda Guerra Mondiale',
    order: 1,
    status: 'in_corso',
    notes: 'Dal 1939 al 1945: principali battaglie e accordi internazionali',
  },
  {
    id: 'chap-2',
    subjectId: 'sub-1',
    name: 'La Guerra Fredda',
    order: 2,
    status: 'da_iniziare',
    notes: 'Tensioni tra blocco occidentale e blocco sovietico (1947–1991)',
  },
  {
    id: 'chap-3',
    subjectId: 'sub-2',
    name: 'Immanuel Kant e il Criticismo',
    order: 1,
    status: 'in_corso',
    notes: 'Critica della Ragion Pura e della Ragion Pratica',
  },
];

const SEED_TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 'ev-1',
    chapterId: 'chap-1',
    name: 'Invasione della Polonia da parte della Germania',
    startDate: { year: 1939, month: 9, day: 1 },
  },
  {
    id: 'ev-2',
    chapterId: 'chap-1',
    name: 'Attacco di Pearl Harbor',
    startDate: { year: 1941, month: 12, day: 7 },
  },
  {
    id: 'ev-3',
    chapterId: 'chap-1',
    name: 'Sbarco in Normandia (D-Day)',
    startDate: { year: 1944, month: 6, day: 6 },
  },
  {
    id: 'ev-4',
    chapterId: 'chap-1',
    name: 'Resa incondizionata della Germania (V-E Day)',
    startDate: { year: 1945, month: 5, day: 8 },
  },
  {
    id: 'ev-5',
    chapterId: 'chap-1',
    name: 'Firma della resa del Giappone — fine del conflitto',
    startDate: { year: 1945, month: 9, day: 2 },
  },
  {
    id: 'ev-6',
    chapterId: 'chap-2',
    name: 'Enunciazione della Dottrina Truman',
    startDate: { year: 1947 },
  },
  {
    id: 'ev-7',
    chapterId: 'chap-2',
    name: 'Costruzione del Muro di Berlino',
    startDate: { year: 1961 },
  },
  {
    id: 'ev-8',
    chapterId: 'chap-2',
    name: 'Crisi dei missili di Cuba',
    startDate: { year: 1962 },
  },
  {
    id: 'ev-9',
    chapterId: 'chap-2',
    name: 'Caduta del Muro di Berlino',
    startDate: { year: 1989 },
  },
  {
    id: 'ev-10',
    chapterId: 'chap-3',
    name: 'Pubblicazione della Critica della Ragion Pura',
    startDate: { year: 1781 },
  },
  {
    id: 'ev-11',
    chapterId: 'chap-3',
    name: 'Pubblicazione della Critica della Ragion Pratica',
    startDate: { year: 1788 },
  },
];

const SEED_DECKS: FlashcardDeck[] = [
  { id: 'deck-1', chapterId: 'chap-1', title: 'WW2 – Concetti chiave' },
  { id: 'deck-2', chapterId: 'chap-3', title: 'Kant – Concetti chiave' },
];

const SEED_FLASHCARDS: Flashcard[] = [
  {
    id: 'fc-1',
    deckId: 'deck-1',
    front: 'Cosa si intende per "Operazione Barbarossa"?',
    back: 'L\'invasione dell\'Unione Sovietica da parte delle forze dell\'Asse, avviata il 22 giugno 1941.',
    srState: 'nuova',
    nextReviewDate: null,
    easeFactor: 2.5,
    interval: 0,
  },
  {
    id: 'fc-2',
    deckId: 'deck-1',
    front: 'Quali nazioni firmarono il Patto Tripartito?',
    back: 'Germania, Italia e Giappone (27 settembre 1940).',
    srState: 'nuova',
    nextReviewDate: null,
    easeFactor: 2.5,
    interval: 0,
  },
  {
    id: 'fc-3',
    deckId: 'deck-1',
    front: 'Cosa simboleggiava la Cortina di Ferro?',
    back: 'La divisione politica, ideologica e militare dell\'Europa durante la Guerra Fredda.',
    srState: 'nuova',
    nextReviewDate: null,
    easeFactor: 2.5,
    interval: 0,
  },
  {
    id: 'fc-4',
    deckId: 'deck-2',
    front: 'Cos\'è un giudizio sintetico a priori?',
    back: 'Un giudizio che aggiunge nuova conoscenza senza derivare dall\'esperienza contingente.',
    srState: 'nuova',
    nextReviewDate: null,
    easeFactor: 2.5,
    interval: 0,
  },
  {
    id: 'fc-5',
    deckId: 'deck-2',
    front: 'Qual è la domanda fondamentale della Critica della Ragion Pura?',
    back: '"Come sono possibili i giudizi sintetici a priori?" — Kant indaga le condizioni di possibilità della conoscenza.',
    srState: 'nuova',
    nextReviewDate: null,
    easeFactor: 2.5,
    interval: 0,
  },
];

const SEED_GRADES: Grade[] = [
  {
    id: 'g-1',
    userId: 'local-user',
    subjectId: 'sub-1',
    value: 8.5,
    scale: 'decimale',
    note: 'Interrogazione su WW1',
    createdAt: '2026-07-20',
  },
  {
    id: 'g-2',
    userId: 'local-user',
    subjectId: 'sub-2',
    value: 7.0,
    scale: 'decimale',
    note: 'Saggio breve su Cartesio',
    createdAt: '2026-07-28',
  },
];

const SEED_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 't-1',
    userId: 'local-user',
    subjectId: 'sub-1',
    title: 'Ripasso date WW2',
    type: 'sessione_studio',
    dateTime: '2026-08-10T09:00:00',
  },
  {
    id: 't-2',
    userId: 'local-user',
    subjectId: 'sub-2',
    title: 'Verifica scritta di Filosofia',
    type: 'verifica',
    dateTime: '2026-08-15T08:30:00',
  },
];

export const SEED_CLASS: StudyClass = {
  id: 'cls-1',
  name: '5ª Liceo Scientifico – Sez. A',
  inviteCode: 'HUB-5A-2026',
  createdBy: 'local-user',
};

export const SEED_MEMBERSHIPS: (ClassMembership & { displayName: string; pawnEmoji: string })[] = [
  {
    classId: 'cls-1',
    userId: 'local-user',
    pawnPosition: 15,
    role: 'membro',
    displayName: 'Marco (Tu)',
    pawnEmoji: '🚀',
    privacy: { showSubjectAndProgress: true },
  },
  {
    classId: 'cls-1',
    userId: 'u-sofia',
    pawnPosition: 17,
    role: 'membro',
    displayName: 'Sofia B.',
    pawnEmoji: '👑',
    privacy: { showSubjectAndProgress: true },
  },
  {
    classId: 'cls-1',
    userId: 'u-luca',
    pawnPosition: 12,
    role: 'membro',
    displayName: 'Luca V.',
    pawnEmoji: '⚡',
    privacy: { showSubjectAndProgress: true },
  },
  {
    classId: 'cls-1',
    userId: 'u-elena',
    pawnPosition: 19,
    role: 'membro',
    displayName: 'Elena R.',
    pawnEmoji: '🦄',
    privacy: { showSubjectAndProgress: true },
  },
  {
    classId: 'cls-1',
    userId: 'u-matteo',
    pawnPosition: 10,
    role: 'membro',
    displayName: 'Matteo G.',
    pawnEmoji: '🛡️',
    privacy: { showSubjectAndProgress: true },
  },
];

// ---------------------------------------------------------------------------
// Store Interface
// ---------------------------------------------------------------------------

interface StudyState {
  subjects: Subject[];
  chapters: Chapter[];
  timelineEvents: TimelineEvent[];
  decks: FlashcardDeck[];
  flashcards: Flashcard[];
  grades: Grade[];
  calendarEvents: CalendarEvent[];
  activityResults: ActivityResult[];
  studyClass: StudyClass;
  memberships: typeof SEED_MEMBERSHIPS;

  // Computed helper: task completate
  completedTaskIds: string[];

  // Azioni — Materie & Capitoli
  addSubject: (name: string) => void;
  addChapter: (subjectId: string, name: string, notes?: string) => void;
  updateChapterNotes: (chapterId: string, notes: string) => void;

  // Azioni — Flashcards SM-2 Spaced Repetition (Sezione 5.5 / 6.3 design doc)
  updateFlashcardSM2: (cardId: string, rating: 1 | 3 | 4 | 5) => void;

  // Azioni — Voti
  addGrade: (subjectId: string, value: number, note?: string) => void;

  // Azioni — Calendario / Task
  addCalendarEvent: (event: Omit<CalendarEvent, 'id' | 'userId'>) => void;
  toggleTaskDone: (eventId: string) => void;

  // Azioni — Quiz & Attività risultati
  saveActivityResult: (type: ActivityResult['type'], correctPercentage: number) => void;

  // Azioni — Backup JSON Export / Import
  exportAllDataJSON: () => string;
  importDataJSON: (jsonString: string) => boolean;
}

/** Genera un ID univoco semplice (UUID-like, locale). */
function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Palette colori per le nuove materie create dall'utente. */
const SUBJECT_COLORS = [
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-yellow-600',
  'from-violet-500 to-purple-600',
];

export const useStudyStore = create<StudyState>()((set, get) => ({
  subjects: SEED_SUBJECTS,
  chapters: SEED_CHAPTERS,
  timelineEvents: SEED_TIMELINE_EVENTS,
  decks: SEED_DECKS,
  flashcards: SEED_FLASHCARDS,
  grades: SEED_GRADES,
  calendarEvents: SEED_CALENDAR_EVENTS,
  activityResults: [],
  studyClass: SEED_CLASS,
  memberships: SEED_MEMBERSHIPS,
  completedTaskIds: [],

  addSubject: (name) => {
    const { subjects } = get();
    const color = SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length];
    const newSub: Subject = {
      id: uid(),
      ownerId: 'local-user',
      name: name.trim(),
      color,
      icon: 'BookOpen',
      sharedWithClassIds: [],
      archived: false,
    };
    set((s) => ({ subjects: [...s.subjects, newSub] }));
  },

  addChapter: (subjectId, name, notes) => {
    const existing = get().chapters.filter((c) => c.subjectId === subjectId);
    const newChapter: Chapter = {
      id: uid(),
      subjectId,
      name: name.trim(),
      order: existing.length + 1,
      status: 'da_iniziare',
      notes: notes ?? null,
    };
    set((s) => ({ chapters: [...s.chapters, newChapter] }));
  },

  updateChapterNotes: (chapterId, notes) => {
    set((s) => ({
      chapters: s.chapters.map((c) => (c.id === chapterId ? { ...c, notes } : c)),
    }));
  },

  // Algoritmo SM-2 Spaced Repetition (SuperMemo 2) — Sez. 5.5 & 6.3 del design doc
  updateFlashcardSM2: (cardId, rating) => {
    set((s) => {
      const card = s.flashcards.find((f) => f.id === cardId);
      if (!card) return s;

      const q = rating; // 1: Ancora, 3: Difficile, 4: Buono, 5: Facile
      let { easeFactor, interval } = card;

      // 1) Ricalcolo Ease Factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
      easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
      if (easeFactor < 1.3) easeFactor = 1.3;

      // 2) Ricalcolo Intervallo (giorni) e Stato Spaced Repetition
      let srState: Flashcard['srState'] = card.srState;

      if (q < 3) {
        // Ripetizione fallita (Ancora) -> azzera intervallo a 1 giorno
        interval = 1;
        srState = 'in_apprendimento';
      } else {
        // Ripetizione riuscita
        if (interval === 0) {
          interval = 1;
        } else if (interval === 1) {
          interval = 6;
        } else {
          interval = Math.round(interval * easeFactor);
        }

        if (q === 5 || interval >= 14) {
          srState = 'consolidata';
        } else {
          srState = 'in_apprendimento';
        }
      }

      // Prossima data di revisione
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + interval);
      const nextReviewDate = nextDate.toISOString().split('T')[0];

      const updatedCards = s.flashcards.map((f) =>
        f.id === cardId ? { ...f, easeFactor, interval, srState, nextReviewDate } : f
      );

      return { flashcards: updatedCards };
    });
  },

  addGrade: (subjectId, value, note) => {
    const newGrade: Grade = {
      id: uid(),
      userId: 'local-user',
      subjectId,
      value,
      scale: 'decimale',
      note: note ?? null,
      createdAt: new Date().toISOString().split('T')[0],
    };
    set((s) => ({ grades: [newGrade, ...s.grades] }));
  },

  addCalendarEvent: (event) => {
    const newEvent: CalendarEvent = { id: uid(), userId: 'local-user', ...event };
    set((s) => ({ calendarEvents: [newEvent, ...s.calendarEvents] }));
  },

  toggleTaskDone: (eventId) => {
    set((s) => {
      const already = s.completedTaskIds.includes(eventId);
      return {
        completedTaskIds: already
          ? s.completedTaskIds.filter((id) => id !== eventId)
          : [...s.completedTaskIds, eventId],
      };
    });
  },

  saveActivityResult: (type, correctPercentage) => {
    const result: ActivityResult = {
      id: uid(),
      userId: 'local-user',
      type,
      correctPercentage,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ activityResults: [result, ...s.activityResults] }));
  },

  exportAllDataJSON: () => {
    const { subjects, chapters, timelineEvents, decks, flashcards, grades, calendarEvents } = get();
    const backupObj = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      subjects,
      chapters,
      timelineEvents,
      decks,
      flashcards,
      grades,
      calendarEvents,
    };
    return JSON.stringify(backupObj, null, 2);
  },

  importDataJSON: (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (data && Array.isArray(data.subjects) && Array.isArray(data.chapters)) {
        set({
          subjects: data.subjects,
          chapters: data.chapters,
          timelineEvents: data.timelineEvents ?? [],
          decks: data.decks ?? [],
          flashcards: data.flashcards ?? [],
          grades: data.grades ?? [],
          calendarEvents: data.calendarEvents ?? [],
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
}));

// ---------------------------------------------------------------------------
// Selettori / helper calcolati
// ---------------------------------------------------------------------------

/**
 * Calcola il ProgressScore locale dell'utente (formula Sezione 9):
 * totale = 0.6 * componenteVoti + 0.4 * componenteAttività
 */
export function computeProgressScore(
  grades: Grade[],
  activityResults: ActivityResult[]
): { gradesComponent: number; activityComponent: number; total: number } {
  const avgGrade =
    grades.length > 0
      ? grades.reduce((acc, g) => acc + g.value, 0) / grades.length
      : 7.0;
  const gradesComponent = (avgGrade / 10) * 100; // normalizza 0-100

  const avgActivity =
    activityResults.length > 0
      ? activityResults.slice(0, 10).reduce((acc, r) => acc + r.correctPercentage, 0) /
        Math.min(activityResults.length, 10)
      : 0;
  const activityComponent = avgActivity; // già 0-100

  const total = Math.round(0.6 * gradesComponent + 0.4 * activityComponent);
  return { gradesComponent: Math.round(gradesComponent), activityComponent: Math.round(activityComponent), total };
}

/** Formatta una PartialDate in stringa leggibile. */
export function formatPartialDate(date: { year: number; month?: number | null; day?: number | null }): string {
  const MONTHS = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
  ];
  if (date.day && date.month) return `${date.day} ${MONTHS[date.month - 1]} ${date.year}`;
  if (date.month) return `${MONTHS[date.month - 1]} ${date.year}`;
  return `${date.year}`;
}
