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
import {
  CRIME_QUICK_PRESETS,
  LA_TINGUINA_ZONES,
  LOCATION_CONTEXT_TAGS,
} from '@/constants/crimePresets';

export default function NewCrimeReportScreen() {
  const theme = useTheme();
  const router = useRouter();

  // Form State
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ReportPriority>('alta');
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
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
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
      Alert.alert('Campo requerido', 'Por favor selecciona un tipo de delito.');
      setStep(1);
      return;
    }
    if (!description.trim() || description.trim().length < 8) {
      Alert.alert(
        'Descripción requerida',
        'Toca los botones de situación rápida para describir lo que ocurre en segundos.'
      );
      setStep(1);
      return;
    }
    if (pin && pin.length !== 6) {
      Alert.alert('PIN inválido', 'El PIN debe tener 6 dígitos numéricos o déjalo vacío para enviar anónimamente.');
      return;
    }
    if (pin && pin !== confirmPin) {
      Alert.alert('PIN no coincide', 'La confirmación del PIN no coincide.');
      return;
    }

    setLoading(true);

    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[DenunciaNueva] 🚀 Enviando denuncia anónima a MS-02...');
      console.log('[DenunciaNueva] Categoría:', selectedCategory.name, `(${selectedCategory.id})`);
      console.log('[DenunciaNueva] Urgencia:', isEmergency ? 'urgente' : priority);
      console.log('[DenunciaNueva] Dirección:', locationAddress.trim() || 'Sector urbano La Tinguiña, Ica');
      console.log('[DenunciaNueva] Evidencia fotográfica:', evidenceUri ? evidenceUri : 'Ninguna');

      const response = await CrimeReportsService.createReport({
        category_id: selectedCategory.id,
        description: description.trim(),
        priority: isEmergency ? 'urgente' : priority,
        is_emergency: isEmergency,
        latitude: coords?.lat || null,
        longitude: coords?.lng || null,
        address_reference: locationAddress.trim() || 'Sector urbano La Tinguiña, Ica',
        location_note: locationNote.trim() || undefined,
        followup_code: pin.trim() || undefined,
      });

      console.log('[DenunciaNueva] ✅ Denuncia creada exitosamente con código:', response.public_code);

      if (evidenceUri) {
        console.log('[DenunciaNueva] 📸 Subiendo foto de evidencia para código:', response.public_code);
        try {
          const uploadRes = await CrimeReportsService.uploadEvidence(response.public_code, evidenceUri);
          console.log('[DenunciaNueva] ✅ Evidencia fotográfica adjuntada con éxito:', uploadRes);
        } catch (e: any) {
          console.error('[DenunciaNueva] ❌ Error al subir evidencia fotográfica:', e?.message || e);
        }
      } else {
        console.log('[DenunciaNueva] ℹ️ Denuncia enviada sin foto adjunta.');
      }

      await StorageService.saveReportReceipt({
        public_code: response.public_code,
        type: 'denuncia_anonima',
        category_name: selectedCategory.name,
        created_at: response.created_at,
        followup_code: pin.trim() || undefined,
        address_reference: locationAddress.trim() || 'La Tinguiña',
        description_summary: description.trim().slice(0, 80),
      });

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

  // Quick preset groups for the currently selected category
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
            { opacity: pressed ? 0.7 : 1 },
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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ================= STEP 1: QUÉ PASÓ (ZERO TYPING) ================= */}
        {step === 1 && (
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
                    onPress={() => setSelectedCategory(cat)}
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

            {/* QUICK 1-TAP DESCRIPTORS (ZERO TYPING CORE) */}
            <View style={[styles.quickTagsSection, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.quickTagsHeader}>
                <View style={styles.quickTagsTitleRow}>
                  <Feather name="zap" size={16} color="#D97706" />
                  <Text style={[styles.quickTagsTitle, { color: theme.text }]}>
                    Toque rápido para describir (sin escribir):
                  </Text>
                </View>
                {description.length > 0 && (
                  <Pressable onPress={() => setDescription('')}>
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
                          onPress={() => handleToggleTag(tag)}
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

            {/* Description Text Box */}
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
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Urgency Alert Switch */}
            <Pressable
              onPress={() => setIsEmergency(!isEmergency)}
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
              onPress={() => {
                if (!isStep1Valid) {
                  Alert.alert(
                    'Información requerida',
                    'Toca cualquiera de los botones de situación arriba para autocompletar la descripción.'
                  );
                  return;
                }
                setStep(2);
              }}
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
        )}

        {/* ================= STEP 2: DÓNDE PASÓ (1-TAP LOCATIONS) ================= */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            {/* Instant 1-Tap GPS Button */}
            <Pressable
              onPress={handleGetLocation}
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
                      onPress={() => handleToggleZone(zone)}
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
                  onChangeText={setLocationAddress}
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
                      onPress={() => handleToggleLocationContext(ctx)}
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
                onPress={() => setStep(1)}
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
                onPress={() => {
                  if (!isStep2Valid) {
                    Alert.alert(
                      'Ubicación requerida',
                      'Toca el botón de GPS o selecciona una de las zonas de La Tinguiña.'
                    );
                    return;
                  }
                  setStep(3);
                }}
                style={({ pressed }) => [
                  styles.nextBtnHalf,
                  {
                    backgroundColor: isStep2Valid ? '#DC2626' : '#94A3B8',
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={styles.nextBtnText}>Siguiente: Evidencia y PIN</Text>
                <Feather name="arrow-right" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        )}

        {/* ================= STEP 3: EVIDENCIA & ENVÍO EXPRESS ================= */}
        {step === 3 && (
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
                <Feather name="camera" size={20} color="#DC2626" />
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
                  onPress={handleGeneratePin}
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
                onPress={handleSubmit}
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
    top: Platform.OS === 'ios' ? 14 : 18,
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
    paddingBottom: Spacing.seven,
  },
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
    paddingVertical: Platform.OS === 'ios' ? Spacing.two : 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  pinInput: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
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
