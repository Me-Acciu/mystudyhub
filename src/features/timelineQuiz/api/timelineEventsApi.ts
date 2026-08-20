/**
 * src/features/timelineQuiz/api/timelineEventsApi.ts
 * ---------------------------------------------------------------------------
 * API layer for timeline events; mapped to domain PartialDate types.
 * ---------------------------------------------------------------------------
 */

import { supabase } from '@/services/supabase/client';
import type { PartialDate, TimelineEvent } from '@/types/models';
import { sanitizeFreeText, TEXT_FIELD_LIMITS, isNonEmptyName } from '@/utils/validation';

interface TimelineEventRow {
  id: string;
  chapter_id: string;
  name: string;
  start_year: number;
  start_month: number | null;
  start_day: number | null;
  end_year: number | null;
  end_month: number | null;
  end_day: number | null;
}

function mapPartialDate(rowYear: number | null, rowMonth: number | null, rowDay: number | null): PartialDate {
  return {
    year: rowYear ?? new Date().getFullYear(),
    month: rowMonth ?? undefined,
    day: rowDay ?? undefined,
  };
}

function mapTimelineEventRow(row: TimelineEventRow): TimelineEvent {
  return {
    id: row.id,
    chapterId: row.chapter_id,
    name: row.name,
    startDate: mapPartialDate(row.start_year, row.start_month, row.start_day),
    endDate: row.end_year
      ? {
          year: row.end_year,
          month: row.end_month ?? undefined,
          day: row.end_day ?? undefined,
        }
      : null,
  };
}

export async function fetchTimelineEvents(chapterId: string): Promise<TimelineEvent[]> {
  const { data, error } = await supabase
    .from('timeline_events')
    .select('id, chapter_id, name, start_year, start_month, start_day, end_year, end_month, end_day')
    .eq('chapter_id', chapterId)
    .order('start_year', { ascending: true });

  if (error) throw new Error('Impossibile caricare gli eventi della cronologia. Riprova più tardi.');
  return (data as TimelineEventRow[]).map(mapTimelineEventRow);
}

export async function createTimelineEvent(params: {
  chapterId: string;
  name: string;
  startDate: PartialDate;
  endDate?: PartialDate | null;
}): Promise<TimelineEvent> {
  const cleanName = sanitizeFreeText(params.name, TEXT_FIELD_LIMITS.eventName);
  if (!isNonEmptyName(cleanName)) {
    throw new Error('Il nome dell\'evento non può essere vuoto.');
  }

  const { data, error } = await supabase
    .from('timeline_events')
    .insert({
      chapter_id: params.chapterId,
      name: cleanName,
      start_year: params.startDate.year,
      start_month: params.startDate.month ?? null,
      start_day: params.startDate.day ?? null,
      end_year: params.endDate?.year ?? null,
      end_month: params.endDate?.month ?? null,
      end_day: params.endDate?.day ?? null,
    })
    .select('id, chapter_id, name, start_year, start_month, start_day, end_year, end_month, end_day')
    .single();

  if (error) throw new Error('Impossibile creare l\'evento cronologico. Riprova più tardi.');
  return mapTimelineEventRow(data as TimelineEventRow);
}
