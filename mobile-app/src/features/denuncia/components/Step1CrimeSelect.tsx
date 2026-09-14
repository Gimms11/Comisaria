import React from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Category } from '@/types';

interface Step1CrimeSelectProps {
  categories: Category[];
  selectedCategory: Category | null;
  onSelectCategory: (cat: Category) => void;
  description: string;
  onChangeDescription: (desc: string) => void;
  onToggleTag: (tag: string) => void;
  activePresets: { label: string; tags: string[] }[];
  isEmergency: boolean;
  onToggleEmergency: () => void;
  onNext: () => void;
}

export const Step1CrimeSelect: React.FC<Step1CrimeSelectProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  description,
  onChangeDescription,
  onToggleTag,
  activePresets,
  isEmergency,
  onToggleEmergency,
  onNext,
}) => {
  const theme = useTheme();
  const isStep1Valid = description.trim().length >= 8;

  const handleNextClick = () => {
    if (!isStep1Valid) {
      Alert.alert(
        'Información requerida',
        'Toca cualquiera de los botones de situación arriba para autocompletar la descripción o escribe mínimo 8 caracteres.'
      );
      return;
    }
    onNext();
  };

  return (
    <View style={styles.stepContainer}>
      {/* Zero trace assurance banner */}
      <View style={[styles.securityBanner, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
        <View style={styles.secShieldIcon}>
          <Feather name="shield" size={16} color="#DC2626" />
        </View>
        <View style={styles.secTextWrap}>
          <Text style={styles.secBannerTitle}>PROTECCIÓN TOTAL CONTRA REPRESALIAS</Text>
          <Text style={styles.secBannerSubtitle}>
            No te pedimos DNI, nombres ni guardamos tu número. Solo los hechos.
          </Text>
        </View>
      </View>

      {/* Category selection */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        1. Selecciona el delito:
      </Text>

      <View style={styles.categoryGrid}>
        {categories.map((cat) => {
          const isSelected = selectedCategory?.id === cat.id;
          return (
            <Pressable
              key={cat.id}
              onPress={() => onSelectCategory(cat)}
              style={({ pressed }) => [
                styles.categoryCard,
                {
                  backgroundColor: isSelected ? '#FEF2F2' : theme.card,
                  borderColor: isSelected ? '#DC2626' : theme.cardBorder,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.catIconCircle,
                  { backgroundColor: isSelected ? '#DC2626' : theme.backgroundElement },
                ]}
              >
                <Feather
                  name={isSelected ? 'alert-triangle' : 'shield'}
                  size={16}
                  color={isSelected ? '#FFFFFF' : theme.textSecondary}
                />
              </View>
              <Text
                style={[
                  styles.categoryName,
                  { color: isSelected ? '#991B1B' : theme.text },
                ]}
              >
                {cat.name}
              </Text>
              {isSelected && (
                <View style={styles.selectedCheck}>
                  <Feather name="check" size={12} color="#DC2626" />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Quick 1-tap descriptors */}
      <View style={[styles.quickTagsSection, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={styles.quickTagsHeader}>
          <View style={styles.quickTagsTitleRow}>
            <Feather name="zap" size={16} color="#D97706" />
            <Text style={[styles.quickTagsTitle, { color: theme.text }]}>
              Toque rápido para describir (sin escribir):
            </Text>
          </View>
          {description.length > 0 && (
            <Pressable onPress={() => onChangeDescription('')}>
              <Text style={styles.clearText}>Limpiar</Text>
            </Pressable>
          )}
        </View>

        {activePresets.map((group, gIdx) => (
          <View key={gIdx} style={styles.tagGroup}>
            <Text style={[styles.tagGroupLabel, { color: theme.textSecondary }]}>
              {group.label}
            </Text>
            <View style={styles.chipsWrap}>
              {group.tags.map((tag, tIdx) => {
                const isAdded = description
                  .split(' • ')
                  .map((p) => p.trim().toLowerCase())
                  .includes(tag.trim().toLowerCase());
                return (
                  <Pressable
                    key={tIdx}
                    onPress={() => onToggleTag(tag)}
                    style={({ pressed }) => [
                      styles.presetChip,
                      {
                        backgroundColor: isAdded ? '#DC2626' : theme.backgroundElement,
                        borderColor: isAdded ? '#DC2626' : theme.cardBorder,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Feather
                      name={isAdded ? 'check' : 'plus'}
                      size={12}
                      color={isAdded ? '#FFFFFF' : theme.textSecondary}
                    />
                    <Text
                      style={[
                        styles.presetChipText,
                        { color: isAdded ? '#FFFFFF' : theme.text },
                      ]}
                    >
                      {tag}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      {/* Description text input */}
      <View style={styles.descBlock}>
        <View style={styles.descLabelRow}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>
            Detalle del hecho:
          </Text>
          <Text
            style={[
              styles.counterText,
              { color: isStep1Valid ? '#16A34A' : theme.textSecondary },
            ]}
          >
            {isStep1Valid ? '✓ Listo' : 'Mínimo 8 letras'}
          </Text>
        </View>

        <View
          style={[
            styles.textAreaWrapper,
            {
              backgroundColor: theme.card,
              borderColor: isStep1Valid ? '#DC2626' : theme.cardBorder,
            },
          ]}
        >
          <TextInput
            style={[styles.textArea, { color: theme.text }]}
            placeholder="Toca los botones arriba o escribe aquí detalles adicionales..."
            placeholderTextColor={theme.textMuted}
            value={description}
            onChangeText={onChangeDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </View>

      {/* Urgency Alert Switch */}
      <Pressable
        onPress={onToggleEmergency}
        style={({ pressed }) => [
          styles.urgencyToggle,
          {
            backgroundColor: isEmergency ? '#FEE2E2' : theme.card,
            borderColor: isEmergency ? '#DC2626' : theme.cardBorder,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <View
          style={[
            styles.urgencyIconBox,
            { backgroundColor: isEmergency ? '#DC2626' : theme.backgroundElement },
          ]}
        >
          <Feather
            name="bell"
            size={18}
            color={isEmergency ? '#FFFFFF' : theme.textSecondary}
          />
        </View>
        <View style={styles.urgencyTextWrap}>
          <Text style={[styles.urgencyTitle, { color: isEmergency ? '#DC2626' : theme.text }]}>
            {isEmergency ? '¡Alerta de Máxima Urgencia Activada!' : 'Marcar como Hecho en Curso / Urgente'}
          </Text>
          <Text style={[styles.urgencyDesc, { color: theme.textSecondary }]}>
            Envía prioridad roja directa a los patrulleros de turno.
          </Text>
        </View>
        <Feather
          name={isEmergency ? 'check-circle' : 'circle'}
          size={22}
          color={isEmergency ? '#DC2626' : theme.cardBorder}
        />
      </Pressable>

      {/* Next Step Button */}
      <Pressable
        onPress={handleNextClick}
        style={({ pressed }) => [
          styles.primaryNextBtn,
          {
            backgroundColor: isStep1Valid ? '#DC2626' : '#94A3B8',
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Text style={styles.primaryNextBtnText}>Siguiente: Fijar Ubicación</Text>
        <Feather name="arrow-right" size={18} color="#FFFFFF" />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  stepContainer: {
    gap: Spacing.three,
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  secShieldIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secTextWrap: {
    flex: 1,
  },
  secBannerTitle: {
    color: '#991B1B',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  secBannerSubtitle: {
    color: '#B91C1C',
    fontSize: 11,
    marginTop: 1,
    lineHeight: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  categoryCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.two + 4,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    gap: Spacing.two,
    position: 'relative',
  },
  catIconCircle: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  selectedCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  quickTagsSection: {
    padding: Spacing.three,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: Spacing.two,
  },
  quickTagsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickTagsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickTagsTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  clearText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '700',
  },
  tagGroup: {
    gap: 6,
    marginTop: 4,
  },
  tagGroupLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one + 2,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  descBlock: {
    gap: Spacing.one,
  },
  descLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counterText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textAreaWrapper: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    padding: Spacing.three,
  },
  textArea: {
    fontSize: 14,
    minHeight: 80,
    lineHeight: 20,
  },
  urgencyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    gap: Spacing.two,
  },
  urgencyIconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgencyTextWrap: {
    flex: 1,
  },
  urgencyTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  urgencyDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  primaryNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three + 2,
    borderRadius: BorderRadius.lg,
    gap: Spacing.two,
    marginTop: Spacing.two,
    elevation: 3,
  },
  primaryNextBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
