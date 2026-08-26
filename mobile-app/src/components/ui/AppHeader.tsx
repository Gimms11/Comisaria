import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { EmergencyModal } from './EmergencyModal';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showEmergency?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title = 'Comisaría La Tinguiña',
  subtitle = 'Atención y Seguridad Ciudadana',
  showBack = false,
  showEmergency = true,
}) => {
  const theme = useTheme();
  const router = useRouter();
  const [emergencyVisible, setEmergencyVisible] = useState(false);

  return (
    <>
      <View
        style={[
          styles.headerContainer,
          {
            backgroundColor: theme.card,
            borderBottomColor: theme.cardBorder,
          },
        ]}
      >
        <View style={styles.leftContainer}>
          {showBack && (
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backButton,
                { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
              ]}
              accessibilityLabel="Volver"
            >
              <Feather name="arrow-left" size={20} color={theme.text} />
            </Pressable>
          )}

          <View style={styles.branding}>
            <View style={[styles.badgeIcon, { backgroundColor: theme.primaryLight }]}>
              <Feather name="shield" size={18} color={theme.primary} />
            </View>
            <View>
              <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                {title}
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
          </View>
        </View>

        {showEmergency && (
          <Pressable
            onPress={() => setEmergencyVisible(true)}
            style={({ pressed }) => [
              styles.sosButton,
              { backgroundColor: theme.danger, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="phone-call" size={14} color="#FFFFFF" />
            <Text style={styles.sosText}>SOS 105</Text>
          </Pressable>
        )}
      </View>

      <EmergencyModal
        visible={emergencyVisible}
        onClose={() => setEmergencyVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Platform.OS === 'ios' ? Spacing.two : Spacing.three,
    paddingBottom: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.two,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.two,
  },
  branding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  badgeIcon: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: Spacing.three,
    borderRadius: BorderRadius.full,
    elevation: 3,
    ...Platform.select({
      web: { boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)' },
      default: {
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
    }),
  },
  sosText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
