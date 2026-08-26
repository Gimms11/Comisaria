import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { GuideItem } from '@/types';

interface GuideStepsSheetProps {
  guide: GuideItem | null;
  visible: boolean;
  onClose: () => void;
}

export const GuideStepsSheet: React.FC<GuideStepsSheetProps> = ({
  guide,
  visible,
  onClose,
}) => {
  const theme = useTheme();

  if (!guide) return null;

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
            styles.sheetContainer,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.dragBar} />
            <View style={styles.headerTitleRow}>
              <View style={styles.titleWrapper}>
                <View style={[styles.badge, { backgroundColor: theme.primaryLight }]}>
                  <Text style={[styles.badgeText, { color: theme.primaryDark }]}>
                    {guide.category?.name || guide.category_name || 'Guía Cívica'}
                  </Text>
                </View>
                <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
                  {guide.title}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeBtn,
                  { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Feather name="x" size={20} color={theme.text} />
              </Pressable>
            </View>
          </View>

          {/* Steps list */}
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={[styles.summary, { color: theme.textSecondary }]}>
              {guide.summary}
            </Text>

            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              📋 Pasos Clave a Seguir:
            </Text>

            {guide.steps && guide.steps.length > 0 ? (
              guide.steps.map((step) => (
                <View
                  key={step.step_number}
                  style={[
                    styles.stepCard,
                    {
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                >
                  <View style={[styles.stepNumberBadge, { backgroundColor: theme.primary }]}>
                    <Text style={styles.stepNumberText}>{step.step_number}</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepTitle, { color: theme.text }]}>
                      {step.title}
                    </Text>
                    <Text style={[styles.stepInstruction, { color: theme.textSecondary }]}>
                      {step.instruction}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={[styles.stepCard, { backgroundColor: theme.backgroundElement }]}>
                <Text style={[styles.stepInstruction, { color: theme.textSecondary }]}>
                  Sigue las indicaciones narradas en el micro-video preventivo.
                </Text>
              </View>
            )}

            {/* Quick emergency box */}
            <View style={[styles.emergencyBox, { backgroundColor: theme.dangerLight }]}>
              <Feather name="alert-circle" size={18} color={theme.danger} />
              <View style={styles.emergencyTextWrap}>
                <Text style={[styles.emergencyTitle, { color: theme.danger }]}>
                  ¿Es una emergencia en curso?
                </Text>
                <Text style={[styles.emergencyDesc, { color: theme.danger }]}>
                  Comunícate de inmediato al 105 o acude a la comisaría más cercana.
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderTopWidth: 1,
    maxHeight: '80%',
    paddingBottom: Spacing.four,
  },
  header: {
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  dragBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: Spacing.two,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  titleWrapper: {
    flex: 1,
    gap: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  summary: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: Spacing.one,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    gap: Spacing.three,
    borderWidth: 1,
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  stepContent: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepInstruction: {
    fontSize: 13,
    lineHeight: 18,
  },
  emergencyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.two,
  },
  emergencyTextWrap: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  emergencyDesc: {
    fontSize: 12,
    opacity: 0.9,
  },
});
