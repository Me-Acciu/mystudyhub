/**
 * src/features/flashcards/hooks/useFlashcards.ts
 * ---------------------------------------------------------------------------
 * Hook layer for flashcards and card decks.
 * ---------------------------------------------------------------------------
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Flashcard, FlashcardDeck } from '@/types/models';
import { fetchDecksForChapter, fetchFlashcardsForDeck, createFlashcard } from '../api/flashcardsApi';

export const flashcardsQueryKeys = {
  all: ['flashcards'] as const,
  decks: (chapterId: string) => ['flashcards', 'decks', chapterId] as const,
  cards: (deckId: string) => ['flashcards', deckId] as const,
};

export function useDecksForChapter(chapterId: string | undefined) {
  return useQuery<FlashcardDeck[]>({
    queryKey: flashcardsQueryKeys.decks(chapterId ?? ''),
    queryFn: () => fetchDecksForChapter(chapterId as string),
    enabled: Boolean(chapterId),
  });
}

export function useFlashcardsForDeck(deckId: string | undefined) {
  return useQuery<Flashcard[]>({
    queryKey: flashcardsQueryKeys.cards(deckId ?? ''),
    queryFn: () => fetchFlashcardsForDeck(deckId as string),
    enabled: Boolean(deckId),
  });
}

export function useCreateFlashcard(deckId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { front: string; back: string }) => createFlashcard({ deckId, ...params }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flashcardsQueryKeys.cards(deckId) });
    },
  });
}
