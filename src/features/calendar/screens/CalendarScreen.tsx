/**
 * src/features/calendar/screens/CalendarScreen.tsx
 * ---------------------------------------------------------------------------
 * Agenda & Tracciamento Voti (Sezione 6.6 del design doc).
 * Mostra: task/scadenze con checkbox, voti registrati con media, form aggiungi voto.
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
import { Award, Calendar, Plus, Check, X } from 'lucide-react-native';

import { useStudyStore } from '@/store/useStudyStore';
import { useThemeStore } from '@/store/useThemeStore';
import { Card } from '@/components/ui/Card';
import { AppButton } from '@/components/ui/AppButton';

export function CalendarScreen() {
  const {
    calendarEvents,
    grades,
    subjects,
    completedTaskIds,
    toggleTaskDone,
    addGrade,
    addCalendarEvent,
  } = useStudyStore();
  const { preferences } = useThemeStore();

  const accent = preferences.accentTheme === 'indigo'
    ? '#6366F1'
    : preferences.accentTheme === 'emerald'
    ? '#10B981'
    : '#F59E0B';

  const [showAddGrade, setShowAddGrade] = useState(false);
  const [gradeValue, setGradeValue] = useState('');
  const [gradeSub, setGradeSub] = useState('');
  const [gradeNote, setGradeNote] = useState('');

  const avgGrade =
    grades.length > 0
      ? (grades.reduce((acc, g) => acc + g.value, 0) / grades.length).toFixed(2)
      : '—';

  function handleAddGrade() {
    const val = parseFloat(gradeValue);
    if (!gradeSub || isNaN(val) || val < 1 || val > 10) return;
    const sub = subjects.find((s) => s.name === gradeSub || s.id === gradeSub);
    addGrade(sub?.id ?? gradeSub, val, gradeNote || undefined);
    setGradeValue('');
    setGradeNote('');
    setGradeSub('');
    setShowAddGrade(false);
  }

  const TYPE_LABELS: Record<string, string> = {
    verifica: 'Verifica',
    scadenza: 'Scadenza',
    sessione_studio: 'Studio',
    altro: 'Altro',
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Agenda & Voti</Text>
            <Text style={styles.subtitle}>Scadenze e registro personale</Text>
          </View>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: accent }]} onPress={() => setShowAddGrade(true)} activeOpacity={0.8}>
            <Plus color="#fff" size={18} />
          </TouchableOpacity>
        </View>

        {/* ── Scadenze ────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Calendar color={accent} size={16} />
          <Text style={styles.sectionTitle}>Prossime scadenze</Text>
        </View>

        {calendarEvents.length === 0 ? (
          <Card padding={20} style={{ marginBottom: 24 }}>
            <Text style={styles.emptyText}>Nessuna scadenza registrata.</Text>
          </Card>
        ) : (
          calendarEvents.map((ev) => {
            const done = completedTaskIds.includes(ev.id);
            const date = ev.dateTime.split('T')[0];
            const typeLabel = TYPE_LABELS[ev.type] ?? ev.type;
            return (
              <Card key={ev.id} style={[styles.taskCard, done ? styles.taskCardDone : undefined]} padding={14}>
                <View style={styles.taskRow}>
                  <TouchableOpacity
                    style={[styles.checkbox, done && { backgroundColor: accent, borderColor: accent }]}
                    onPress={() => toggleTaskDone(ev.id)}
                    activeOpacity={0.8}
                  >
                    {done && <Check color="#fff" size={12} />}
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.taskTitle, done && styles.taskDone]}>{ev.title}</Text>
                    <Text style={styles.taskMeta}>{date} • {ev.subjectId ? (subjects.find(s => s.id === ev.subjectId)?.name ?? '') : ''}</Text>
                  </View>
                  <View style={[styles.typePill, ev.type === 'verifica' && { borderColor: '#EF4444' }]}>
                    <Text style={[styles.typePillText, ev.type === 'verifica' && { color: '#EF4444' }]}>{typeLabel}</Text>
                  </View>
                </View>
              </Card>
            );
          })
        )}

        {/* ── Voti ─────────────────────────────────────────── */}
        <View style={[styles.sectionHeader, { marginTop: 8 }]}>
          <Award color="#F59E0B" size={16} />
          <Text style={styles.sectionTitle}>Voti registrati</Text>
          <Text style={styles.sectionAvg}>Media: <Text style={{ color: '#F59E0B', fontWeight: '800' }}>{avgGrade}</Text></Text>
        </View>

        {grades.length === 0 ? (
          <Card padding={20}>
            <Text style={styles.emptyText}>Nessun voto ancora. Tocca + per registrarne uno.</Text>
          </Card>
        ) : (
          grades.map((g) => {
            const sub = subjects.find((s) => s.id === g.subjectId);
            const gradeColor = g.value >= 8 ? '#10B981' : g.value >= 6 ? '#F59E0B' : '#EF4444';
            return (
              <Card key={g.id} style={styles.gradeCard} padding={14}>
                <View style={styles.gradeRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.gradeSubject}>{sub?.name ?? 'Materia sconosciuta'}</Text>
                    <Text style={styles.gradeMeta}>{g.note ?? 'Voto'} • {g.createdAt}</Text>
                  </View>
                  <View style={[styles.gradeBadge, { borderColor: gradeColor, backgroundColor: `${gradeColor}1A` }]}>
                    <Text style={[styles.gradeValue, { color: gradeColor }]}>{g.value}</Text>
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Modal Aggiungi Voto */}
      <Modal visible={showAddGrade} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Card padding={24}>
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>Registra un voto</Text>
              <TouchableOpacity onPress={() => setShowAddGrade(false)}><X color="#64748B" size={20} /></TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Materia</Text>
            <View style={styles.subjectPills}>
              {subjects.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.subjectPill, gradeSub === s.id && { backgroundColor: accent, borderColor: accent }]}
                  onPress={() => setGradeSub(s.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.subjectPillText, gradeSub === s.id && { color: '#fff' }]}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Voto (1–10)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Es. 8.5"
              placeholderTextColor="#475569"
              value={gradeValue}
              onChangeText={setGradeValue}
              keyboardType="decimal-pad"
              maxLength={5}
            />

            <Text style={styles.fieldLabel}>Nota (facoltativa)</Text>
            <TextInput
              style={[styles.modalInput, { marginBottom: 16 }]}
              placeholder="Es. Interrogazione capitolo 2"
              placeholderTextColor="#475569"
              value={gradeNote}
              onChangeText={setGradeNote}
              maxLength={100}
            />

            <AppButton label="Salva voto" onPress={handleAddGrade} color={accent} />
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
  addBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#94A3B8', flex: 1 },
  sectionAvg: { fontSize: 12, color: '#64748B' },
  emptyText: { fontSize: 13, color: '#475569', textAlign: 'center' },

  taskCard: { marginBottom: 10 },
  taskCardDone: { opacity: 0.55 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  taskTitle: { fontSize: 14, fontWeight: '600', color: '#CBD5E1', marginBottom: 2 },
  taskDone: { textDecorationLine: 'line-through', color: '#475569' },
  taskMeta: { fontSize: 11, color: '#475569' },
  typePill: { borderWidth: 1, borderColor: '#334155', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  typePillText: { fontSize: 10, fontWeight: '700', color: '#64748B' },

  gradeCard: { marginBottom: 10 },
  gradeRow: { flexDirection: 'row', alignItems: 'center' },
  gradeSubject: { fontSize: 14, fontWeight: '700', color: '#F1F5F9', marginBottom: 2 },
  gradeMeta: { fontSize: 11, color: '#475569' },
  gradeBadge: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  gradeValue: { fontSize: 20, fontWeight: '900', fontVariant: ['tabular-nums'] },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#F1F5F9' },
  fieldLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  subjectPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  subjectPill: { borderWidth: 1, borderColor: '#1E2D45', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  subjectPillText: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
  modalInput: { backgroundColor: '#0B0F1A', borderWidth: 1, borderColor: '#1E2D45', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, color: '#F1F5F9', fontSize: 14, marginBottom: 12 },
});
