/**
 * src/features/subjects/api/subjectsApi.ts
 * ---------------------------------------------------------------------------
 * Unico punto di contatto con Supabase per Materie e Capitoli.
 *
 * Regola architetturale importante: NESSUN componente UI importa mai
 * `supabase` direttamente. Passa sempre da qui (o dall'equivalente "api.ts"
 * della propria feature). Questo:
 * - isola lo schema del database (nomi tabelle/colonne snake_case) dal
 *   resto dell'app, che lavora solo con i tipi camelCase di src/types,
 * - rende testabile la UI mockando queste funzioni, senza toccare Supabase,
 * - è il posto giusto dove, in futuro, aggiungere retry/caching a basso
 *   livello se necessario.
 *
 * Sicurezza: qui NON serve controllare manualmente "questa materia è mia?"
 * prima di ogni query — è compito delle policy RLS su Postgres (Sezione
 * 8.4). Le funzioni qui sotto si limitano a passare `owner_id: user.id`
 * in scrittura; è la RLS a impedire che un utente legga/scriva materie di
 * qualcun altro anche in caso di bug lato client.
 * ---------------------------------------------------------------------------
 */

import { supabase } from '@/services/supabase/client';
import type { Subject, Chapter } from '@/types/models';
import { sanitizeFreeText, TEXT_FIELD_LIMITS, isNonEmptyName } from '@/utils/validation';

/** Riga grezza come restituita da Postgres (snake_case). */
interface SubjectRow {
  id: string;
  owner_id: string;
  name: string;
  color: string;
  icon: string;
  shared_with_class_ids: string[] | null;
  archived: boolean;
}

function mapSubjectRow(row: SubjectRow): Subject {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    sharedWithClassIds: row.shared_with_class_ids ?? [],
    archived: row.archived,
  };
}

/** Recupera tutte le materie NON archiviate dell'utente corrente. */
export async function fetchSubjects(): Promise<Subject[]> {
  const { data, error } = await supabase
    .from('subjects')
    .select('id, owner_id, name, color, icon, shared_with_class_ids, archived')
    .eq('archived', false)
    .order('name', { ascending: true });

  if (error) throw new Error('Impossibile caricare le materie. Riprova più tardi.');
  return (data as SubjectRow[]).map(mapSubjectRow);
}

/**
 * Crea una nuova materia per l'utente corrente.
 * Il nome viene validato e sanitizzato PRIMA di essere inviato al backend.
 */
export async function createSubject(params: { name: string; color: string; icon: string }): Promise<Subject> {
  const cleanName = sanitizeFreeText(params.name, TEXT_FIELD_LIMITS.subjectName);
  if (!isNonEmptyName(cleanName)) {
    throw new Error('Il nome della materia non può essere vuoto.');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Devi effettuare l\'accesso per creare una materia.');

  const { data, error } = await supabase
    .from('subjects')
    .insert({
      owner_id: user.id, // la RLS verificherà comunque che owner_id === auth.uid()
      name: cleanName,
      color: params.color,
      icon: params.icon,
      archived: false,
    })
    .select('id, owner_id, name, color, icon, shared_with_class_ids, archived')
    .single();

  if (error) throw new Error('Impossibile creare la materia. Riprova più tardi.');
  return mapSubjectRow(data as SubjectRow);
}

/** Riga grezza Capitolo come restituita da Postgres. */
interface ChapterRow {
  id: string;
  subject_id: string;
  name: string;
  order: number;
  status: Chapter['status'];
  notes: string | null;
}

function mapChapterRow(row: ChapterRow): Chapter {
  return {
    id: row.id,
    subjectId: row.subject_id,
    name: row.name,
    order: row.order,
    status: row.status,
    notes: row.notes,
  };
}

/** Recupera i capitoli di una materia, ordinati secondo l'ordine scelto dallo studente. */
export async function fetchChapters(subjectId: string): Promise<Chapter[]> {
  const { data, error } = await supabase
    .from('chapters')
    .select('id, subject_id, name, "order", status, notes')
    .eq('subject_id', subjectId)
    .order('order', { ascending: true });

  if (error) throw new Error('Impossibile caricare i capitoli. Riprova più tardi.');
  return (data as ChapterRow[]).map(mapChapterRow);
}

/** Crea un nuovo capitolo in coda a una materia. */
export async function createChapter(params: { subjectId: string; name: string; order: number }): Promise<Chapter> {
  const cleanName = sanitizeFreeText(params.name, TEXT_FIELD_LIMITS.chapterName);
  if (!isNonEmptyName(cleanName)) {
    throw new Error('Il nome del capitolo non può essere vuoto.');
  }

  const { data, error } = await supabase
    .from('chapters')
    .insert({
      subject_id: params.subjectId,
      name: cleanName,
      order: params.order,
      status: 'da_iniziare',
    })
    .select('id, subject_id, name, "order", status, notes')
    .single();

  if (error) throw new Error('Impossibile creare il capitolo. Riprova più tardi.');
  return mapChapterRow(data as ChapterRow);
}
