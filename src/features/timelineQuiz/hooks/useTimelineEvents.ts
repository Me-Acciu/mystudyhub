/**
 * src/features/timelineQuiz/hooks/useTimelineEvents.ts
 * ---------------------------------------------------------------------------
 * Query hooks for timeline events.
 * ---------------------------------------------------------------------------
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TimelineEvent } from '@/types/models';
import { fetchTimelineEvents, createTimelineEvent } from '../api/timelineEventsApi';

export const timelineEventsQueryKeys = {
  all: ['timeline-events'] as const,
  byChapter: (chapterId: string) => ['timeline-events', chapterId] as const,
};

export function useTimelineEvents(chapterId: string | undefined) {
  return useQuery<TimelineEvent[]>({
    queryKey: timelineEventsQueryKeys.byChapter(chapterId ?? ''),
    queryFn: () => fetchTimelineEvents(chapterId as string),
    enabled: Boolean(chapterId),
  });
}

export function useCreateTimelineEvent(chapterId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { name: string; startDate: { year: number; month?: number | null; day?: number | null }; endDate?: { year: number; month?: number | null; day?: number | null } | null; }) =>
      createTimelineEvent({ chapterId, ...params }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timelineEventsQueryKeys.byChapter(chapterId) });
    },
  });
}
