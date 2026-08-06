/**
 * src/features/subjects/hooks/useSubjects.ts
 * ---------------------------------------------------------------------------
 * Hook React Query per Materie e Capitoli.
 *
 * Perché React Query e non "useEffect + fetch + useState" a mano in ogni
 * schermata? Perché ci dà gratis: cache condivisa tra schermate, gestione
 * di loading/error, retry automatico su fallimento di rete, e
 * invalidazione mirata dopo una mutazione (es. "dopo aver creato un
 * capitolo, ricarica solo i capitoli di QUELLA materia").
 *
 * Le "query keys" sono la chiave di tutto: seguono la convenzione
 * gerarchica ['subjects'], ['subjects', subjectId, 'chapters'] così da
 * poter invalidare in modo mirato o a cascata.
 * ---------------------------------------------------------------------------
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { fetchSubjects, createSubject, fetchChapters, createChapter } from '../api/subjectsApi';

export const subjectsQueryKeys = {
  all: ['subjects'] as const,
  chapters: (subjectId: string) => ['subjects', subjectId, 'chapters'] as const,
};

/** Elenco materie dell'utente corrente. */
export function useSubjects() {
  return useQuery({
    queryKey: subjectsQueryKeys.all,
    queryFn: fetchSubjects,
  });
}

/** Mutazione per creare una nuova materia, con invalidazione automatica della lista. */
export function useCreateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectsQueryKeys.all });
    },
  });
}

/** Elenco capitoli di una specifica materia. */
export function useChapters(subjectId: string | undefined) {
  return useQuery({
    queryKey: subjectsQueryKeys.chapters(subjectId ?? ''),
    queryFn: () => fetchChapters(subjectId as string),
    // Evita di lanciare la query finché non abbiamo un subjectId valido
    // (es. schermata in fase di montaggio senza parametri ancora pronti).
    enabled: Boolean(subjectId),
  });
}

/** Mutazione per creare un nuovo capitolo dentro una materia. */
export function useCreateChapter(subjectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; order: number }) => createChapter({ subjectId, ...params }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectsQueryKeys.chapters(subjectId) });
    },
  });
}
