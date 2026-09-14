import React from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Category } from '@/types';

interface Step3EvidencePinProps {
  selectedCategory: Category | null;
  locationAddress: string;
  description: string;
  isEmergency: boolean;
  evidenceUri: string | null;
  onTakePhoto: () => void;
  onPickImage: () => void;
  onRemoveImage: () => void;
  pin: string;
  onChangePin: (pin: string) => void;
  confirmPin: string;
  onChangeConfirmPin: (pin: string) => void;
  onGeneratePin: () => void;
  loading: boolean;
  onPrev: () => void;
  onSubmit: () => void;
}

export const Step3EvidencePin: React.FC<Step3EvidencePinProps> = ({
  selectedCategory,
  locationAddress,
  description,
  isEmergency,
  evidenceUri,
  onTakePhoto,
  onPickImage,
  onRemoveImage,
  pin,
  onChangePin,
  confirmPin,
  onChangeConfirmPin,
  onGeneratePin,
  loading,
  onPrev,
  onSubmit,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.stepContainer}>
      {/* Live Summary Card */}
      <View
        style={[
          styles.summaryCard,
          {
            backgroundColor: theme.card,
            borderColor: '#DC2626',
          },
        ]}
      >
        <View style={styles.summaryHeader}>
          <View style={styles.summaryBadge}>
            <Feather name="shield" size={12} color="#DC2626" />
            <Text style={styles.summaryBadgeText}>RESUMEN DE DENUNCIA</Text>
          </View>
          {isEmergency && (
            <View style={[styles.summaryBadge, { backgroundColor: '#DC2626' }]}>
              <Text style={[styles.summaryBadgeText, { color: '#FFFFFF' }]}>ALERTA ROJA</Text>
            </View>
          )}
        </View>

        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Delito:</Text>
          <Text style={[styles.summaryVal, { color: theme.text }]}>
            {selectedCategory?.name || 'Delito reportado'}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Lugar:</Text>
          <Text style={[styles.summaryVal, { color: theme.text }]}>
            {locationAddress || 'La Tinguiña'}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Hechos:</Text>
          <Text style={[styles.summaryVal, { color: theme.text }]} numberOfLines={2}>
            {description}
          </Text>
        </View>
      </View>

      {/* Photo Attachment (Optional) */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Foto o captura de prueba (Opcional):
      </Text>

      <View style={styles.mediaButtonsRow}>
        <Pressable
          onPress={onTakePhoto}
          style={({ pressed }) => [
            styles.mediaOptionBtn,
            {
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Feather name="camera" size={20} color="#DC2626" />
          <Text style={[styles.mediaOptionText, { color: theme.text }]}>Tomar Foto</Text>
        </Pressable>

        <Pressable
          onPress={onPickImage}
          style={({ pressed }) => [
            styles.mediaOptionBtn,
            {
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Feather name="image" size={20} color="#0284C7" />
          <Text style={[styles.mediaOptionText, { color: theme.text }]}>Galería</Text>
        </Pressable>
      </View>

      {evidenceUri && (
        <View style={styles.evidencePreviewContainer}>
          <Image
            source={{ uri: evidenceUri }}
            style={styles.previewImage}
            contentFit="cover"
          />
          <Pressable onPress={onRemoveImage} style={styles.removeImageBtn}>
            <Feather name="trash-2" size={16} color="#FFFFFF" />
          </Pressable>
          <View style={styles.sanitizedBadge}>
            <Feather name="shield" size={12} color="#FFFFFF" />
            <Text style={styles.sanitizedText}>EXIF / GPS sanitizado</Text>
          </View>
        </View>
      )}

      {/* Secret PIN with 1-Tap Generator */}
      <View style={[styles.pinCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={styles.pinHeaderRow}>
          <View style={styles.pinIconTitle}>
            <Feather name="key" size={16} color="#047857" />
            <Text style={[styles.pinCardTitle, { color: theme.text }]}>
              Clave PIN de 6 dígitos (Opcional)
            </Text>
          </View>
          <Pressable
            onPress={onGeneratePin}
            style={({ pressed }) => [
              styles.genPinBtn,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="refresh-cw" size={12} color="#047857" />
            <Text style={styles.genPinBtnText}>Auto-Generar</Text>
          </Pressable>
        </View>

        <Text style={[styles.pinCardDesc, { color: theme.textSecondary }]}>
          Permite ver detalles confidenciales al consultar el estado. Puedes omitirlo para enviar más rápido.
        </Text>

        <View style={styles.pinInputsRow}>
          <View
            style={[
              styles.pinInputWrap,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.cardBorder,
              },
            ]}
          >
            <TextInput
              style={[styles.pinInput, { color: theme.text }]}
              placeholder="PIN 6 dígitos"
              placeholderTextColor={theme.textMuted}
              value={pin}
              onChangeText={onChangePin}
              keyboardType="numeric"
              maxLength={6}
              secureTextEntry
            />
          </View>

          <View
            style={[
              styles.pinInputWrap,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.cardBorder,
              },
            ]}
          >
            <TextInput
              style={[styles.pinInput, { color: theme.text }]}
              placeholder="Confirmar PIN"
              placeholderTextColor={theme.textMuted}
              value={confirmPin}
              onChangeText={onChangeConfirmPin}
              keyboardType="numeric"
              maxLength={6}
              secureTextEntry
            />
          </View>
        </View>
      </View>

      {/* Submit Actions */}
      <View style={styles.buttonsRow}>
        <Pressable
          onPress={onPrev}
          disabled={loading}
          style={({ pressed }) => [
            styles.prevBtn,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.cardBorder,
              opacity: pressed || loading ? 0.7 : 1,
            },
          ]}
        >
          <Feather name="arrow-left" size={18} color={theme.text} />
          <Text style={[styles.prevBtnText, { color: theme.text }]}>Atrás</Text>
        </Pressable>

        <Pressable
          onPress={onSubmit}
          disabled={loading}
          style={({ pressed }) => [
            styles.submitFinalBtn,
            {
              backgroundColor: '#DC2626',
              opacity: pressed || loading ? 0.85 : 1,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Feather name="shield" size={20} color="#FFFFFF" />
              <Text style={styles.submitFinalBtnText}>ENVIAR DENUNCIA AHORA</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stepContainer: {
    gap: Spacing.three,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  summaryCard: {
    padding: Spacing.four,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    gap: Spacing.two,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  summaryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'baseline',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    width: 60,
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  mediaButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  mediaOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  mediaOptionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  evidencePreviewContainer: {
    position: 'relative',
    height: 160,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(220, 38, 38, 0.85)',
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sanitizedBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  sanitizedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  pinCard: {
    padding: Spacing.three + 2,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: Spacing.two,
  },
  pinHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pinIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pinCardTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  genPinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  genPinBtnText: {
    color: '#065F46',
    fontSize: 11,
    fontWeight: '800',
  },
  pinCardDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  pinInputsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  pinInputWrap: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  pinInput: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  prevBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.one,
  },
  prevBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  submitFinalBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three + 2,
    borderRadius: BorderRadius.lg,
    elevation: 4,
  },
  submitFinalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
