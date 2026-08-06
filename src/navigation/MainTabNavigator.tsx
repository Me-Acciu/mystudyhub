/**
 * src/navigation/MainTabNavigator.tsx
 * ---------------------------------------------------------------------------
 * Tab bar inferiore a 5 voci, come da Sezione 4 ("Architettura
 * dell'Informazione") del documento di design:
 * Home, Materie, Calendario, Classi, Profilo.
 *
 * Ogni tab punta a uno STACK dedicato (non a uno screen singolo), così
 * ogni feature può avere le proprie sotto-schermate (es. da "Materie" si
 * naviga al dettaglio di un Capitolo, e da lì al Quiz Datapp) senza dover
 * ristrutturare la tab bar.
 * ---------------------------------------------------------------------------
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Layers, Calendar, Trophy, User } from 'lucide-react-native';

import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { SubjectsScreen } from '@/features/subjects/screens/SubjectsScreen';
import { ChapterDetailScreen } from '@/features/subjects/screens/ChapterDetailScreen';
import { TimelineQuizScreen } from '@/features/timelineQuiz/screens/TimelineQuizScreen';
import { CalendarScreen } from '@/features/calendar/screens/CalendarScreen';
import { ClassBoardScreen } from '@/features/classes/screens/ClassBoardScreen';
import { ProfileScreen } from '@/features/profile/screens/ProfileScreen';
import { useThemeStore, ACCENT_THEME_TOKENS } from '@/store/useThemeStore';
import type { Chapter } from '@/types/models';

/**
 * Ogni feature con più schermate espone il proprio ParamList: questo
 * permette la navigazione tipizzata (autocompletamento + controllo dei
 * parametri passati) senza accoppiare le feature tra loro.
 */
export type SubjectsStackParamList = {
  SubjectsList: undefined;
  ChapterDetail: { chapterId: string };
  TimelineQuiz: { chapter: Chapter };
};

const SubjectsStack = createNativeStackNavigator<SubjectsStackParamList>();

/** Stack "Materie": lista materie -> dettaglio capitolo -> quiz cronologia. */
function SubjectsStackNavigator() {
  return (
    <SubjectsStack.Navigator screenOptions={{ headerShown: false }}>
      <SubjectsStack.Screen name="SubjectsList" component={SubjectsScreen} />
      <SubjectsStack.Screen name="ChapterDetail" component={ChapterDetailScreen} />
      <SubjectsStack.Screen name="TimelineQuiz" component={TimelineQuizScreen} />
    </SubjectsStack.Navigator>
  );
}

export type MainTabParamList = {
  HomeTab: undefined;
  SubjectsTab: undefined;
  CalendarTab: undefined;
  ClassesTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  const accent = useThemeStore((s) => s.preferences.accentTheme);
  const tokens = ACCENT_THEME_TOKENS[accent];

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.primary,
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: { backgroundColor: '#0F172A', borderTopColor: '#1E293B' },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tab.Screen
        name="SubjectsTab"
        component={SubjectsStackNavigator}
        options={{ title: 'Materie', tabBarIcon: ({ color, size }) => <Layers color={color} size={size} /> }}
      />
      <Tab.Screen
        name="CalendarTab"
        component={CalendarScreen}
        options={{ title: 'Calendario', tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} /> }}
      />
      <Tab.Screen
        name="ClassesTab"
        component={ClassBoardScreen}
        options={{ title: 'Classi', tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} /> }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Profilo', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}
