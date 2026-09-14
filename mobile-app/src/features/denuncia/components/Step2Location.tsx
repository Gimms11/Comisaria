import React from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { LA_TINGUINA_ZONES, LOCATION_CONTEXT_TAGS } from '@/constants/crimePresets';

interface Step2LocationProps {
  locationAddress: string;
  onChangeLocationAddress: (addr: string) => void;
  locationNote: string;
  coords: { lat: number; lng: number } | null;
  gpsLoading: boolean;
  onGetLocation: () => void;
  onToggleZone: (zone: string) => void;
  onToggleLocationContext: (ctx: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

export const Step2Location: React.FC<Step2LocationProps> = ({
  locationAddress,
  onChangeLocationAddress,
  locationNote,
  coords,
  gpsLoading,
  onGetLocation,
  onToggleZone,
  onToggleLocationContext,
  onPrev,
  onNext,
}) => {
  const theme = useTheme();
  const isStep2Valid = locationAddress.trim().length > 0 || coords !== null;

  const handleNextClick = () => {
    if (!isStep2Valid) {
      Alert.alert(
        'Ubicación requerida',
        'Toca el botón de GPS o selecciona una de las zonas de La Tinguiña.'
      );
      return;
    }
    onNext();
  };

  return (
    <View style={styles.stepContainer}>
      {/* Instant 1-Tap GPS Button */}
      <Pressable
        onPress={onGetLocation}
        disabled={gpsLoading}
        style={({ pressed }) => [
          styles.giantGpsBtn,
          {
            backgroundColor: coords ? '#DCFCE7' : '#047857',
            borderColor: coords ? '#16A34A' : '#064E3B',
            opacity: pressed || gpsLoading ? 0.85 : 1,
          },
        ]}
      >
        {gpsLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Feather
            name={coords ? 'check-circle' : 'navigation'}
            size={22}
            color={coords ? '#16A34A' : '#FFFFFF'}
          />
        )}
        <View style={styles.giantGpsTextWrap}>
          <Text style={[styles.giantGpsTitle, { color: coords ? '#15803D' : '#FFFFFF' }]}>
            {coords ? '✓ Mi Ubicación GPS Fijada con Éxito' : 'Usar Mi Ubicación GPS Actual (1 Toque)'}
          </Text>
          <Text style={[styles.giantGpsSub, { color: coords ? '#166534' : 'rgba(255,255,255,0.85)' }]}>
            {coords
              ? `Lat: ${coords.lat.toFixed(5)}, Lng: ${coords.lng.toFixed(5)}`
              : 'Fija el punto exacto por satélite sin escribir'}
          </Text>
        </View>
      </Pressable>

      {/* Quick reference zones in La Tinguiña */}
      <View style={[styles.quickTagsSection, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={styles.quickTagsHeader}>
          <View style={styles.quickTagsTitleRow}>
            <Feather name="map-pin" size={16} color="#0284C7" />
            <Text style={[styles.quickTagsTitle, { color: theme.text }]}>
              Zonas frecuentes en La Tinguiña (1 toque):
            </Text>
          </View>
        </View>

        <View style={styles.chipsWrap}>
          {LA_TINGUINA_ZONES.map((zone, zIdx) => {
            const isSelected = locationAddress.trim().toLowerCase() === zone.trim().toLowerCase();
            return (
              <Pressable
                key={zIdx}
                onPress={() => onToggleZone(zone)}
                style={({ pressed }) => [
                  styles.zoneChip,
                  {
                    backgroundColor: isSelected ? '#0284C7' : theme.backgroundElement,
                    borderColor: isSelected ? '#0284C7' : theme.cardBorder,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Feather
                  name={isSelected ? 'check' : 'map-pin'}
                  size={12}
                  color={isSelected ? '#FFFFFF' : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.zoneChipText,
                    { color: isSelected ? '#FFFFFF' : theme.text },
                  ]}
                >
                  {zone}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Address Input Field */}
      <View style={styles.descBlock}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Dirección / Referencia fijada:
        </Text>

        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: theme.card,
              borderColor: isStep2Valid ? '#0284C7' : theme.cardBorder,
            },
          ]}
        >
          <Feather name="map-pin" size={18} color="#0284C7" />
          <TextInput
            style={[styles.textInput, { color: theme.text }]}
            placeholder="Toca una zona arriba o escribe la calle..."
            placeholderTextColor={theme.textMuted}
            value={locationAddress}
            onChangeText={onChangeLocationAddress}
          />
        </View>
      </View>

      {/* Quick Context tags */}
      <View style={[styles.quickTagsSection, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <Text style={[styles.tagGroupLabel, { color: theme.textSecondary }]}>
          Detalle del entorno (Opcional):
        </Text>
        <View style={styles.chipsWrap}>
          {LOCATION_CONTEXT_TAGS.map((ctx, cIdx) => {
            const isAdded = locationNote
              .split(', ')
              .map((p) => p.trim().toLowerCase())
              .includes(ctx.trim().toLowerCase());
            return (
              <Pressable
                key={cIdx}
                onPress={() => onToggleLocationContext(ctx)}
                style={({ pressed }) => [
                  styles.presetChip,
                  {
                    backgroundColor: isAdded ? '#0284C7' : theme.backgroundElement,
                    borderColor: isAdded ? '#0284C7' : theme.cardBorder,
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
                  {ctx}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Step 2 Actions */}
      <View style={styles.buttonsRow}>
        <Pressable
          onPress={onPrev}
          style={({ pressed }) => [
            styles.prevBtn,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.cardBorder,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather name="arrow-left" size={18} color={theme.text} />
          <Text style={[styles.prevBtnText, { color: theme.text }]}>Atrás</Text>
        </Pressable>

        <Pressable
          onPress={handleNextClick}
          style={({ pressed }) => [
            styles.nextBtnHalf,
            {
              backgroundColor: isStep2Valid ? '#DC2626' : '#94A3B8',
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={styles.nextBtnText}>Siguiente: Evidencia & PIN</Text>
          <Feather name="arrow-right" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stepContainer: {
    gap: Spacing.three,
  },
  giantGpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    gap: Spacing.three,
    elevation: 3,
  },
  giantGpsTextWrap: {
    flex: 1,
  },
  giantGpsTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  giantGpsSub: {
    fontSize: 12,
    marginTop: 2,
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
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one + 2,
  },
  zoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.three,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  zoneChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  descBlock: {
    gap: Spacing.one,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.OS === 'ios' ? Spacing.two + 4 : Spacing.one,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
  },
  tagGroupLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
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
  nextBtnHalf: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: BorderRadius.lg,
    gap: Spacing.two,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
