/**
 * src/features/subjects/screens/SubjectsScreen.tsx
 * ---------------------------------------------------------------------------
 * Lista materie + capitoli. Usa lo store locale (useStudyStore) in v1,
 * pronto per essere collegato alle query Supabase quando il DB sarà attivo.
 * ---------------------------------------------------------------------------
 */

import React, { useState } from 'react';
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
import { Plus, BookOpen, Clock, Layers, ChevronRight, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useStudyStore } from '@/store/useStudyStore';
import { useThemeStore } from '@/store/useThemeStore';
import { Card } from '@/components/ui/Card';
import { AppButton } from '@/components/ui/AppButton';
import type { SubjectsStackParamList } from '@/navigation/MainTabNavigator';
import type { Chapter } from '@/types/models';

type NavProp = NativeStackNavigationProp<SubjectsStackParamList>;

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  da_iniziare: { label: 'Da iniziare', color: '#475569' },
  in_corso:    { label: 'In corso',    color: '#6366F1' },
  completato:  { label: 'Completato',  color: '#10B981' },
};

export function SubjectsScreen() {
  const navigation = useNavigation<NavProp>();
  const { subjects, chapters, timelineEvents, flashcards, decks, addSubject } = useStudyStore();
  const { preferences } = useThemeStore();

  const accent = preferences.accentTheme === 'indigo'
    ? '#6366F1'
    : preferences.accentTheme === 'emerald'
    ? '#10B981'
    : '#F59E0B';

  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubName, setNewSubName] = useState('');

  function handleAddSubject() {
    if (!newSubName.trim()) return;
    addSubject(newSubName);
    setNewSubName('');
    setShowAddSubject(false);
  }

  function goToQuiz(chapter: Chapter) {
    navigation.navigate('TimelineQuiz', { chapter });
  }

  function goToChapter(chapter: Chapter) {
    navigation.navigate('ChapterDetail', { chapterId: chapter.id });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Materie e Capitoli</Text>
            <Text style={styles.subtitle}>Organizza i contenuti per capitolo</Text>
          </View>
          <TouchableOpacity style={[styles.addTopBtn, { backgroundColor: accent }]} onPress={() => setShowAddSubject(true)} activeOpacity={0.8}>
            <Plus color="#fff" size={18} />
          </TouchableOpacity>
        </View>

        {subjects.length === 0 && (
          <Card style={styles.emptyCard} padding={24}>
            <BookOpen color="#475569" size={32} style={{ marginBottom: 12, alignSelf: 'center' }} />
            <Text style={styles.emptyText}>Nessuna materia ancora.</Text>
            <Text style={styles.emptyHint}>Tocca + per aggiungerne una.</Text>
          </Card>
        )}

        {subjects.map((subject) => {
          const subChapters = chapters.filter((c) => c.subjectId === subject.id);
          return (
            <Card key={subject.id} style={styles.subjectCard} padding={0}>
              <View style={[styles.subjectHeader, { borderBottomColor: '#1E2D45' }]}>
                <View style={[styles.subjectAvatar, { backgroundColor: accent }]}>
                  <Text style={styles.subjectAvatarText}>{subject.name.substring(0, 2).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.subjectName}>{subject.name}</Text>
                  <Text style={styles.subjectMeta}>{subChapters.length} capitoli</Text>
                </View>
              </View>

              {subChapters.length === 0 ? (
                <View style={styles.noChapters}>
                  <Text style={styles.noChaptersText}>Nessun capitolo ancora.</Text>
                </View>
              ) : (
                subChapters.map((chap, idx) => {
                  const eventsCount = timelineEvents.filter((e) => e.chapterId === chap.id).length;
                  const deck = decks.find((d) => d.chapterId === chap.id);
                  const fcCount = deck ? flashcards.filter((f) => f.deckId === deck.id).length : 0;
                  const status = STATUS_LABELS[chap.status] ?? STATUS_LABELS.da_iniziare;

                  return (
                    <View
                      key={chap.id}
                      style={[styles.chapterRow, idx < subChapters.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#1E2D45' }]}
                    >
                      <TouchableOpacity style={styles.chapterMain} onPress={() => goToChapter(chap)} activeOpacity={0.7}>
                        <View style={styles.chapterTitleRow}>
                          <Text style={styles.chapterName}>{chap.name}</Text>
                          <View style={[styles.statusBadge, { borderColor: status.color }]}>
                            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                          </View>
                        </View>
                        {chap.notes ? <Text style={styles.chapterNotes} numberOfLines={1}>{chap.notes}</Text> : null}
                        <View style={styles.chapterStats}>
                          <View style={styles.statPill}><Clock color="#6366F1" size={11} /><Text style={styles.statText}>{eventsCount} Date</Text></View>
                          <View style={styles.statPill}><Layers color="#8B5CF6" size={11} /><Text style={styles.statText}>{fcCount} Flashcard</Text></View>
                        </View>
                      </TouchableOpacity>
                      <View style={styles.chapterActions}>
                        <TouchableOpacity style={[styles.actionBtn, { borderColor: accent }]} onPress={() => goToQuiz(chap)} activeOpacity={0.75}>
                          <Text style={[styles.actionBtnText, { color: accent }]}>Quiz</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, { borderColor: '#8B5CF6' }]} onPress={() => goToChapter(chap)} activeOpacity={0.75}>
                          <ChevronRight color="#8B5CF6" size={14} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </Card>
          );
        })}
      </ScrollView>

      {/* Modal Aggiungi Materia */}
      <Modal visible={showAddSubject} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard} padding={24}>
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>Nuova materia</Text>
              <TouchableOpacity onPress={() => setShowAddSubject(false)}><X color="#64748B" size={20} /></TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>Nome materia</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Es. Matematica, Latino, Fisica…"
              placeholderTextColor="#475569"
              value={newSubName}
              onChangeText={setNewSubName}
              autoFocus
              maxLength={60}
            />
            <AppButton label="Crea materia" onPress={handleAddSubject} color={accent} style={{ marginTop: 4 }} />
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#F1F5F9' },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  addTopBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emptyCard: { alignItems: 'center' },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#475569', textAlign: 'center' },
  emptyHint: { fontSize: 12, color: '#334155', textAlign: 'center', marginTop: 4 },
  subjectCard: { marginBottom: 16, overflow: 'hidden' },
  subjectHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1 },
  subjectAvatar: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  subjectAvatarText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  subjectName: { fontSize: 16, fontWeight: '700', color: '#F1F5F9' },
  subjectMeta: { fontSize: 12, color: '#64748B', marginTop: 1 },
  noChapters: { padding: 16 },
  noChaptersText: { fontSize: 12, color: '#475569', textAlign: 'center' },
  chapterRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 8 },
  chapterMain: { flex: 1 },
  chapterTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  chapterName: { fontSize: 14, fontWeight: '600', color: '#CBD5E1', flex: 1 },
  statusBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  statusText: { fontSize: 10, fontWeight: '700' },
  chapterNotes: { fontSize: 11, color: '#475569', marginBottom: 6 },
  chapterStats: { flexDirection: 'row', gap: 8 },
  statPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 11, color: '#64748B' },
  chapterActions: { flexDirection: 'row', gap: 6 },
  actionBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { fontSize: 11, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 },
  modalCard: {},
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#F1F5F9' },
  modalLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalInput: { backgroundColor: '#0B0F1A', borderWidth: 1, borderColor: '#1E2D45', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, color: '#F1F5F9', fontSize: 14, marginBottom: 12 },
});
