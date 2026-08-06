/**
 * src/features/home/screens/HomeScreen.tsx
 * ---------------------------------------------------------------------------
 * Dashboard principale — traduzione fedele del tab "dashboard" dalla bozza,
 * con il design system applicato (midnight bg, DM Mono per numeri, amber pedina).
 *
 * Struttura:
 *  1. Saluto + CTA "Avvia Quiz Rapido"
 *  2. 4 metric card (materie attive, media voti, punteggio pedina, streak)
 *  3. Banner sfida di classe
 *  4. Lista materie con capitoli e quick-action quiz
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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Layers, TrendingUp, Trophy, Flame, Play, ChevronRight, Plus, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useStudyStore, computeProgressScore } from '@/store/useStudyStore';
import { useThemeStore } from '@/store/useThemeStore';
import { Card } from '@/components/ui/Card';
import { AppButton } from '@/components/ui/AppButton';
import type { SubjectsStackParamList } from '@/navigation/MainTabNavigator';

// Navigation type per navigare al quiz da qui
type SubjectsNavProp = NativeStackNavigationProp<SubjectsStackParamList>;

export function HomeScreen() {
  const { subjects, chapters, grades, activityResults, addSubject } = useStudyStore();
  const { preferences } = useThemeStore();
  const { gradesComponent, activityComponent, total } = computeProgressScore(grades, activityResults);

  const avgGrade =
    grades.length > 0
      ? (grades.reduce((acc, g) => acc + g.value, 0) / grades.length).toFixed(1)
      : '7.0';

  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubName, setNewSubName] = useState('');

  function handleAddSubject() {
    if (!newSubName.trim()) return;
    addSubject(newSubName);
    setNewSubName('');
    setShowAddModal(false);
  }

  // Colore accent dal tema
  const accent = preferences.accentTheme === 'indigo'
    ? '#6366F1'
    : preferences.accentTheme === 'emerald'
    ? '#10B981'
    : '#F59E0B';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Bentornato, Marco! 👋</Text>
            <Text style={styles.subGreeting}>La tua situazione di studio aggiornata.</Text>
          </View>
        </View>

        {/* CTA Quiz Rapido */}
        <TouchableOpacity style={[styles.quizCTA, { backgroundColor: accent }]} activeOpacity={0.8}>
          <Play color="#fff" size={18} />
          <Text style={styles.quizCTALabel}>Avvia Quiz Rapido</Text>
        </TouchableOpacity>

        {/* ── Metriche ───────────────────────────────────── */}
        <View style={styles.metricsGrid}>
          <MetricCard
            icon={<Layers color="#6366F1" size={22} />}
            iconBg="#1e1b4b"
            label="Materie attive"
            value={`${subjects.filter(s => !s.archived).length}`}
          />
          <MetricCard
            icon={<TrendingUp color="#10B981" size={22} />}
            iconBg="#064e3b"
            label="Media voti"
            value={`${avgGrade}`}
            unit="/ 10"
          />
          <MetricCard
            icon={<Trophy color="#F59E0B" size={22} />}
            iconBg="#431407"
            label="Punteggio"
            value={`${total}`}
            unit="pt"
            valueColor="#F59E0B"
          />
          <MetricCard
            icon={<Flame color="#A78BFA" size={22} />}
            iconBg="#2e1065"
            label="Streak studio"
            value="5 🔥"
          />
        </View>

        {/* ── Banner Classe ───────────────────────────────── */}
        <Card style={styles.classBanner} padding={20}>
          <View style={styles.bannerBadge}>
            <Trophy color="#F59E0B" size={12} />
            <Text style={styles.bannerBadgeText}>Posizione in Classe: 2° Posto</Text>
          </View>
          <Text style={styles.bannerTitle}>Sfida di Classe – 5ª Liceo Scientifico</Text>
          <Text style={styles.bannerBody}>
            La tua pedina {preferences.pawnEmoji} è alla casella 15! Ti mancano solo 7 punti per raggiungere Sofia.
          </Text>
          <TouchableOpacity style={[styles.bannerBtn, { backgroundColor: '#F59E0B' }]} activeOpacity={0.8}>
            <Text style={styles.bannerBtnText}>Vai al Tabellone</Text>
            <ChevronRight color="#0B0F1A" size={16} />
          </TouchableOpacity>
        </Card>

        {/* ── Lista Materie ────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Le tue materie</Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addBtn}>
            <Plus color="#6366F1" size={14} />
            <Text style={styles.addBtnText}>Aggiungi</Text>
          </TouchableOpacity>
        </View>

        {subjects.map((sub) => {
          const subChapters = chapters.filter((c) => c.subjectId === sub.id);
          return (
            <Card key={sub.id} style={styles.subjectCard} padding={16}>
              <View style={styles.subjectHeader}>
                <View style={[styles.subjectDot, { backgroundColor: accent }]} />
                <View>
                  <Text style={styles.subjectName}>{sub.name}</Text>
                  <Text style={styles.subjectMeta}>{subChapters.length} capitoli</Text>
                </View>
              </View>
              {subChapters.map((chap) => (
                <View key={chap.id} style={styles.chapterRow}>
                  <Text style={styles.chapterName} numberOfLines={1}>{chap.name}</Text>
                  <TouchableOpacity style={[styles.chapterQuizBtn, { borderColor: accent }]}>
                    <Text style={[styles.chapterQuizText, { color: accent }]}>Quiz</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </Card>
          );
        })}
      </ScrollView>

      {/* ── Modal Aggiungi Materia ─────────────────────────── */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard} padding={24}>
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>Nuova materia</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X color="#64748B" size={20} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Es. Matematica, Latino, Fisica…"
              placeholderTextColor="#475569"
              value={newSubName}
              onChangeText={setNewSubName}
              autoFocus
            />
            <AppButton
              label="Crea materia"
              onPress={handleAddSubject}
              color={accent}
              style={{ marginTop: 4 }}
            />
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Metric Card ──────────────────────────────────────────────────────────────
interface MetricCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  unit?: string;
  valueColor?: string;
}

function MetricCard({ icon, iconBg, label, value, unit, valueColor }: MetricCardProps) {
  return (
    <Card style={styles.metricCard} padding={14}>
      <View style={[styles.metricIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.metricValueRow}>
        <Text style={[styles.metricValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
        {unit && <Text style={styles.metricUnit}> {unit}</Text>}
      </View>
    </Card>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B0F1A' },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },

  headerRow: { marginBottom: 16 },
  greeting: { fontSize: 22, fontWeight: '700', color: '#F1F5F9', marginBottom: 4 },
  subGreeting: { fontSize: 13, color: '#64748B' },

  quizCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 20,
  },
  quizCTALabel: { color: '#fff', fontWeight: '700', fontSize: 15 },

  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  metricCard: { width: '47%' },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  metricLabel: { fontSize: 11, color: '#64748B', fontWeight: '500', marginBottom: 2 },
  metricValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  metricValue: { fontSize: 22, fontWeight: '800', color: '#F1F5F9', fontVariant: ['tabular-nums'] },
  metricUnit: { fontSize: 12, color: '#64748B', fontWeight: '500' },

  classBanner: {
    marginBottom: 24,
    borderColor: '#1E3A5F',
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  bannerBadgeText: { fontSize: 11, color: '#F59E0B', fontWeight: '700' },
  bannerTitle: { fontSize: 16, fontWeight: '700', color: '#F1F5F9', marginBottom: 6 },
  bannerBody: { fontSize: 13, color: '#94A3B8', marginBottom: 14, lineHeight: 19 },
  bannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  bannerBtnText: { color: '#0B0F1A', fontWeight: '700', fontSize: 13 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#F1F5F9' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { fontSize: 12, color: '#6366F1', fontWeight: '600' },

  subjectCard: { marginBottom: 12 },
  subjectHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  subjectDot: { width: 10, height: 10, borderRadius: 5 },
  subjectName: { fontSize: 15, fontWeight: '700', color: '#F1F5F9' },
  subjectMeta: { fontSize: 11, color: '#64748B' },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E2D45',
  },
  chapterName: { fontSize: 13, color: '#CBD5E1', flex: 1, marginRight: 8 },
  chapterQuizBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  chapterQuizText: { fontSize: 11, fontWeight: '600' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {},
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#F1F5F9' },
  modalInput: {
    backgroundColor: '#0B0F1A',
    borderWidth: 1,
    borderColor: '#1E2D45',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: '#F1F5F9',
    fontSize: 14,
    marginBottom: 12,
  },
});
