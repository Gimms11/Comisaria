import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { EMERGENCY_NUMBERS } from '@/config/api.config';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface EmergencyModalProps {
  visible: boolean;
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ visible, onClose }) => {
  const theme = useTheme();

  const handleCall = (number: string) => {
    const cleanNumber = number.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${cleanNumber}`).catch((err) =>
      console.warn('Error al realizar llamada:', err)
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <View style={[styles.emergencyBadge, { backgroundColor: theme.dangerLight }]}>
                <Feather name="alert-triangle" size={18} color={theme.danger} />
              </View>
              <View>
                <Text style={[styles.title, { color: theme.text }]}>
                  Líneas de Emergencia 24/7
                </Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Comisaría de La Tinguiña e Ica
                </Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Feather name="x" size={20} color={theme.text} />
            </Pressable>
          </View>

          {/* Numbers list */}
          <ScrollView contentContainerStyle={styles.list}>
            {EMERGENCY_NUMBERS.map((item, index) => (
              <Pressable
                key={index}
                onPress={() => handleCall(item.number)}
                style={({ pressed }) => [
                  styles.phoneCard,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.cardBorder,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <View style={styles.phoneInfo}>
                  <Text style={[styles.phoneName, { color: theme.text }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.phoneSubtitle, { color: theme.textSecondary }]}>
                    {item.subtitle}
                  </Text>
                </View>
                <View style={[styles.callBadge, { backgroundColor: theme.danger }]}>
                  <Feather name="phone-call" size={14} color="#FFFFFF" />
                  <Text style={styles.callNumber}>{item.number}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>

          {/* Footer notice */}
          <View style={[styles.footerNotice, { backgroundColor: theme.primaryLight }]}>
            <Feather name="shield" size={16} color={theme.primaryDark} />
            <Text style={[styles.footerNoticeText, { color: theme.primaryDark }]}>
              Usa el 105 para delitos o situaciones con peligro inminente de vida.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderTopWidth: 1,
    padding: Spacing.four,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  emergencyBadge: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  phoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  phoneInfo: {
    flex: 1,
    marginRight: Spacing.two,
  },
  phoneName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  phoneSubtitle: {
    fontSize: 12,
  },
  callBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: BorderRadius.full,
  },
  callNumber: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  footerNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.three,
  },
  footerNoticeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
});
