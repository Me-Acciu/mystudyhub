/**
 * src/features/chapters/hooks/useChapters.ts
 * ---------------------------------------------------------------------------
 * React Query hooks for Chapters. Follows the same query key factory and
 * mutation patterns used by src/features/subjects/hooks/useSubjects.ts.
 * ---------------------------------------------------------------------------
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchChapters, createChapter } from '../api/chaptersApi';

export const chaptersQueryKeys = {
  all: ['chapters'] as const,
  bySubject: (subjectId: string) => ['chapters', subjectId] as const,
};

export function useChapters(subjectId: string | undefined) {
  return useQuery({
    queryKey: chaptersQueryKeys.bySubject(subjectId ?? ''),
    queryFn: () => fetchChapters(subjectId as string),
    enabled: Boolean(subjectId),
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
