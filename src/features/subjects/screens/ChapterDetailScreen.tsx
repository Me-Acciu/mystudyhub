/**
 * src/features/subjects/screens/ChapterDetailScreen.tsx
 * ---------------------------------------------------------------------------
 * Vista Capitolo (Sezione 6.1): mostra in un'unica schermata l'accesso ai
 * tre strumenti di studio del capitolo — Flashcard, Cronologia/Quiz
 * (Datapp) e Note — più il collegamento al Calendario.
 *
 * Nota di integrazione Datapp (Sezione 6.4): la Cronologia NON è più un
 * contenitore indipendente come nel prototipo originale, ma un
 * sotto-modulo raggiungibile solo a partire da un Capitolo. Per questo
 * il pulsante "Quiz Cronologia" qui sotto passa l'intero `Chapter` (non
 * solo il suo id) alla TimelineQuizScreen: è lì che verranno caricati
 * gli eventi collegati a `chapter.id`.
 * ---------------------------------------------------------------------------
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Clock, Layers, FileText, ChevronRight } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Card } from '@/components/ui/Card';
import type { SubjectsStackParamList } from '@/navigation/MainTabNavigator';
import { useChapters } from '../hooks/useSubjects';

type Props = NativeStackScreenProps<SubjectsStackParamList, 'ChapterDetail'>;

export function ChapterDetailScreen({ route, navigation }: Props) {
  // NOTA IMPLEMENTATIVA v1: in questa prima versione dello scaffold la rotta
  // riceve "chapterId" ma lo trattiamo temporaneamente come subjectId per
  // mostrare l'elenco capitoli di una materia; nella prossima iterazione
  // andrà separata una vera schermata "ChaptersList" tra SubjectsScreen e
  // ChapterDetailScreen (annotato anche in TODO più sotto).
  const { chapterId: subjectIdOrChapterId } = route.params;
  const { data: chapters, isLoading } = useChapters(subjectIdOrChapterId);

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <Text style={styles.loadingText}>Caricamento capitoli…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Capitoli</Text>

      {(chapters ?? []).map((chapter) => (
        <Card key={chapter.id} style={styles.chapterCard}>
          <Text style={styles.chapterName}>{chapter.name}</Text>

          <View style={styles.toolsRow}>
            <Pressable
              style={styles.toolButton}
              onPress={() => navigation.navigate('TimelineQuiz', { chapter })}
            >
              <Clock size={16} color="#6366F1" />
              <Text style={styles.toolLabel}>Cronologia / Quiz</Text>
              <ChevronRight size={14} color="#475569" />
            </Pressable>

            {/* TODO (roadmap v1): collegare alla vera schermata Flashcard di studio */}
            <Pressable style={styles.toolButton}>
              <Layers size={16} color="#A855F7" />
              <Text style={styles.toolLabel}>Flashcard</Text>
              <ChevronRight size={14} color="#475569" />
            </Pressable>

            {/* TODO (roadmap v1): editor note testuali del capitolo */}
            <Pressable style={styles.toolButton}>
              <FileText size={16} color="#F59E0B" />
              <Text style={styles.toolLabel}>Note</Text>
              <ChevronRight size={14} color="#475569" />
            </Pressable>
          </View>
        </Card>
      ))}

      {(chapters ?? []).length === 0 && (
        <Text style={styles.emptyText}>Nessun capitolo ancora in questa materia.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0F172A', paddingTop: 60 },
  content: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#F1F5F9', marginBottom: 8 },
  loadingText: { color: '#94A3B8', textAlign: 'center', marginTop: 100 },
  chapterCard: { gap: 12 },
  chapterName: { fontSize: 16, fontWeight: '700', color: '#F1F5F9' },
  toolsRow: { gap: 8 },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  toolLabel: { flex: 1, color: '#E2E8F0', fontSize: 13, fontWeight: '600' },
  emptyText: { color: '#64748B', textAlign: 'center', marginTop: 40 },
});
