/**
 * src/features/chapters/hooks/useChapters.ts
 * ---------------------------------------------------------------------------
 * React Query hooks for Chapters. Follows the same query key factory and
 * mutation patterns used by src/features/subjects/hooks/useSubjects.ts.
 * ---------------------------------------------------------------------------
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Chapter } from '@/types/models';
import { fetchChapters, fetchChapterById, createChapter, updateChapter } from '../api/chaptersApi';

export const chaptersQueryKeys = {
  all: ['chapters'] as const,
  bySubject: (subjectId: string) => ['chapters', subjectId] as const,
};

export function useChapters(subjectId: string | undefined) {
  return useQuery<Chapter[]>({
    queryKey: chaptersQueryKeys.bySubject(subjectId ?? ''),
    queryFn: () => fetchChapters(subjectId as string),
    enabled: Boolean(subjectId),
  });
}

export function useChapter(chapterId: string | undefined) {
  return useQuery<Chapter>({
    queryKey: ['chapters', chapterId ?? ''] as const,
    queryFn: () => fetchChapterById(chapterId as string),
    enabled: Boolean(chapterId),
  });
}

export function useCreateChapter(subjectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; order: number }) => createChapter({ subjectId, ...params }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chaptersQueryKeys.bySubject(subjectId) });
    },
  });
}

export function useUpdateChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateChapter,
    onSuccess: (updatedChapter) => {
      queryClient.invalidateQueries({ queryKey: chaptersQueryKeys.bySubject(updatedChapter.subjectId) });
      queryClient.invalidateQueries({ queryKey: ['chapters', updatedChapter.id] as const });
    },
  });
}
