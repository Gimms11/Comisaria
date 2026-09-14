import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Crypto from 'expo-crypto';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/ui/AppHeader';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Category, ReportPriority } from '@/types';
import { CrimeReportsService } from '@/services/crimeReportsService';
import { useReceiptsStore } from '@/stores/useReceiptsStore';
import { useCrimeCategories } from '@/hooks/queries/useCrimeQueries';
import { logger } from '@/utils/logger';
import { CRIME_QUICK_PRESETS } from '@/constants/crimePresets';
import {
  step1CrimeSchema,
  step2LocationSchema,
  step3EvidencePinSchema,
} from '@/features/denuncia/schemas';
import { Step1CrimeSelect } from '@/features/denuncia/components/Step1CrimeSelect';
import { Step2Location } from '@/features/denuncia/components/Step2Location';
import { Step3EvidencePin } from '@/features/denuncia/components/Step3EvidencePin';

export default function NewCrimeReportScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Form State
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState('');
  const [priority] = useState<ReportPriority>('alta');
  const [isEmergency, setIsEmergency] = useState(false);

  // Step 2: Location
  const [locationAddress, setLocationAddress] = useState('');
  const [locationNote, setLocationNote] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Step 3: Evidence & PIN
  const [evidenceUri, setEvidenceUri] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // TanStack Query for categories
  const { data: categoriesData } = useCrimeCategories();
  const categories = categoriesData || [];

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  // Quick tag toggle helper
  const handleToggleTag = (tag: string) => {
    setDescription((prev) => {
      const parts = prev.split(' • ').map((p) => p.trim()).filter(Boolean);
      const index = parts.findIndex((p) => p.toLowerCase() === tag.toLowerCase());
      if (index >= 0) {
        parts.splice(index, 1);
        return parts.join(' • ');
      } else {
        parts.push(tag);
        return parts.join(' • ');
      }
    });
  };

  const handleToggleZone = (zone: string) => {
    setLocationAddress((prev) => {
      if (prev.trim().toLowerCase() === zone.trim().toLowerCase()) {
        return '';
      }
      return zone;
    });
  };

  const handleToggleLocationContext = (ctx: string) => {
    setLocationNote((prev) => {
      const parts = prev.split(', ').map((p) => p.trim()).filter(Boolean);
      const index = parts.findIndex((p) => p.toLowerCase() === ctx.toLowerCase());
      if (index >= 0) {
        parts.splice(index, 1);
        return parts.join(', ');
      } else {
        parts.push(ctx);
        return parts.join(', ');
      }
    });
  };

  const handleGeneratePin = () => {
    const array = new Uint32Array(1);
    Crypto.getRandomValues(array);
    const randomPin = (100000 + (array[0] % 900000)).toString();
    setPin(randomPin);
    setConfirmPin(randomPin);
  };

  const handleGetLocation = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso GPS no disponible',
          'Selecciona una de las zonas frecuentes de La Tinguiña con 1 toque.'
        );
        setGpsLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCoords({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      });
      if (!locationAddress) {
        setLocationAddress(`GPS: ${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)} (La Tinguiña)`);
      }
    } catch {
      Alert.alert('Aviso GPS', 'Puedes tocar una de las zonas de La Tinguiña para fijar el lugar.');
    } finally {
      setGpsLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        exif: false,
      });

      if (!result.canceled && result.assets.length > 0) {
        setEvidenceUri(result.assets[0].uri);
      }
    } catch (e) {
      logger.warn('MEDIA', 'Image picker error:', e);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso necesario', 'Se requiere acceso a la cámara.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        exif: false,
      });

      if (!result.canceled && result.assets.length > 0) {
        setEvidenceUri(result.assets[0].uri);
      }
    } catch (e) {
      logger.warn('MEDIA', 'Camera error:', e);
    }
  };

  const handleSubmit = async () => {
    // 1. Zod Step 1 Validation
    const step1Result = step1CrimeSchema.safeParse({
      category_id: selectedCategory?.id || '',
      description: description.trim(),
      priority: isEmergency ? 'urgente' : priority,
      is_emergency: isEmergency,
    });
    if (!step1Result.success) {
      Alert.alert('Datos requeridos', step1Result.error.issues[0]?.message || 'Verifica el paso 1');
      setStep(1);
      return;
    }

    // 2. Zod Step 2 Validation
    const resolvedAddress = locationAddress.trim() || (coords ? `GPS: ${coords.lat}, ${coords.lng}` : '');
    const step2Result = step2LocationSchema.safeParse({
      address_reference: resolvedAddress,
      location_note: locationNote.trim() || undefined,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
    });
    if (!step2Result.success) {
      Alert.alert('Ubicación requerida', step2Result.error.issues[0]?.message || 'Verifica el paso 2');
      setStep(2);
      return;
    }

    // 3. Zod Step 3 Validation
    const step3Result = step3EvidencePinSchema.safeParse({
      pin: pin.trim(),
      confirm_pin: confirmPin.trim(),
      evidence_uri: evidenceUri,
    });
    if (!step3Result.success) {
      Alert.alert('PIN inválido', step3Result.error.issues[0]?.message || 'Verifica el PIN');
      return;
    }

    setLoading(true);

    try {
      logger.info('CRIME', '🚀 Enviando denuncia anónima a MS-02...', {
        category: selectedCategory?.name,
        urgency: isEmergency ? 'urgente' : priority,
        hasEvidence: !!evidenceUri,
      });

      const response = await CrimeReportsService.createReport({
        category_id: selectedCategory!.id,
        description: description.trim(),
        priority: isEmergency ? 'urgente' : priority,
        is_emergency: isEmergency,
        latitude: coords?.lat || null,
        longitude: coords?.lng || null,
        address_reference: resolvedAddress,
        location_note: locationNote.trim() || undefined,
        followup_code: pin.trim() || undefined,
      });

      logger.info('CRIME', `✅ Denuncia creada con éxito: ${response.public_code}`);

      if (evidenceUri) {
        logger.info('MEDIA', `📸 Subiendo foto de evidencia para ${response.public_code}...`);
        try {
          const uploadRes = await CrimeReportsService.uploadEvidence(response.public_code, evidenceUri);
          logger.info('MEDIA', '✅ Evidencia fotográfica adjuntada con éxito', uploadRes);
        } catch (e: any) {
          logger.error('MEDIA', '❌ Error al subir evidencia fotográfica', e);
        }
      }

      await useReceiptsStore.getState().addReceipt({
        public_code: response.public_code,
        type: 'denuncia_anonima',
        category_name: selectedCategory!.name,
        created_at: response.created_at,
        followup_code: pin.trim() || undefined,
        address_reference: resolvedAddress,
        description_summary: description.trim().slice(0, 80),
      });

      router.replace({
        pathname: '/denuncia/exito',
        params: {
          code: response.public_code,
          pin: pin.trim() || '',
          categoryName: selectedCategory!.name,
          status: response.status,
        },
      } as any);
    } catch (error: any) {
      Alert.alert(
        'Error al enviar denuncia',
        error.message || 'No se pudo conectar con el servidor de la comisaría.'
      );
    } finally {
      setLoading(false);
    }
  };

  const activePresets = selectedCategory
    ? CRIME_QUICK_PRESETS[selectedCategory.id] || CRIME_QUICK_PRESETS.default
    : CRIME_QUICK_PRESETS.default;

  const isStep1Valid = description.trim().length >= 8;
  const isStep2Valid = locationAddress.trim().length > 0 || coords !== null;

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Safe stealth header */}
      <View style={[styles.headerWrap, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}>
        <AppHeader
          title="Denuncia Anónima"
          subtitle="100% Protegido • Zero Datos"
          showBack
        />
        {/* Stealth Quick Exit Button */}
        <Pressable
          onPress={() => router.replace('/(tabs)' as any)}
          style={({ pressed }) => [
            styles.stealthExitBtn,
            {
              top: insets.top + (Platform.OS === 'ios' ? 12 : 14),
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather name="eye-off" size={14} color="#64748B" />
          <Text style={styles.stealthExitText}>Disimular / Salir</Text>
        </Pressable>
      </View>

      {/* Modern Progress Bar */}
      <View style={[styles.stepBar, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}>
        <Pressable onPress={() => setStep(1)} style={styles.stepItem}>
          <View
            style={[
              styles.stepDot,
              step >= 1 ? { backgroundColor: '#DC2626' } : { backgroundColor: theme.cardBorder },
            ]}
          >
            {step > 1 ? (
              <Feather name="check" size={12} color="#FFFFFF" />
            ) : (
              <Text style={styles.stepNum}>1</Text>
            )}
          </View>
          <Text style={[styles.stepLabel, { color: step === 1 ? '#DC2626' : theme.textSecondary }]}>
            1. ¿Qué pasa?
          </Text>
        </Pressable>

        <View style={[styles.stepLine, { backgroundColor: step >= 2 ? '#DC2626' : theme.cardBorder }]} />

        <Pressable onPress={() => isStep1Valid && setStep(2)} style={styles.stepItem}>
          <View
            style={[
              styles.stepDot,
              step >= 2 ? { backgroundColor: '#DC2626' } : { backgroundColor: theme.cardBorder },
            ]}
          >
            {step > 2 ? (
              <Feather name="check" size={12} color="#FFFFFF" />
            ) : (
              <Text style={styles.stepNum}>2</Text>
            )}
          </View>
          <Text style={[styles.stepLabel, { color: step === 2 ? '#DC2626' : theme.textSecondary }]}>
            2. ¿Dónde?
          </Text>
        </Pressable>

        <View style={[styles.stepLine, { backgroundColor: step >= 3 ? '#DC2626' : theme.cardBorder }]} />

        <Pressable onPress={() => isStep1Valid && isStep2Valid && setStep(3)} style={styles.stepItem}>
          <View
            style={[
              styles.stepDot,
              step >= 3 ? { backgroundColor: '#DC2626' } : { backgroundColor: theme.cardBorder },
            ]}
          >
            <Text style={styles.stepNum}>3</Text>
          </View>
          <Text style={[styles.stepLabel, { color: step === 3 ? '#DC2626' : theme.textSecondary }]}>
            3. Enviar
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Spacing.seven + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 && (
          <Step1CrimeSelect
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            description={description}
            onChangeDescription={setDescription}
            onToggleTag={handleToggleTag}
            activePresets={activePresets}
            isEmergency={isEmergency}
            onToggleEmergency={() => setIsEmergency(!isEmergency)}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <Step2Location
            locationAddress={locationAddress}
            onChangeLocationAddress={setLocationAddress}
            locationNote={locationNote}
            coords={coords}
            gpsLoading={gpsLoading}
            onGetLocation={handleGetLocation}
            onToggleZone={handleToggleZone}
            onToggleLocationContext={handleToggleLocationContext}
            onPrev={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <Step3EvidencePin
            selectedCategory={selectedCategory}
            locationAddress={locationAddress}
            description={description}
            isEmergency={isEmergency}
            evidenceUri={evidenceUri}
            onTakePhoto={handleTakePhoto}
            onPickImage={handlePickImage}
            onRemoveImage={() => setEvidenceUri(null)}
            pin={pin}
            onChangePin={setPin}
            confirmPin={confirmPin}
            onChangeConfirmPin={setConfirmPin}
            onGeneratePin={handleGeneratePin}
            loading={loading}
            onPrev={() => setStep(2)}
            onSubmit={handleSubmit}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerWrap: {
    borderBottomWidth: 1,
    position: 'relative',
  },
  stealthExitBtn: {
    position: 'absolute',
    right: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    zIndex: 20,
  },
  stealthExitText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two + 2,
    borderBottomWidth: 1,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNum: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
  },
  scrollContent: {
    padding: Spacing.four,
  },
});
