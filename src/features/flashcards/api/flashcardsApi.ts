/**
 * src/features/flashcards/api/flashcardsApi.ts
 * ---------------------------------------------------------------------------
 * API layer for flashcards and decks following the canonical pattern from
 * subjectsApi.ts: raw Postgres rows are mapped to camelCase domain models
 * in this layer only.
 * ---------------------------------------------------------------------------
 */

import { supabase } from '@/services/supabase/client';
import type { Flashcard, FlashcardDeck } from '@/types/models';
import { sanitizeFreeText, TEXT_FIELD_LIMITS, isNonEmptyName } from '@/utils/validation';

interface FlashcardDeckRow {
  id: string;
  chapter_id: string;
  title: string;
}

interface FlashcardRow {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  sr_state: Flashcard['srState'];
  next_review_date: string | null;
  ease_factor: number;
  interval: number;
}

function mapDeckRow(row: FlashcardDeckRow): FlashcardDeck {
  return {
    id: row.id,
    chapterId: row.chapter_id,
    title: row.title,
  };
}

function mapFlashcardRow(row: FlashcardRow): Flashcard {
  return {
    id: row.id,
    deckId: row.deck_id,
    front: row.front,
    back: row.back,
    srState: row.sr_state,
    nextReviewDate: row.next_review_date,
    easeFactor: row.ease_factor,
    interval: row.interval,
  };
}

export async function fetchDecksForChapter(chapterId: string): Promise<FlashcardDeck[]> {
  const { data, error } = await supabase
    .from('decks')
    .select('id, chapter_id, title')
    .eq('chapter_id', chapterId)
    .order('title', { ascending: true });

  if (error) throw new Error('Impossibile caricare i mazzi. Riprova più tardi.');
  return (data as FlashcardDeckRow[]).map(mapDeckRow);
}

export async function fetchFlashcardsForDeck(deckId: string): Promise<Flashcard[]> {
  const { data, error } = await supabase
    .from('flashcards')
    .select('id, deck_id, front, back, sr_state, next_review_date, ease_factor, interval')
    .eq('deck_id', deckId)
    .order('created_at', { ascending: true });

  if (error) throw new Error('Impossibile caricare le flashcard. Riprova più tardi.');
  return (data as FlashcardRow[]).map(mapFlashcardRow);
}

export async function createFlashcard(params: { deckId: string; front: string; back: string }): Promise<Flashcard> {
  const front = sanitizeFreeText(params.front, TEXT_FIELD_LIMITS.noteText);
  const back = sanitizeFreeText(params.back, TEXT_FIELD_LIMITS.noteText);

  if (!isNonEmptyName(front) || !isNonEmptyName(back)) {
    throw new Error('Front e back delle flashcard non possono essere vuoti.');
  }

  const { data, error } = await supabase
    .from('flashcards')
    .insert({
      deck_id: params.deckId,
      front,
      back,
      sr_state: 'nuova',
      ease_factor: 2.5,
      interval: 0,
    })
    .select('id, deck_id, front, back, sr_state, next_review_date, ease_factor, interval')
    .single();

  if (error) throw new Error('Impossibile creare la flashcard. Riprova più tardi.');
  return mapFlashcardRow(data as FlashcardRow);
}
