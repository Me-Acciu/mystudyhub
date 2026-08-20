/**
 * src/features/flashcards/screens/FlashcardsScreen.tsx
 * ---------------------------------------------------------------------------
 * Modulo Flashcards — Sessione di ripasso interattiva basata sull'algoritmo SM-2
 * (Sezione 5.5 e 6.3 del documento di design).
 *
 * Funzionalità:
 * - Carta 3D/Flip animata per passare da Domanda a Risposta
 * - Valutazione SM-2 a 4 livelli (Ancora 🔴, Difficile 🟠, Buono 🟢, Facile 🔵)
 * - Ricalcolo in tempo reale di intervallo di ripasso, Ease Factor e stato (nuova/in_apprendimento/consolidata)
 * - Salvataggio automatico del Risultato Attività per alimentare il Punteggio Progresso
 * ---------------------------------------------------------------------------
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrainCircuit, ChevronLeft, Sparkles, HelpCircle, Award } from 'lucide-react-native';

import { useStudyStore } from '@/store/useStudyStore';
import type { Chapter, Flashcard, FlashcardDeck } from '@/types/models';
import { useDecksForChapter, useFlashcardsForDeck } from '@/features/flashcards/hooks/useFlashcards';
import { useChapters } from '@/features/chapters/hooks/useChapters';
import { Card } from '@/components/ui/Card';
import { AppButton } from '@/components/ui/AppButton';

export function FlashcardsScreen() {
  const { chapters: chapterSeed, updateFlashcardSM2, saveActivityResult } = useStudyStore();
  const { data: chapters = [] as Chapter[] } = useChapters(undefined);
  const chapterList: Chapter[] = chapters.length > 0 ? chapters : chapterSeed;
  const firstChapterId = chapterList[0]?.id ?? null;
  const { data: decks = [] as FlashcardDeck[] } = useDecksForChapter(firstChapterId ?? '');
  const { data: flashcards = [] as Flashcard[] } = useFlashcardsForDeck((decks[0]?.id) ?? '');

  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [goodCount, setGoodCount] = useState(0);

  useEffect(() => {
    if (decks.length > 0 && !selectedDeckId) {
      setSelectedDeckId(decks[0].id);
    }
  }, [decks, selectedDeckId]);

  const activeDeck = decks.find((d: FlashcardDeck) => d.id === selectedDeckId);
  const activeChapter = chapterList.find((c: Chapter) => c.id === activeDeck?.chapterId);
  const deckCards: Flashcard[] = selectedDeckId ? flashcards.filter((f: Flashcard) => f.deckId === selectedDeckId) : [];
  const currentCard = deckCards[currentIndex];

  const accent = '#8B5CF6'; // Violet accent per le flashcards

  function handleSelectDeck(deckId: string) {
    setSelectedDeckId(deckId);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
    setGoodCount(0);
  }

  function handleRating(rating: 1 | 3 | 4 | 5) {
    if (!currentCard) return;

    // Aggiorna la carta via algoritmo SM-2
    updateFlashcardSM2(currentCard.id, rating);

    if (rating >= 4) {
      setGoodCount((g) => g + 1);
    }

    if (currentIndex + 1 < deckCards.length) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      // Sessione completata -> registra risultato attività
      const pct = Math.round(((goodCount + (rating >= 4 ? 1 : 0)) / deckCards.length) * 100);
      saveActivityResult('flashcard', pct);
      setSessionCompleted(true);
    }
  }

  function handleRestartSession() {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
    setGoodCount(0);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Modulo Flashcards</Text>
            <Text style={styles.subtitle}>{activeChapter ? `Capitolo: ${activeChapter.name}` : 'Ripasso attivo & Algoritmo SM-2'}</Text>
          </View>
          <View style={[styles.headerIcon, { backgroundColor: '#2e1065' }]}>
            <BrainCircuit color={accent} size={22} />
          </View>
        </View>

        {/* Deck selector */}
        <Text style={styles.sectionLabel}>Seleziona Mazzo</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deckScroll} contentContainerStyle={styles.deckList}>
          {decks.map((deck: FlashcardDeck) => {
            const isSelected = deck.id === selectedDeckId;
            const chap = chapterList.find((c: Chapter) => c.id === deck.chapterId);
            const count = flashcards.filter((f: Flashcard) => f.deckId === deck.id).length;

            return (
              <TouchableOpacity
                key={deck.id}
                style={[
                  styles.deckChip,
                  isSelected && { backgroundColor: accent, borderColor: accent },
                ]}
                onPress={() => handleSelectDeck(deck.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.deckChipTitle, isSelected && { color: '#FFF' }]}>{deck.title}</Text>
                <Text style={[styles.deckChipMeta, isSelected && { color: '#E9D5FF' }]}>{count} carte • {chap?.name ?? ''}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Flashcard Viewer / Summary */}
        {deckCards.length === 0 ? (
          <Card padding={24} style={styles.emptyCard}>
            <HelpCircle color="#64748B" size={32} style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={styles.emptyText}>Nessuna flashcard disponibile per questo mazzo.</Text>
          </Card>
        ) : sessionCompleted ? (
          /* Schermata Fine Sessione SM-2 */
          <Card padding={28} style={styles.completedCard}>
            <View style={[styles.trophyIcon, { backgroundColor: '#2e1065' }]}>
              <Award color={accent} size={36} />
            </View>
            <Text style={styles.completedTitle}>Sessione completata!</Text>
            <Text style={styles.completedSub}>Hai ripassato tutte le carte del mazzo «{activeDeck?.title}».</Text>
            
            <View style={styles.statBox}>
              <Text style={styles.statBoxTitle}>Accuratezza Ripasso</Text>
              <Text style={styles.statBoxValue}>{Math.round((goodCount / deckCards.length) * 100)}%</Text>
              <Text style={styles.statBoxHint}>Le schede ricompariranno in base all'intervallo SM-2 calcolato.</Text>
            </View>

            <AppButton
              label="Ricomincia Sessione"
              onPress={handleRestartSession}
              color={accent}
              style={{ width: '100%', marginTop: 8 }}
            />
          </Card>
        ) : (
          <View style={styles.viewerContainer}>
            {/* Card Counter & State */}
            <View style={styles.cardHeader}>
              <Text style={styles.cardCounter}>
                Scheda <Text style={{ color: accent, fontWeight: '700' }}>{currentIndex + 1}</Text> di {deckCards.length}
              </Text>
              <View style={styles.stateBadge}>
                <Text style={styles.stateBadgeText}>
                  Stato: {currentCard?.srState === 'consolidata' ? '🟢 Consolidata' : currentCard?.srState === 'in_apprendimento' ? '🟠 In Apprendimento' : '🔵 Nuova'}
                </Text>
              </View>
            </View>

            {/* Interactive Flashcard */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setIsFlipped(!isFlipped)}
              style={[
                styles.flashCard,
                isFlipped && styles.flashCardFlipped,
              ]}
            >
              <View style={styles.cardTypeRow}>
                <Text style={[styles.cardTypeTag, { color: isFlipped ? '#10B981' : accent }]}>
                  {isFlipped ? 'RISPOSTA' : 'DOMANDA'}
                </Text>
                <Sparkles color={isFlipped ? '#10B981' : accent} size={16} />
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardText}>
                  {isFlipped ? currentCard?.back : currentCard?.front}
                </Text>
              </View>

              <Text style={styles.cardHint}>
                {isFlipped ? 'Valuta la tua risposta qui sotto ⬇️' : 'Tocca la scheda per rivelare la risposta 🔄'}
              </Text>
            </TouchableOpacity>

            {/* Evaluation SM-2 Buttons (quando la scheda è girata) */}
            {isFlipped ? (
              <View style={styles.sm2Container}>
                <Text style={styles.sm2Label}>Come valuti il tuo ricordo?</Text>
                <View style={styles.sm2Grid}>
                  <TouchableOpacity style={[styles.sm2Btn, { backgroundColor: '#7F1D1D' }]} onPress={() => handleRating(1)} activeOpacity={0.8}>
                    <Text style={styles.sm2BtnTitle}>🔴 Ancora</Text>
                    <Text style={styles.sm2BtnSub}>1 giorno</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.sm2Btn, { backgroundColor: '#78350F' }]} onPress={() => handleRating(3)} activeOpacity={0.8}>
                    <Text style={styles.sm2BtnTitle}>🟠 Difficile</Text>
                    <Text style={styles.sm2BtnSub}>Intervallo min</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.sm2Btn, { backgroundColor: '#064E3B' }]} onPress={() => handleRating(4)} activeOpacity={0.8}>
                    <Text style={styles.sm2BtnTitle}>🟢 Buono</Text>
                    <Text style={styles.sm2BtnSub}>+{currentCard?.easeFactor.toFixed(1)}x</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.sm2Btn, { backgroundColor: '#1E1B4B' }]} onPress={() => handleRating(5)} activeOpacity={0.8}>
                    <Text style={styles.sm2BtnTitle}>🔵 Facile</Text>
                    <Text style={styles.sm2BtnSub}>Consolida</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Navigation Controls per scorrere senza valutare */
              <View style={styles.controlsRow}>
                <TouchableOpacity
                  style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
                  onPress={() => { if (currentIndex > 0) { setCurrentIndex(c => c - 1); setIsFlipped(false); } }}
                  disabled={currentIndex === 0}
                  activeOpacity={0.7}
                >
                  <ChevronLeft color={currentIndex === 0 ? '#334155' : '#CBD5E1'} size={20} />
                  <Text style={[styles.navBtnText, currentIndex === 0 && { color: '#334155' }]}>Precedente</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.navBtn, { backgroundColor: accent, borderColor: accent }]}
                  onPress={() => setIsFlipped(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.nextBtnText}>Rivela Risposta 👁️</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
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
  headerIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  sectionLabel: { fontSize: 11, color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  deckScroll: { marginBottom: 24, marginHorizontal: -20, paddingHorizontal: 20 },
  deckList: { gap: 10, paddingRight: 20 },
  deckChip: {
    backgroundColor: '#131929',
    borderWidth: 1,
    borderColor: '#1E2D45',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 140,
  },
  deckChipTitle: { fontSize: 13, fontWeight: '700', color: '#F1F5F9', marginBottom: 2 },
  deckChipMeta: { fontSize: 11, color: '#64748B' },

  emptyCard: { alignItems: 'center', marginTop: 20 },
  emptyText: { fontSize: 14, color: '#64748B', textAlign: 'center' },

  viewerContainer: { gap: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardCounter: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  stateBadge: { backgroundColor: '#131929', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#1E2D45' },
  stateBadgeText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },

  flashCard: {
    backgroundColor: '#131929',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#8B5CF640',
    minHeight: 240,
    padding: 24,
    justifyContent: 'space-between',
  },
  flashCardFlipped: {
    borderColor: '#10B98160',
    backgroundColor: '#062016',
  },
  cardTypeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTypeTag: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  cardBody: { flex: 1, justifyContent: 'center', marginVertical: 16 },
  cardText: { fontSize: 18, fontWeight: '700', color: '#F1F5F9', textAlign: 'center', lineHeight: 26 },
  cardHint: { fontSize: 11, color: '#64748B', textAlign: 'center', fontWeight: '500' },

  sm2Container: { gap: 10, marginTop: 4 },
  sm2Label: { fontSize: 12, color: '#94A3B8', fontWeight: '600', textAlign: 'center' },
  sm2Grid: { flexDirection: 'row', gap: 8 },
  sm2Btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sm2BtnTitle: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  sm2BtnSub: { fontSize: 10, color: '#E2E8F0', marginTop: 2 },

  controlsRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#131929',
    borderWidth: 1,
    borderColor: '#1E2D45',
  },
  navBtnDisabled: { opacity: 0.5 },
  navBtnText: { fontSize: 13, fontWeight: '600', color: '#CBD5E1' },
  nextBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF' },

  completedCard: { alignItems: 'center' },
  trophyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  completedTitle: { fontSize: 22, fontWeight: '800', color: '#F1F5F9', marginBottom: 6 },
  completedSub: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 20 },
  statBox: { backgroundColor: '#0B0F1A', borderWidth: 1, borderColor: '#1E2D45', borderRadius: 16, padding: 20, width: '100%', alignItems: 'center', marginBottom: 20 },
  statBoxTitle: { fontSize: 11, color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  statBoxValue: { fontSize: 36, fontWeight: '900', color: '#8B5CF6', marginVertical: 4 },
  statBoxHint: { fontSize: 11, color: '#475569', textAlign: 'center' },
});
