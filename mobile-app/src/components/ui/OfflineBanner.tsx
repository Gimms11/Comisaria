import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNetInfo } from '@react-native-community/netinfo';
import { BorderRadius, Spacing } from '@/constants/theme';

export function OfflineBanner() {
  const netInfo = useNetInfo();

  // If connected or still determining, do not show
  if (netInfo.isConnected === null || netInfo.isConnected === true) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Feather name="wifi-off" size={14} color="#F59E0B" />
      <Text style={styles.text}>
        Modo sin conexión • Tus denuncias guardadas siguen disponibles
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#F59E0B44',
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  text: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
  },
});
