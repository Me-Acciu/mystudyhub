/**
 * src/features/classes/screens/ClassBoardScreen.tsx
 * ---------------------------------------------------------------------------
 * Tabellone di Classe — gamification (Sezione 6.5 del design doc).
 * Mostra:
 * - Griglia 20 caselle con pedine dei compagni
 * - Classifica studenti con punteggio
 * - Codice invito classe
 * ---------------------------------------------------------------------------
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy, Sparkles } from 'lucide-react-native';

import { useStudyStore, computeProgressScore, SEED_MEMBERSHIPS } from '@/store/useStudyStore';
import { useThemeStore } from '@/store/useThemeStore';
import { Card } from '@/components/ui/Card';

const BOARD_SIZE = 20;

// Punteggi fissi per i compagni (simulati)
const PEER_SCORES: Record<string, number> = {
  'u-sofia': 85,
  'u-luca': 64,
  'u-elena': 92,
  'u-matteo': 50,
};

export function ClassBoardScreen() {
  const { grades, activityResults, studyClass, memberships } = useStudyStore();
  const { preferences } = useThemeStore();

  const accent = preferences.accentTheme === 'indigo'
    ? '#6366F1'
    : preferences.accentTheme === 'emerald'
    ? '#10B981'
    : '#F59E0B';

  const { total: userTotal } = computeProgressScore(grades, activityResults);

  // Costruisci classifica unificata
  const leaderboard = memberships.map((m) => ({
    ...m,
    score: m.userId === 'local-user' ? userTotal : (PEER_SCORES[m.userId] ?? 0),
    pawnEmoji: m.userId === 'local-user' ? preferences.pawnEmoji : m.pawnEmoji,
  })).sort((a, b) => b.score - a.score);

  // Per la griglia: mappa posizione → pedine
  const tileMap: Record<number, typeof leaderboard> = {};
  leaderboard.forEach((m) => {
    const pos = m.pawnPosition;
    if (!tileMap[pos]) tileMap[pos] = [];
    tileMap[pos].push(m);
  });

  const userMember = leaderboard.find((m) => m.userId === 'local-user');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Card padding={20} style={styles.headerCard}>
          <View style={styles.trophyRow}>
            <Trophy color="#F59E0B" size={14} />
            <Text style={styles.trophyLabel}>Classifica della Classe</Text>
          </View>
          <Text style={styles.className}>{studyClass.name}</Text>
          <Text style={styles.inviteLabel}>
            Codice invito:{' '}
            <Text style={styles.inviteCode}>{studyClass.inviteCode}</Text>
          </Text>
          {userMember && (
            <View style={[styles.yourPawnRow, { borderColor: accent }]}>
              <Text style={styles.yourPawnEmoji}>{userMember.pawnEmoji}</Text>
              <View>
                <Text style={styles.yourPawnLabel}>La tua pedina</Text>
                <Text style={[styles.yourPawnPos, { color: accent }]}>
                  Casella {userMember.pawnPosition} — {userTotal} punti
                </Text>
              </View>
            </View>
          )}
        </Card>

        {/* Board */}
        <Card padding={16} style={styles.boardCard}>
          <View style={styles.boardLabel}>
            <Sparkles color="#F59E0B" size={14} />
            <Text style={styles.boardLabelText}>Percorso da Gioco</Text>
          </View>
          <View style={styles.boardGrid}>
            {Array.from({ length: BOARD_SIZE }, (_, i) => i + 1).map((tile) => {
              const pawns = tileMap[tile] ?? [];
              const isUserHere = pawns.some((p) => p.userId === 'local-user');
              const isMilestone = tile % 5 === 0;

              return (
                <View
                  key={tile}
                  style={[
                    styles.tile,
                    isUserHere ? styles.tileUser : undefined,
                    isUserHere ? { borderColor: accent } : undefined,
                    !isUserHere && isMilestone ? styles.tileMilestone : undefined,
                  ]}
                >
                  <Text style={styles.tileNum}>#{tile}</Text>
                  <View style={styles.tilePawns}>
                    {pawns.map((p) => (
                      <Text key={p.userId} style={styles.pawnEmoji}>{p.pawnEmoji}</Text>
                    ))}
                  </View>
                  {isMilestone && <Text style={styles.milestoneLabel}>🎯</Text>}
                </View>
              );
            })}
          </View>
        </Card>

        {/* Leaderboard */}
        <Text style={styles.leaderTitle}>Classifica Studenti</Text>
        {leaderboard.map((m, idx) => (
          <Card
            key={m.userId}
            style={[styles.leaderCard, m.userId === 'local-user' ? { borderColor: accent } : undefined]}
            padding={14}
          >
            <View style={styles.leaderRow}>
              <Text style={[styles.leaderRank, idx === 0 && { color: '#F59E0B', fontSize: 18 }]}>
                {idx + 1}°
              </Text>
              <View style={[styles.leaderAvatar, { backgroundColor: '#1E2D45' }]}>
                <Text style={styles.leaderEmoji}>{m.pawnEmoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.leaderName}>{m.displayName}</Text>
                <Text style={styles.leaderPos}>Casella {m.pawnPosition}</Text>
              </View>
              <Text style={[styles.leaderScore, { color: accent }]}>{m.score} pt</Text>
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B0F1A' },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },

  headerCard: { marginBottom: 16, borderColor: '#1E3A5F' },
  trophyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  trophyLabel: { fontSize: 11, color: '#F59E0B', fontWeight: '700' },
  className: { fontSize: 20, fontWeight: '700', color: '#F1F5F9', marginBottom: 4 },
  inviteLabel: { fontSize: 12, color: '#64748B', marginBottom: 14 },
  inviteCode: { fontFamily: 'monospace', color: '#94A3B8', backgroundColor: '#0B0F1A', borderRadius: 4 },
  yourPawnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#0B0F1A',
  },
  yourPawnEmoji: { fontSize: 24 },
  yourPawnLabel: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  yourPawnPos: { fontSize: 13, fontWeight: '700' },

  boardCard: { marginBottom: 24 },
  boardLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  boardLabelText: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  boardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tile: {
    width: '18%',
    aspectRatio: 0.8,
    backgroundColor: '#0B0F1A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E2D45',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 4,
  },
  tileUser: {
    backgroundColor: '#0F172A',
    borderWidth: 2,
  },
  tileMilestone: {
    borderColor: '#431407',
    backgroundColor: '#1c0a03',
  },
  tileNum: { fontSize: 8, color: '#334155', fontWeight: '700', alignSelf: 'flex-start' },
  tilePawns: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 2 },
  pawnEmoji: { fontSize: 16 },
  milestoneLabel: { fontSize: 10 },

  leaderTitle: { fontSize: 16, fontWeight: '700', color: '#F1F5F9', marginBottom: 12 },
  leaderCard: { marginBottom: 10 },
  leaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  leaderRank: { fontSize: 14, fontWeight: '800', color: '#64748B', width: 24, textAlign: 'center' },
  leaderAvatar: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  leaderEmoji: { fontSize: 20 },
  leaderName: { fontSize: 14, fontWeight: '700', color: '#F1F5F9' },
  leaderPos: { fontSize: 11, color: '#475569' },
  leaderScore: { fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
