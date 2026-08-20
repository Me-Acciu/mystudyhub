/**
 * src/features/chapters/api/chaptersApi.ts
 * ---------------------------------------------------------------------------
 * API layer for Chapters. Mirrors the canonical implementation in
 * src/features/subjects/api/subjectsApi.ts: maps snake_case DB rows to
 * camelCase domain types, sanitizes free text and throws user-friendly errors.
 * ---------------------------------------------------------------------------
 */

import { supabase } from '@/services/supabase/client';
import type { Chapter } from '@/types/models';
import { sanitizeFreeText, TEXT_FIELD_LIMITS, isNonEmptyName } from '@/utils/validation';

/** Raw chapter row as returned by Postgres (snake_case). */
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

/** Fetch chapters for a given subject, ordered by the chapter "order" field. */
export async function fetchChapters(subjectId: string): Promise<Chapter[]> {
  const { data, error } = await supabase
    .from('chapters')
    .select('id, subject_id, name, "order", status, notes')
    .eq('subject_id', subjectId)
    .order('order', { ascending: true });

  if (error) throw new Error('Impossibile caricare i capitoli. Riprova più tardi.');
  return (data as ChapterRow[]).map(mapChapterRow);
}

/** Fetch a single chapter by its id. */
export async function fetchChapterById(chapterId: string): Promise<Chapter> {
  const { data, error } = await supabase
    .from('chapters')
    .select('id, subject_id, name, "order", status, notes')
    .eq('id', chapterId)
    .single();

  if (error) throw new Error('Impossibile caricare il capitolo. Riprova più tardi.');
  return mapChapterRow(data as ChapterRow);
}

/** Update a chapter's persisted fields. */
export async function updateChapter(params: {
  id: string;
  name?: string;
  status?: Chapter['status'];
  notes?: string | null;
}): Promise<Chapter> {
  const patch: Record<string, string | number | null> = {};

  if (params.name !== undefined) {
    const cleanName = sanitizeFreeText(params.name, TEXT_FIELD_LIMITS.chapterName);
    if (!isNonEmptyName(cleanName)) {
      throw new Error('Il nome del capitolo non può essere vuoto.');
    }
    patch.name = cleanName;
  }

  if (params.status !== undefined) {
    patch.status = params.status;
  }

  if (params.notes !== undefined) {
    const cleanNotes = params.notes === null ? null : sanitizeFreeText(params.notes, TEXT_FIELD_LIMITS.noteText);
    patch.notes = cleanNotes;
  }

  const { data, error } = await supabase
    .from('chapters')
    .update(patch)
    .eq('id', params.id)
    .select('id, subject_id, name, "order", status, notes')
    .single();

  if (error) throw new Error('Impossibile aggiornare il capitolo. Riprova più tardi.');
  return mapChapterRow(data as ChapterRow);
}

/** Create a new chapter appended to a subject. */
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
