/**
 * src/components/ui/Card.tsx
 * Card riutilizzabile con superficie scura e bordo sottile.
 * Design token: background #131929 (surface), border #1E2D45.
 */

import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
}

export function Card({ children, style, padding = 16 }: CardProps) {
  return (
    <View style={[styles.card, { padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#131929',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E2D45',
  },
});
