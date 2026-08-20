/**
 * src/features/subjects/screens/ChapterDetailScreen.tsx
 * ---------------------------------------------------------------------------
 * Dettaglio capitolo: mostra l'indicatore di padronanza del capitolo,
 * gli eventi della cronologia, le flashcard e permette di modificare
 * le note/appunti testuali (Sezione 5.4 e 6.1 del documento di design).
 * ---------------------------------------------------------------------------
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, BrainCircuit, Clock, FileText, Award, Edit3, X } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useStudyStore, formatPartialDate } from '@/store/useStudyStore';
import { useThemeStore } from '@/store/useThemeStore';
import { useChapter, useUpdateChapter } from '@/features/chapters/hooks/useChapters';
import { useSubjects } from '@/features/subjects/hooks/useSubjects';
import { Card } from '@/components/ui/Card';
import { AppButton } from '@/components/ui/AppButton';
import type { SubjectsStackParamList } from '@/navigation/MainTabNavigator';
import type { Subject } from '@/types/models';

type Props = NativeStackScreenProps<SubjectsStackParamList, 'ChapterDetail'>;

export function ChapterDetailScreen({ route, navigation }: Props) {
  const { chapterId } = route.params;
  const { data: chapter, isLoading: chapterLoading } = useChapter(chapterId);
  const { data: subjectsData } = useSubjects();
  const subjects = (subjectsData ?? []) as Subject[];
  const updateChapterMutation = useUpdateChapter();
  const { preferences } = useThemeStore();

  const accent = preferences.accentTheme === 'indigo'
    ? '#6366F1'
    : preferences.accentTheme === 'emerald'
    ? '#10B981'
    : '#F59E0B';

  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesText, setNotesText] = useState('');

  useEffect(() => {
    if (chapter) setNotesText(chapter.notes ?? '');
  }, [chapter]);

  if (chapterLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.notFound}>Caricamento capitolo…</Text>
      </SafeAreaView>
    );
  }

  if (!chapter) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.notFound}>Capitolo non trovato.</Text>
      </SafeAreaView>
    );
  }

  const subject = subjects.find((s: Subject) => s.id === chapter.subjectId);
  const { decks, flashcards, timelineEvents } = useStudyStore.getState();
  const events = timelineEvents.filter((e: { chapterId: string }) => e.chapterId === chapterId);
  const deck = decks.find((d: { chapterId: string }) => d.chapterId === chapterId);
  const cards = deck ? flashcards.filter((f: { deckId: string }) => f.deckId === deck.id) : [];

  const consolidatedCards = cards.filter((c) => c.srState === 'consolidata').length;
  const masteryPercentage = cards.length > 0 ? Math.round((consolidatedCards / cards.length) * 100) : 50;

  function handleSaveNotes() {
    updateChapterMutation.mutate({ id: chapterId, notes: notesText });
    setShowNotesModal(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ArrowLeft color="#64748B" size={18} />
          <Text style={styles.backLabel}>{subject?.name ?? 'Materie'}</Text>
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.chapterTitle}>{chapter.name}</Text>

        {/* Mastery Percentage Bar (Sezione 6.1 design doc) */}
        <Card padding={16} style={styles.masteryCard}>
          <View style={styles.masteryHeader}>
            <View style={styles.masteryTitleRow}>
              <Award color={accent} size={16} />
              <Text style={styles.masteryTitle}>Padronanza Capitolo</Text>
            </View>
            <Text style={[styles.masteryValue, { color: accent }]}>{masteryPercentage}%</Text>
          </View>
          <View style={styles.masteryBarTrack}>
            <View style={[styles.masteryBarFill, { width: `${masteryPercentage}%` as any, backgroundColor: accent }]} />
          </View>
          <Text style={styles.masteryHint}>
            {consolidatedCards} su {cards.length} flashcard consolidate con l'algoritmo SM-2
          </Text>
        </Card>

        {/* Notes Preview & Editor Button */}
        <Card padding={16} style={styles.notesCard}>
          <View style={styles.notesHeader}>
            <View style={styles.masteryTitleRow}>
              <FileText color="#F59E0B" size={16} />
              <Text style={styles.notesTitle}>Note & Appunti</Text>
            </View>
            <TouchableOpacity style={styles.editNotesBtn} onPress={() => { setNotesText(chapter.notes ?? ''); setShowNotesModal(true); }}>
              <Edit3 color="#F59E0B" size={14} />
              <Text style={styles.editNotesBtnText}>Modifica</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.chapterNotes} numberOfLines={3}>
            {chapter.notes && chapter.notes.trim() ? chapter.notes : 'Nessuna nota aggiunta a questo capitolo.'}
          </Text>
        </Card>

        {/* CTA Buttons */}
        <View style={styles.ctaRow}>
          <AppButton
            label="Avvia Quiz Datapp"
            onPress={() => navigation.navigate('TimelineQuiz', { chapter })}
            color={accent}
            style={{ flex: 1 }}
          />
        </View>

        {/* Timeline events */}
        <View style={styles.sectionHeader}>
          <Clock color={accent} size={16} />
          <Text style={styles.sectionTitle}>Cronologia degli eventi</Text>
          <Text style={styles.sectionCount}>{events.length}</Text>
        </View>

        {events.length === 0 ? (
          <Card padding={20} style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nessun evento ancora in questo capitolo.</Text>
          </Card>
        ) : (
          events.map((ev, idx) => (
            <View key={ev.id} style={styles.eventRow}>
              {/* Timeline connector */}
              <View style={styles.timelineTrack}>
                <View style={[styles.timelineDot, { backgroundColor: accent }]} />
                {idx < events.length - 1 && <View style={[styles.timelineLine, { backgroundColor: '#1E2D45' }]} />}
              </View>
              {/* Event content */}
              <View style={styles.eventContent}>
                <Text style={[styles.eventDate, { color: accent }]}>{formatPartialDate(ev.startDate)}</Text>
                <Text style={styles.eventName}>{ev.name}</Text>
              </View>
            </View>
          ))
        )}

        {/* Flashcards */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <BrainCircuit color="#8B5CF6" size={16} />
          <Text style={styles.sectionTitle}>Flashcard</Text>
          <Text style={styles.sectionCount}>{cards.length}</Text>
        </View>

        {cards.length === 0 ? (
          <Card padding={20} style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nessuna flashcard in questo capitolo.</Text>
          </Card>
        ) : (
          cards.map((fc) => (
            <Card key={fc.id} style={styles.fcCard} padding={14}>
              <View style={styles.fcHeaderRow}>
                <Text style={styles.fcLabel}>Domanda</Text>
                <Text style={[styles.fcStateTag, fc.srState === 'consolidata' && { color: '#10B981' }]}>
                  {fc.srState === 'consolidata' ? 'Consolidata' : 'In Apprendimento'}
                </Text>
              </View>
              <Text style={styles.fcFront}>{fc.front}</Text>
              <View style={styles.fcDivider} />
              <Text style={styles.fcLabel}>Risposta</Text>
              <Text style={styles.fcBack}>{fc.back}</Text>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Modal Editor Note Capitolo */}
      <Modal visible={showNotesModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Card padding={24} style={styles.notesModalCard}>
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>Appunti di Capitolo</Text>
              <TouchableOpacity onPress={() => setShowNotesModal(false)}>
                <X color="#64748B" size={20} />
              </TouchableOpacity>
            </View>
            <Text style={styles.notesModalHelp}>Scrivi qui i tuoi appunti, formule o riassunti:</Text>
            <TextInput
              style={styles.notesModalInput}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              placeholder="Inserisci qui il testo delle note…"
              placeholderTextColor="#475569"
              value={notesText}
              onChangeText={setNotesText}
            />
            <AppButton
              label="Salva Note"
              onPress={handleSaveNotes}
              color={accent}
            />
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B0F1A' },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  notFound: { color: '#64748B', textAlign: 'center', marginTop: 100 },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backLabel: { fontSize: 13, color: '#64748B', fontWeight: '500' },

  chapterTitle: { fontSize: 24, fontWeight: '800', color: '#F1F5F9', marginBottom: 16 },

  masteryCard: { marginBottom: 12 },
  masteryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  masteryTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  masteryTitle: { fontSize: 13, fontWeight: '700', color: '#F1F5F9' },
  masteryValue: { fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  masteryBarTrack: { height: 6, backgroundColor: '#0B0F1A', borderRadius: 3, marginBottom: 8, overflow: 'hidden' },
  masteryBarFill: { height: 6, borderRadius: 3 },
  masteryHint: { fontSize: 11, color: '#64748B' },

  notesCard: { marginBottom: 20 },
  notesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  notesTitle: { fontSize: 13, fontWeight: '700', color: '#F1F5F9' },
  editNotesBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#431407', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  editNotesBtnText: { fontSize: 11, color: '#F59E0B', fontWeight: '700' },
  chapterNotes: { fontSize: 13, color: '#94A3B8', lineHeight: 19 },

  ctaRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#94A3B8', flex: 1 },
  sectionCount: {
    fontSize: 11,
    color: '#475569',
    backgroundColor: '#131929',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontWeight: '600',
  },

  emptyCard: {},
  emptyText: { fontSize: 13, color: '#475569', textAlign: 'center' },

  // Timeline
  eventRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  timelineTrack: { alignItems: 'center', width: 20 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 3 },
  timelineLine: { width: 1, flex: 1, marginTop: 4, marginBottom: 0 },
  eventContent: { flex: 1, paddingBottom: 16 },
  eventDate: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, fontVariant: ['tabular-nums'], marginBottom: 2 },
  eventName: { fontSize: 14, color: '#CBD5E1', lineHeight: 20 },

  // Flashcards
  fcCard: { marginBottom: 10 },
  fcHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  fcLabel: { fontSize: 10, color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  fcStateTag: { fontSize: 10, color: '#64748B', fontWeight: '600' },
  fcFront: { fontSize: 14, color: '#F1F5F9', fontWeight: '600', marginBottom: 10 },
  fcDivider: { height: 1, backgroundColor: '#1E2D45', marginBottom: 10 },
  fcBack: { fontSize: 13, color: '#94A3B8', lineHeight: 19 },

  // Modal Note
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 },
  notesModalCard: {},
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#F1F5F9' },
  notesModalHelp: { fontSize: 12, color: '#64748B', marginBottom: 12 },
  notesModalInput: {
    backgroundColor: '#0B0F1A',
    borderWidth: 1,
    borderColor: '#1E2D45',
    borderRadius: 12,
    padding: 14,
    color: '#F1F5F9',
    fontSize: 14,
    minHeight: 140,
    marginBottom: 16,
  },
});
