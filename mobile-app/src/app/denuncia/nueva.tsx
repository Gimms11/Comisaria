import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Image } from 'expo-image';
import { AppHeader } from '@/components/ui/AppHeader';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Category, ReportPriority } from '@/types';
import { CrimeReportsService } from '@/services/crimeReportsService';
import { StorageService } from '@/services/storageService';

export default function NewCrimeReportScreen() {
  const theme = useTheme();
  const router = useRouter();

  // Form State
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ReportPriority>('media');
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

  useEffect(() => {
    CrimeReportsService.getCategories().then((cats) => {
      setCategories(cats);
      if (cats.length > 0) {
        setSelectedCategory(cats[0]);
      }
    });
  }, []);

  const handleGetLocation = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso no concedido',
          'Puedes escribir la dirección o referencia manualmente.'
        );
        setGpsLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setCoords({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      });
      if (!locationAddress) {
        setLocationAddress(`Ubicación GPS: ${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`);
      }
    } catch {
      Alert.alert('Aviso', 'No se pudo obtener el GPS. Ingrese la referencia manualmente.');
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
        exif: false, // Clean EXIF locally
      });

      if (!result.canceled && result.assets.length > 0) {
        setEvidenceUri(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Image picker error:', e);
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
      console.warn('Camera error:', e);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCategory) {
      Alert.alert('Campo requerido', 'Por favor selecciona una categoría.');
      setStep(1);
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      Alert.alert('Descripción requerida', 'Describe brevemente lo ocurrido (mínimo 10 caracteres).');
      setStep(1);
      return;
    }
    if (pin && pin.length !== 6) {
      Alert.alert('PIN inválido', 'El PIN de seguimiento debe contener exactamente 6 dígitos numéricos.');
      return;
    }
    if (pin && pin !== confirmPin) {
      Alert.alert('PIN no coincide', 'La confirmación del PIN no coincide.');
      return;
    }

    setLoading(true);

    try {
      // 1. Send report
      const response = await CrimeReportsService.createReport({
        category_id: selectedCategory.id,
        description: description.trim(),
        priority,
        is_emergency: isEmergency,
        latitude: coords?.lat || null,
        longitude: coords?.lng || null,
        address_reference: locationAddress.trim() || 'Distrito La Tinguiña',
        location_note: locationNote.trim() || undefined,
        followup_code: pin.trim() || undefined,
      });

      // 2. Upload photo if selected
      if (evidenceUri) {
        try {
          await CrimeReportsService.uploadEvidence(response.public_code, evidenceUri);
        } catch (e) {
          console.warn('Media upload warning:', e);
        }
      }

      // 3. Save receipt locally
      await StorageService.saveReportReceipt({
        public_code: response.public_code,
        type: 'denuncia_anonima',
        category_name: selectedCategory.name,
        created_at: response.created_at,
        followup_code: pin.trim() || undefined,
        address_reference: locationAddress.trim(),
        description_summary: description.trim().slice(0, 80),
      });

      // 4. Navigate to success
      router.replace({
        pathname: '/denuncia/exito',
        params: {
          code: response.public_code,
          pin: pin.trim() || '',
          categoryName: selectedCategory.name,
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

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppHeader
        title="Nueva Denuncia Anónima"
        subtitle="Confidencial y Segura (3 Pasos)"
        showBack
      />

      {/* Progress step bar */}
      <View style={[styles.stepBar, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}>
        <View style={styles.stepItem}>
          <View style={[styles.stepDot, step >= 1 ? { backgroundColor: '#DC2626' } : { backgroundColor: theme.cardBorder }]}>
            <Text style={styles.stepNum}>1</Text>
          </View>
          <Text style={[styles.stepLabel, { color: step === 1 ? theme.text : theme.textSecondary }]}>
            ¿Qué pasó?
          </Text>
        </View>

        <View style={[styles.stepLine, { backgroundColor: step >= 2 ? '#DC2626' : theme.cardBorder }]} />

        <View style={styles.stepItem}>
          <View style={[styles.stepDot, step >= 2 ? { backgroundColor: '#DC2626' } : { backgroundColor: theme.cardBorder }]}>
            <Text style={styles.stepNum}>2</Text>
          </View>
          <Text style={[styles.stepLabel, { color: step === 2 ? theme.text : theme.textSecondary }]}>
            ¿Dónde pasó?
          </Text>
        </View>

        <View style={[styles.stepLine, { backgroundColor: step >= 3 ? '#DC2626' : theme.cardBorder }]} />

        <View style={styles.stepItem}>
          <View style={[styles.stepDot, step >= 3 ? { backgroundColor: '#DC2626' } : { backgroundColor: theme.cardBorder }]}>
            <Text style={styles.stepNum}>3</Text>
          </View>
          <Text style={[styles.stepLabel, { color: step === 3 ? theme.text : theme.textSecondary }]}>
            Evidencia & PIN
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ================= STEP 1: QUÉ PASÓ ================= */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <View style={[styles.privacyBox, { backgroundColor: theme.primaryLight }]}>
              <Feather name="lock" size={16} color={theme.primaryDark} />
              <Text style={[styles.privacyText, { color: theme.primaryDark }]}>
                No solicitamos DNI, nombres ni guardamos tu dirección IP.
              </Text>
            </View>

            <Text style={[styles.inputLabel, { color: theme.text }]}>
              1. Selecciona el tipo de delito:
            </Text>

            <View style={styles.categoryGrid}>
              {categories.map((cat) => {
                const isSelected = selectedCategory?.id === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setSelectedCategory(cat)}
                    style={[
                      styles.categoryCard,
                      {
                        backgroundColor: isSelected ? theme.primaryLight : theme.card,
                        borderColor: isSelected ? theme.primary : theme.cardBorder,
                      },
                    ]}
                  >
                    <Feather
                      name="alert-triangle"
                      size={20}
                      color={isSelected ? theme.primary : theme.textSecondary}
                    />
                    <Text
                      style={[
                        styles.categoryName,
                        { color: isSelected ? theme.primaryDark : theme.text },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.inputLabel, { color: theme.text, marginTop: Spacing.two }]}>
              2. Describe lo ocurrido con el mayor detalle posible:
            </Text>

            <View
              style={[
                styles.textAreaWrapper,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                },
              ]}
            >
              <TextInput
                style={[styles.textArea, { color: theme.text }]}
                placeholder="Indica qué pasó, vestimenta, vehículos, rasgos físicos o detalles relevantes..."
                placeholderTextColor={theme.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>

            {/* Urgency Switch */}
            <Pressable
              onPress={() => setIsEmergency(!isEmergency)}
              style={[
                styles.urgencyToggle,
                {
                  backgroundColor: isEmergency ? '#FEE2E2' : theme.card,
                  borderColor: isEmergency ? '#DC2626' : theme.cardBorder,
                },
              ]}
            >
              <Feather
                name={isEmergency ? 'alert-triangle' : 'shield'}
                size={20}
                color={isEmergency ? '#DC2626' : theme.textSecondary}
              />
              <View style={styles.urgencyTextWrap}>
                <Text style={[styles.urgencyTitle, { color: isEmergency ? '#DC2626' : theme.text }]}>
                  {isEmergency ? '¡Situación de Alta Urgencia Activada!' : 'Marcar como Hecho Urgente'}
                </Text>
                <Text style={[styles.urgencyDesc, { color: theme.textSecondary }]}>
                  Activa alerta prioritaria en la central de radio patrulla.
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => {
                if (!description.trim() || description.trim().length < 10) {
                  Alert.alert('Información incompleta', 'Por favor describe brevemente el hecho (mínimo 10 caracteres).');
                  return;
                }
                setStep(2);
              }}
              style={({ pressed }) => [
                styles.nextButton,
                { backgroundColor: '#DC2626', opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={styles.nextButtonText}>Continuar al Paso 2</Text>
              <Feather name="arrow-right" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        )}

        {/* ================= STEP 2: DÓNDE PASÓ ================= */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>
              Dirección o Referencia del Lugar del Hecho:
            </Text>

            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                },
              ]}
            >
              <Feather name="map-pin" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.textInput, { color: theme.text }]}
                placeholder="Ej. Av. Principal frente a la losa deportiva La Tinguiña"
                placeholderTextColor={theme.textMuted}
                value={locationAddress}
                onChangeText={setLocationAddress}
              />
            </View>

            {/* GPS Button */}
            <Pressable
              onPress={handleGetLocation}
              disabled={gpsLoading}
              style={({ pressed }) => [
                styles.gpsButton,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.cardBorder,
                  opacity: pressed || gpsLoading ? 0.7 : 1,
                },
              ]}
            >
              {gpsLoading ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Feather name="navigation" size={16} color={theme.primary} />
              )}
              <Text style={[styles.gpsButtonText, { color: theme.primary }]}>
                {coords ? '✓ Coordenadas GPS fijadas' : 'Usar mi ubicación GPS actual'}
              </Text>
            </Pressable>

            <Text style={[styles.inputLabel, { color: theme.text, marginTop: Spacing.two }]}>
              Puntos de Referencia Adicionales (Opcional):
            </Text>

            <View
              style={[
                styles.textAreaWrapper,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                },
              ]}
            >
              <TextInput
                style={[styles.textArea, { color: theme.text }]}
                placeholder="Ej. Casa de fachada verde, esquina sin alumbrado, frente a la farmacia..."
                placeholderTextColor={theme.textMuted}
                value={locationNote}
                onChangeText={setLocationNote}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.buttonsRow}>
              <Pressable
                onPress={() => setStep(1)}
                style={({ pressed }) => [
                  styles.prevButton,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.cardBorder,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Feather name="arrow-left" size={18} color={theme.text} />
                <Text style={[styles.prevButtonText, { color: theme.text }]}>Atrás</Text>
              </Pressable>

              <Pressable
                onPress={() => setStep(3)}
                style={({ pressed }) => [
                  styles.nextButtonHalf,
                  { backgroundColor: '#DC2626', opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={styles.nextButtonText}>Continuar al Paso 3</Text>
                <Feather name="arrow-right" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        )}

        {/* ================= STEP 3: EVIDENCIA & PIN ================= */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>
              Adjuntar Foto de Evidencia (Opcional):
            </Text>

            <View style={styles.mediaButtonsRow}>
              <Pressable
                onPress={handleTakePhoto}
                style={({ pressed }) => [
                  styles.mediaOptionBtn,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.cardBorder,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Feather name="camera" size={22} color={theme.primary} />
                <Text style={[styles.mediaOptionText, { color: theme.text }]}>Tomar Foto</Text>
              </Pressable>

              <Pressable
                onPress={handlePickImage}
                style={({ pressed }) => [
                  styles.mediaOptionBtn,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.cardBorder,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Feather name="image" size={22} color={theme.accent} />
                <Text style={[styles.mediaOptionText, { color: theme.text }]}>Galería</Text>
              </Pressable>
            </View>

            {/* Evidence preview */}
            {evidenceUri && (
              <View style={styles.evidencePreviewContainer}>
                <Image
                  source={{ uri: evidenceUri }}
                  style={styles.previewImage}
                  contentFit="cover"
                />
                <Pressable
                  onPress={() => setEvidenceUri(null)}
                  style={styles.removeImageBtn}
                >
                  <Feather name="trash-2" size={16} color="#FFFFFF" />
                </Pressable>
                <View style={styles.sanitizedBadge}>
                  <Feather name="shield" size={12} color="#FFFFFF" />
                  <Text style={styles.sanitizedText}>EXIF / GPS sanitizado</Text>
                </View>
              </View>
            )}

            {/* PIN Section */}
            <View style={[styles.pinCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.pinCardHeader}>
                <Feather name="key" size={18} color={theme.primary} />
                <Text style={[styles.pinCardTitle, { color: theme.text }]}>
                  Clave Secreta de Seguimiento (Opcional)
                </Text>
              </View>
              <Text style={[styles.pinCardDesc, { color: theme.textSecondary }]}>
                Crea un PIN numérico de 6 dígitos si deseas desbloquear la descripción completa y notas internas al consultar el estado de tu denuncia.
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
                    onChangeText={setPin}
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
                    onChangeText={setConfirmPin}
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
                onPress={() => setStep(2)}
                disabled={loading}
                style={({ pressed }) => [
                  styles.prevButton,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.cardBorder,
                    opacity: pressed || loading ? 0.7 : 1,
                  },
                ]}
              >
                <Feather name="arrow-left" size={18} color={theme.text} />
                <Text style={[styles.prevButtonText, { color: theme.text }]}>Atrás</Text>
              </Pressable>

              <Pressable
                onPress={handleSubmit}
                disabled={loading}
                style={({ pressed }) => [
                  styles.submitFinalBtn,
                  {
                    backgroundColor: '#DC2626',
                    opacity: pressed || loading ? 0.8 : 1,
                  },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Feather name="shield" size={18} color="#FFFFFF" />
                    <Text style={styles.submitFinalBtnText}>Enviar Denuncia</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
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
    fontSize: 11,
    fontWeight: '700',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 6,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.seven,
  },
  stepContainer: {
    gap: Spacing.three,
  },
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
  },
  privacyText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
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
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  textAreaWrapper: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.three,
  },
  textArea: {
    fontSize: 14,
    minHeight: 100,
  },
  urgencyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginTop: Spacing.one,
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
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.OS === 'ios' ? Spacing.two + 4 : Spacing.one,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  gpsButtonText: {
    fontSize: 13,
    fontWeight: '700',
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
    height: 180,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginTop: Spacing.one,
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
    backgroundColor: 'rgba(4, 120, 87, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    padding: Spacing.four,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  pinCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  pinCardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  pinCardDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  pinInputsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  pinInputWrap: {
    flex: 1,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Platform.OS === 'ios' ? Spacing.two : Spacing.one,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  pinInput: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '700',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  prevButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  prevButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.two,
  },
  nextButtonHalf: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: BorderRadius.lg,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  submitFinalBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: BorderRadius.lg,
  },
  submitFinalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
