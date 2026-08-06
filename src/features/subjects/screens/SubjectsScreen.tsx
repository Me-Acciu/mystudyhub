/**
 * src/features/subjects/screens/SubjectsScreen.tsx
 * ---------------------------------------------------------------------------
 * Elenco delle materie dello studente (Sezione 6.1 del design doc).
 * Da qui si accede al dettaglio capitolo, dove vivono flashcard, cronologia
 * e note.
 * ---------------------------------------------------------------------------
 */

import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Plus, ChevronRight, BookOpen } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSubjects, useCreateSubject } from '../hooks/useSubjects';
import type { Subject } from '@/types/models';
import type { SubjectsStackParamList } from '@/navigation/MainTabNavigator';

type Props = NativeStackScreenProps<SubjectsStackParamList, 'SubjectsList'>;

/** Palette di colori suggeriti per le nuove materie (Sezione 6.1: colore + icona). */
const SUGGESTED_COLORS = ['#6366F1', '#F59E0B', '#10B981', '#EC4899', '#0EA5E9'];

export function SubjectsScreen({ navigation }: Props) {
  const { data: subjects, isLoading, isError } = useSubjects();
  const createSubjectMutation = useCreateSubject();

  const [isAdding, setIsAdding] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  const handleCreateSubject = () => {
    if (!newSubjectName.trim()) return;
    const color = SUGGESTED_COLORS[Math.floor(Math.random() * SUGGESTED_COLORS.length)];
    createSubjectMutation.mutate(
      { name: newSubjectName, color, icon: 'BookOpen' },
      {
        onSuccess: () => {
          setNewSubjectName('');
          setIsAdding(false);
        },
      }
    );
  };

  const renderSubject = ({ item }: { item: Subject }) => (
    <Pressable
      onPress={() =>
        // Navighiamo alla lista capitoli della materia. La schermata
        // "ChapterDetail" in questa v1 riusa lo stesso stack navigando
        // per subjectId; vedi ChapterDetailScreen per il dettaglio.
        navigation.navigate('ChapterDetail', { chapterId: item.id })
      }
    >
      <Card style={styles.subjectCard}>
        <View style={[styles.iconWrapper, { backgroundColor: item.color }]}>
          <BookOpen size={20} color="#FFFFFF" />
        </View>
        <View style={styles.subjectInfo}>
          <Text style={styles.subjectName}>{item.name}</Text>
        </View>
        <ChevronRight size={20} color="#64748B" />
      </Card>
    </Pressable>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Le tue materie</Text>
        <Pressable onPress={() => setIsAdding((v) => !v)} style={styles.addButton}>
          <Plus size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      {isAdding && (
        <View style={styles.addForm}>
          <TextInput
            value={newSubjectName}
            onChangeText={setNewSubjectName}
            placeholder="Nome materia (es. Storia)"
            placeholderTextColor="#64748B"
            style={styles.addInput}
            maxLength={60}
          />
          <Button
            label="Crea"
            onPress={handleCreateSubject}
            isLoading={createSubjectMutation.isPending}
            style={styles.addSubmit}
          />
        </View>
      )}

      {isLoading && <ActivityIndicator style={styles.loader} color="#6366F1" />}
      {isError && <Text style={styles.errorText}>Errore nel caricamento delle materie.</Text>}

      <FlatList
        data={subjects ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderSubject}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={styles.emptyText}>Nessuna materia ancora. Toccа "+" per crearne una.</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0F172A', paddingHorizontal: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#F1F5F9' },
  addButton: { backgroundColor: '#6366F1', padding: 10, borderRadius: 12 },
  addForm: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  addInput: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#F1F5F9',
  },
  addSubmit: { paddingHorizontal: 16 },
  list: { paddingBottom: 40, gap: 12 },
  subjectCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconWrapper: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  subjectInfo: { flex: 1 },
  subjectName: { fontSize: 16, fontWeight: '700', color: '#F1F5F9' },
  loader: { marginVertical: 20 },
  errorText: { color: '#F87171', textAlign: 'center', marginVertical: 12 },
  emptyText: { color: '#64748B', textAlign: 'center', marginTop: 40 },
});
