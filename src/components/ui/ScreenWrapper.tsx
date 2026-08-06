/**
 * src/components/ui/ScreenWrapper.tsx
 * Wrapper base per tutte le schermate. Gestisce:
 * - SafeArea (evita la notch e la home bar)
 * - Background color unificato (#0B0F1A = "midnight" del design token)
 * - ScrollView opzionale per schermate con contenuto lungo
 */

import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export function ScreenWrapper({
  children,
  scrollable = false,
  style,
  contentContainerStyle,
}: ScreenWrapperProps) {
  if (scrollable) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={[styles.scroll, style]}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, style]}>
      <View style={[styles.inner, contentContainerStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0B0F1A',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#0B0F1A',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  inner: {
    flex: 1,
    padding: 20,
  },
});
