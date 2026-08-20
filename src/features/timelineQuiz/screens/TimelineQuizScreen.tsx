/**
 * src/features/timelineQuiz/screens/TimelineQuizScreen.tsx
 * ---------------------------------------------------------------------------
 * Quiz Datapp — il cuore della feature "Cronologia Interattiva".
 *
 * Logica: per ogni evento del capitolo, si genera una domanda a scelta
 * multipla. Il tipo di domanda alterna casualmente tra:
 *   "dateToEvent" — mostrata la data, indovinare l'evento
 *   "eventToDate" — mostrato l'evento, indovinare la data
 *
 * Design signature: le date sono visualizzate come "timbri" in stile
 * tipografico monospace (DM Mono / font-variant tabular-nums), con un
 * bordo tratteggiato. Quando l'utente risponde correttamente, il timbro
 * "si imprime" (micro-animazione scale in). Questo elemento è specifico
 * al soggetto (date storiche = fatti precisi, come timbri su un documento)
 * e non appare in nessun'altra app studio generica.
 * ---------------------------------------------------------------------------
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Trophy, CheckCircle2, XCircle } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useStudyStore, formatPartialDate } from '@/store/useStudyStore';
import { useThemeStore } from '@/store/useThemeStore';
import type { TimelineEvent } from '@/types/models';
import { useTimelineEvents } from '@/features/timelineQuiz/hooks/useTimelineEvents';
import { Card } from '@/components/ui/Card';
import { AppButton } from '@/components/ui/AppButton';
import type { SubjectsStackParamList } from '@/navigation/MainTabNavigator';

type Props = NativeStackScreenProps<SubjectsStackParamList, 'TimelineQuiz'>;

type QuestionType = 'eventToDate' | 'dateToEvent';

interface QuizQuestion {
  type: QuestionType;
  questionText: string;
  correctAnswer: string;
  options: string[];
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getUniqueDistractors(source: string[], correct: string, count: number): string[] {
  const wrong = [...new Set(source.filter((s) => s !== correct))];
  return shuffleArray(wrong).slice(0, count);
}

function buildQuestions(events: ReturnType<typeof useStudyStore.getState>['timelineEvents']): QuizQuestion[] {
  if (events.length < 2) return [];
  return shuffleArray(events).map((ev) => {
    const type: QuestionType = Math.random() < 0.5 ? 'eventToDate' : 'dateToEvent';
    let questionText: string;
    let correctAnswer: string;
    let pool: string[];

    if (type === 'eventToDate') {
      questionText = ev.name;
      correctAnswer = formatPartialDate(ev.startDate);
      pool = events.map((e) => formatPartialDate(e.startDate));
    } else {
      questionText = formatPartialDate(ev.startDate);
      correctAnswer = ev.name;
      pool = events.map((e) => e.name);
    }

    const distractors = getUniqueDistractors(pool, correctAnswer, 3);
    const options = shuffleArray([correctAnswer, ...distractors]);
    return { type, questionText, correctAnswer, options };
  });
}

export function TimelineQuizScreen({ route, navigation }: Props) {
  const { chapter } = route.params;
  const { timelineEvents: seedTimelineEvents, saveActivityResult } = useStudyStore();
  const { data: fetchedTimelineEvents = [] } = useTimelineEvents(chapter.id);
  const { preferences } = useThemeStore();

  const accent = preferences.accentTheme === 'indigo'
    ? '#6366F1'
    : preferences.accentTheme === 'emerald'
    ? '#10B981'
    : '#F59E0B';

  const events: TimelineEvent[] = (fetchedTimelineEvents.length > 0 ? fetchedTimelineEvents : seedTimelineEvents).filter((e: TimelineEvent) => e.chapterId === chapter.id);
  const [questions] = useState<QuizQuestion[]>(() => buildQuestions(events));
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Stamp animation
  const [stampScale] = useState(() => new Animated.Value(1));

  const animateStamp = useCallback(() => {
    stampScale.setValue(0.7);
    Animated.spring(stampScale, {
      toValue: 1,
      friction: 5,
      tension: 200,
      useNativeDriver: true,
    }).start();
  }, [stampScale]);

  function handleSelectOption(option: string) {
    if (answered) return;
    setSelected(option);
    setAnswered(true);
    if (option === questions[current].correctAnswer) {
      setScore((s) => s + 1);
      animateStamp();
    }
  }

  function handleNext() {
    if (current + 1 < questions.length) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      const pct = Math.round((score / questions.length) * 100);
      saveActivityResult('quiz_cronologia', pct);
      setCompleted(true);
    }
  }

  function handleRestart() {
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setAnswered(false);
    setCompleted(false);
  }

  // Nessun evento → schermata vuota
  if (events.length < 2) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyContainer}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <ArrowLeft color="#64748B" size={18} />
          </TouchableOpacity>
          <Card padding={24} style={{ alignItems: 'center' }}>
            <Text style={styles.emptyTitle}>Quiz non disponibile</Text>
            <Text style={styles.emptyBody}>
              Questo capitolo ha meno di 2 eventi cronologici. Aggiungine di più per poter avviare il quiz.
            </Text>
            <AppButton label="Torna indietro" onPress={() => navigation.goBack()} variant="secondary" color={accent} style={{ marginTop: 16 }} />
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  const q = questions[current];
  const isDate = q?.type === 'eventToDate';

  // ── Schermata Risultato ──────────────────────────────────────────────────
  if (completed) {
    const pct = Math.round((score / questions.length) * 100);
    const pts = score * 5;
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={[styles.content, { alignItems: 'center', paddingTop: 40 }]}>
          <View style={[styles.trophyIcon, { backgroundColor: '#431407' }]}>
            <Trophy color="#F59E0B" size={36} />
          </View>
          <Text style={styles.completedTitle}>Quiz completato! 🎉</Text>
          <Text style={styles.completedSub}>Ecco il tuo risultato</Text>

          <Card padding={32} style={styles.scoreBig}>
            <Text style={styles.scoreFraction}>{score} / {questions.length}</Text>
            <Text style={styles.scorePct}>{pct}%</Text>
            <Text style={styles.scorePoints}>+{pts} Punti Progresso</Text>
          </Card>

          <View style={styles.restartRow}>
            <AppButton
              label="Riprova"
              onPress={handleRestart}
              color={accent}
              style={{ flex: 1 }}
            />
            <AppButton
              label="Torna indietro"
              onPress={() => navigation.goBack()}
              variant="secondary"
              color={accent}
              style={{ flex: 1 }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Schermata Domanda ────────────────────────────────────────────────────
  const progress = (current + 1) / questions.length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ArrowLeft color="#64748B" size={18} />
          <Text style={styles.backLabel}>{chapter.name}</Text>
        </TouchableOpacity>

        {/* Progress */}
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>Domanda {current + 1} di {questions.length}</Text>
          <Text style={styles.scoreText}>Punteggio: <Text style={{ color: '#F59E0B', fontWeight: '800' }}>{score}</Text></Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` as any, backgroundColor: accent }]} />
        </View>

        {/* Question Card */}
        <Card style={styles.questionCard} padding={24}>
          <Text style={styles.questionEyebrow}>
            {isDate ? 'A quale data corrisponde questo evento?' : 'Quando è avvenuto questo evento?'}
          </Text>

          {/* SIGNATURE ELEMENT: timbro tipografico */}
          <Animated.View style={[styles.stamp, { transform: [{ scale: stampScale }], borderColor: accent }]}>
            <Text style={[styles.stampText, isDate ? styles.stampEvent : styles.stampDate, { color: isDate ? '#CBD5E1' : accent }]}>
              {q.questionText}
            </Text>
          </Animated.View>
        </Card>

        {/* Options */}
        <View style={styles.optionsGrid}>
          {q.options.map((option) => {
            const isCorrect = option === q.correctAnswer;
            const isSelected = option === selected;
            let optStyle = styles.optionBase;
            let optTextColor = '#CBD5E1';
            let borderColor = '#1E2D45';

            if (answered) {
              if (isCorrect) { borderColor = '#10B981'; optTextColor = '#10B981'; }
              else if (isSelected) { borderColor = '#EF4444'; optTextColor = '#EF4444'; }
              else { optTextColor = '#475569'; }
            } else if (isSelected) {
              borderColor = accent;
            }

            return (
              <TouchableOpacity
                key={option}
                style={[optStyle, { borderColor }]}
                onPress={() => handleSelectOption(option)}
                disabled={answered}
                activeOpacity={0.75}
              >
                {answered && isCorrect && <CheckCircle2 color="#10B981" size={14} style={{ marginRight: 6 }} />}
                {answered && isSelected && !isCorrect && <XCircle color="#EF4444" size={14} style={{ marginRight: 6 }} />}
                <Text style={[styles.optionText, { color: optTextColor }]}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Next button */}
        {answered && (
          <AppButton
            label={current + 1 < questions.length ? 'Prossima domanda →' : 'Vedi risultato'}
            onPress={handleNext}
            color={accent}
            style={{ marginTop: 8 }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B0F1A' },
  content: { padding: 20, paddingBottom: 40 },
  emptyContainer: { flex: 1, padding: 20, paddingTop: 60 },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  backLabel: { fontSize: 13, color: '#64748B' },

  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  scoreText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  progressBar: { height: 3, backgroundColor: '#1E2D45', borderRadius: 2, marginBottom: 20, overflow: 'hidden' },
  progressFill: { height: 3, borderRadius: 2 },

  questionCard: { marginBottom: 16 },
  questionEyebrow: { fontSize: 11, color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 },

  // SIGNATURE: timbro tipografico
  stamp: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  stampText: { textAlign: 'center', lineHeight: 24 },
  stampDate: {
    fontSize: 28,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  stampEvent: {
    fontSize: 17,
    fontWeight: '600',
  },

  optionsGrid: { gap: 10, marginBottom: 16 },
  optionBase: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: '#131929',
  },
  optionText: { fontSize: 14, fontWeight: '500', flex: 1 },

  // Completed screen
  trophyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  completedTitle: { fontSize: 26, fontWeight: '800', color: '#F1F5F9', textAlign: 'center' },
  completedSub: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 24 },
  scoreBig: { alignItems: 'center', width: '100%', marginBottom: 28 },
  scoreFraction: { fontSize: 48, fontWeight: '900', color: '#F59E0B', fontVariant: ['tabular-nums'] },
  scorePct: { fontSize: 20, fontWeight: '700', color: '#94A3B8', marginTop: 2 },
  scorePoints: { fontSize: 13, color: '#64748B', marginTop: 8 },
  restartRow: { flexDirection: 'row', gap: 12, width: '100%' },

  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#F1F5F9', textAlign: 'center', marginBottom: 8 },
  emptyBody: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 19 },
});
