/**
 * src/features/profile/screens/ProfileScreen.tsx
 * ---------------------------------------------------------------------------
 * Personalizzazione Profilo, Pedina & Gestione Dati (Sezione 6.7, 5.6 e 10).
 * Mostra:
 * - Selezione della skin pedina (10 emoji)
 * - Selezione del tema colore (indigo, emerald, sunset)
 * - Gestione Dati: Esporta backup JSON e Importa backup JSON
 * - Statistiche e info account
 * - Pulsante di Logout
 * ---------------------------------------------------------------------------
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Palette, LogOut, ShieldCheck, Sparkles, Download, Upload, X, FileCheck, AlertCircle } from 'lucide-react-native';

import { useThemeStore } from '@/store/useThemeStore';
import { useAuth } from '@/services/auth/AuthContext';
import { useStudyStore, computeProgressScore } from '@/store/useStudyStore';
import { Card } from '@/components/ui/Card';
import { AppButton } from '@/components/ui/AppButton';

const PAWN_OPTIONS = ['🚀', '👑', '⚡', '🦄', '🛡️', '🧙‍♂️', '🦁', '🎯', '🐉', '🔮'];

const ACCENT_OPTIONS: { id: 'indigo' | 'emerald' | 'sunset'; name: string; color: string }[] = [
  { id: 'indigo', name: 'Nottetempo (Indaco)', color: '#6366F1' },
  { id: 'emerald', name: 'Smeraldo (Verde)', color: '#10B981' },
  { id: 'sunset', name: 'Tramonto (Arancione)', color: '#F59E0B' },
];

export function ProfileScreen() {
  const { preferences, setPawnEmoji, setAccentTheme } = useThemeStore();
  const { signOut, user } = useAuth();
  const { grades, activityResults, exportAllDataJSON, importDataJSON } = useStudyStore();

  const { total } = computeProgressScore(grades, activityResults);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importFeedback, setImportFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  const activeAccentColor = preferences.accentTheme === 'indigo'
    ? '#6366F1'
    : preferences.accentTheme === 'emerald'
    ? '#10B981'
    : '#F59E0B';

  async function handleExport() {
    try {
      const jsonStr = exportAllDataJSON();
      await Share.share({
        title: 'MyStudyHub_Backup.json',
        message: jsonStr,
      });
    } catch {
      // Ignora annullamento condivisione
    }
  }

  function handleImport() {
    if (!importJsonText.trim()) return;
    const success = importDataJSON(importJsonText);
    if (success) {
      setImportFeedback({ success: true, msg: 'Dati importati con successo!' });
      setTimeout(() => {
        setShowImportModal(false);
        setImportJsonText('');
        setImportFeedback(null);
      }, 1500);
    } else {
      setImportFeedback({ success: false, msg: 'Formato JSON non valido. Riprova.' });
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Profile Card */}
        <Card padding={20} style={styles.profileHeaderCard}>
          <View style={styles.avatarRow}>
            <View style={[styles.pawnAvatar, { borderColor: activeAccentColor }]}>
              <Text style={styles.pawnAvatarEmoji}>{preferences.pawnEmoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>Marco</Text>
              <Text style={styles.userEmail}>{user?.email ?? 'marco@liceo.it'}</Text>
              <View style={styles.scoreBadge}>
                <Sparkles color="#F59E0B" size={12} />
                <Text style={styles.scoreBadgeText}>{total} Punti Progresso</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Pawn Selector */}
        <Text style={styles.sectionTitle}>Simbolo Pedina</Text>
        <Card padding={16} style={styles.sectionCard}>
          <Text style={styles.sectionHelp}>Scegli la tua pedina sul tabellone della classe:</Text>
          <View style={styles.pawnGrid}>
            {PAWN_OPTIONS.map((emoji) => {
              const isSelected = preferences.pawnEmoji === emoji;
              return (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.pawnBtn,
                    isSelected && { backgroundColor: activeAccentColor, borderColor: activeAccentColor },
                  ]}
                  onPress={() => setPawnEmoji(emoji)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.pawnBtnEmoji}>{emoji}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Theme Selector */}
        <Text style={styles.sectionTitle}>Tema Colore App</Text>
        <Card padding={16} style={styles.sectionCard}>
          <Text style={styles.sectionHelp}>Personalizza la tonalità principale dell'interfaccia:</Text>
          <View style={styles.themeList}>
            {ACCENT_OPTIONS.map((theme) => {
              const isSelected = preferences.accentTheme === theme.id;
              return (
                <TouchableOpacity
                  key={theme.id}
                  style={[
                    styles.themeOption,
                    isSelected && { borderColor: theme.color, backgroundColor: '#0F172A' },
                  ]}
                  onPress={() => setAccentTheme(theme.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.themeColorDot, { backgroundColor: theme.color }]} />
                  <Text style={[styles.themeOptionName, isSelected && { color: '#F1F5F9', fontWeight: '700' }]}>
                    {theme.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Data Management Section (Esporta / Importa JSON) */}
        <Text style={styles.sectionTitle}>Gestione Dati</Text>
        <Card padding={16} style={styles.sectionCard}>
          <Text style={styles.sectionHelp}>Salva o ripristina le tue materie, flashcard e voti in formato JSON:</Text>
          <View style={styles.dataButtonsRow}>
            <AppButton
              label="Esporta Dati"
              onPress={handleExport}
              variant="secondary"
              color={activeAccentColor}
              style={{ flex: 1 }}
            />
            <AppButton
              label="Importa Dati"
              onPress={() => setShowImportModal(true)}
              variant="secondary"
              color="#10B981"
              style={{ flex: 1 }}
            />
          </View>
        </Card>

        {/* Logout Button */}
        <AppButton
          label="Disconnetti"
          onPress={signOut}
          variant="danger"
          style={{ marginTop: 8 }}
        />
      </ScrollView>

      {/* Modal Importazione JSON */}
      <Modal visible={showImportModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Card padding={24} style={styles.importModalCard}>
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>Importa Backup JSON</Text>
              <TouchableOpacity onPress={() => setShowImportModal(false)}>
                <X color="#64748B" size={20} />
              </TouchableOpacity>
            </View>
            <Text style={styles.importModalHelp}>Incolla qui il contenuto del file JSON di backup:</Text>
            <TextInput
              style={styles.importModalInput}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholder='{"version":"1.0", "subjects": [...]}'
              placeholderTextColor="#475569"
              value={importJsonText}
              onChangeText={setImportJsonText}
            />
            {importFeedback && (
              <View style={[styles.feedbackRow, importFeedback.success ? styles.feedbackSuccess : styles.feedbackError]}>
                {importFeedback.success ? <FileCheck color="#10B981" size={16} /> : <AlertCircle color="#EF4444" size={16} />}
                <Text style={[styles.feedbackText, { color: importFeedback.success ? '#10B981' : '#EF4444' }]}>
                  {importFeedback.msg}
                </Text>
              </View>
            )}
            <AppButton
              label="Conferma Importazione"
              onPress={handleImport}
              color="#10B981"
              style={{ marginTop: 12 }}
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

  profileHeaderCard: { marginBottom: 20, borderColor: '#1E2D45' },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  pawnAvatar: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#0B0F1A',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pawnAvatarEmoji: { fontSize: 30 },
  userName: { fontSize: 20, fontWeight: '800', color: '#F1F5F9' },
  userEmail: { fontSize: 12, color: '#64748B', marginTop: 1, marginBottom: 8 },
  scoreBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#431407', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  scoreBadgeText: { fontSize: 11, color: '#F59E0B', fontWeight: '700' },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#94A3B8', marginBottom: 8, marginTop: 4 },
  sectionCard: { marginBottom: 20 },
  sectionHelp: { fontSize: 12, color: '#64748B', marginBottom: 12 },

  pawnGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pawnBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0B0F1A',
    borderWidth: 1,
    borderColor: '#1E2D45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pawnBtnEmoji: { fontSize: 22 },

  themeList: { gap: 8 },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E2D45',
    backgroundColor: '#0B0F1A',
  },
  themeColorDot: { width: 14, height: 14, borderRadius: 7 },
  themeOptionName: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },

  dataButtonsRow: { flexDirection: 'row', gap: 10 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 },
  importModalCard: {},
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#F1F5F9' },
  importModalHelp: { fontSize: 12, color: '#64748B', marginBottom: 12 },
  importModalInput: {
    backgroundColor: '#0B0F1A',
    borderWidth: 1,
    borderColor: '#1E2D45',
    borderRadius: 12,
    padding: 14,
    color: '#F1F5F9',
    fontSize: 12,
    fontFamily: 'monospace',
    minHeight: 120,
    marginBottom: 12,
  },
  feedbackRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  feedbackSuccess: {},
  feedbackError: {},
  feedbackText: { fontSize: 12, fontWeight: '600' },
});
