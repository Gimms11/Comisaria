import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ReportStatus } from '@/types';
import { BorderRadius, Spacing } from '@/constants/theme';

interface StatusBadgeProps {
  status: ReportStatus | string;
  size?: 'small' | 'medium' | 'large';
}

interface StatusConfig {
  label: string;
  bgColor: string;
  textColor: string;
  icon: keyof typeof Feather.glyphMap;
}

export const getStatusConfig = (status: string): StatusConfig => {
  switch (status?.toLowerCase()) {
    case 'pendiente':
      return {
        label: 'Pendiente',
        bgColor: '#FEF3C7',
        textColor: '#B45309',
        icon: 'clock',
      };
    case 'en_revision':
      return {
        label: 'En Revisión',
        bgColor: '#E0F2FE',
        textColor: '#0369A1',
        icon: 'search',
      };
    case 'en_atencion':
      return {
        label: 'En Atención Policial',
        bgColor: '#EDE9FE',
        textColor: '#6D28D9',
        icon: 'shield',
      };
    case 'derivado':
      return {
        label: 'Derivado a Serenazgo',
        bgColor: '#E0E7FF',
        textColor: '#4338CA',
        icon: 'corner-up-right',
      };
    case 'resuelto':
      return {
        label: 'Atendido / Resuelto',
        bgColor: '#DCFCE7',
        textColor: '#15803D',
        icon: 'check-circle',
      };
    case 'rechazado':
      return {
        label: 'Desestimado',
        bgColor: '#FEE2E2',
        textColor: '#B91C1C',
        icon: 'x-circle',
      };
    case 'archivado':
    default:
      return {
        label: status || 'Registrado',
        bgColor: '#F1F5F9',
        textColor: '#475569',
        icon: 'file-text',
      };
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'medium',
}) => {
  const config = getStatusConfig(status);

  const isSmall = size === 'small';
  const isLarge = size === 'large';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bgColor },
        isSmall && styles.badgeSmall,
        isLarge && styles.badgeLarge,
      ]}
    >
      <Feather
        name={config.icon}
        size={isSmall ? 10 : isLarge ? 14 : 12}
        color={config.textColor}
      />
      <Text
        style={[
          styles.text,
          { color: config.textColor },
          isSmall && styles.textSmall,
          isLarge && styles.textLarge,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  badgeSmall: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  badgeLarge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 5,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
  textSmall: {
    fontSize: 10,
  },
  textLarge: {
    fontSize: 14,
  },
});
