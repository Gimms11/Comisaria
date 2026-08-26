import React from 'react';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.cardBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
          elevation: 8,
          ...Platform.select({
            web: { boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.05)' },
            default: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
            },
          }),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Feather name="shield" size={size || 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="comunitario"
        options={{
          title: 'Comunidad',
          tabBarIcon: ({ color, size }) => (
            <Feather name="map-pin" size={size || 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="guias"
        options={{
          title: 'Guías TikTok',
          tabBarIcon: ({ color, size }) => (
            <Feather name="play-circle" size={size || 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="seguimiento"
        options={{
          title: 'Seguimiento',
          tabBarIcon: ({ color, size }) => (
            <Feather name="search" size={size || 22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
