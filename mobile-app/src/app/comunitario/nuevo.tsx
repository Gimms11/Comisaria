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
import { Category } from '@/types';
import { CommunityReportsService } from '@/services/communityReportsService';
import { StorageService } from '@/services/storageService';
import {
  COMMUNITY_QUICK_PRESETS,
  LA_TINGUINA_ZONES,
} from '@/constants/crimePresets';

export default function NewCommunityReportScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [evidenceUri, setEvidenceUri] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  useEffect(() => {
    CommunityReportsService.getCategories().then((cats) => {
      setCategories(cats);
      if (cats.length > 0) {
        setSelectedCategory(cats[0]);
      }
    });
  }, []);

  const handleToggleCivicTag = (tag: string) => {
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
    setAddress((prev) => {
      if (prev.trim().toLowerCase() === zone.trim().toLowerCase()) {
        return '';
      }
      return zone;
    });
  };

  const handleGetLocation = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso no concedido', 'Puedes tocar una de las zonas frecuentes de La Tinguiña.');
        setGpsLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      if (!address) {
        setAddress(`GPS: ${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)} (La Tinguiña)`);
      }
    } catch {
      Alert.alert('Aviso', 'Puedes seleccionar una zona de La Tinguiña con 1 toque.');
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
      Alert.alert('Campo requerido', 'Selecciona el tipo de falla urbana.');
      return;
    }
    if (!description.trim() || description.trim().length < 8) {
      Alert.alert('Descripción requerida', 'Toca los botones de detalle rápido para describir el problema.');
      return;
    }
    if (!address.trim() && !coords) {
      Alert.alert('Ubicación requerida', 'Por favor toca el botón GPS o elige una zona de La Tinguiña.');
      return;
    }

    setLoading(true);

    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[ComunitarioNuevo] 🚀 Enviando reporte comunitario a MS-03...');
      console.log('[ComunitarioNuevo] Categoría:', selectedCategory.name, `(${selectedCategory.id})`);
      console.log('[ComunitarioNuevo] Dirección:', address.trim() || 'Sector urbano La Tinguiña, Ica');
      console.log('[ComunitarioNuevo] Evidencia adjunta:', evidenceUri ? evidenceUri : 'Ninguna');

      const response = await CommunityReportsService.createReport({
        category_id: selectedCategory.id,
        description: description.trim(),
        latitude: coords?.lat || null,
        longitude: coords?.lng || null,
        address_reference: address.trim() || 'Sector urbano La Tinguiña, Ica',
      });

      console.log('[ComunitarioNuevo] ✅ Reporte comunitario creado exitosamente con código:', response.public_code);

      if (evidenceUri) {
        console.log('[ComunitarioNuevo] 📸 Subiendo foto de evidencia para código:', response.public_code);
        try {
          const uploadRes = await CommunityReportsService.uploadEvidence(response.public_code, evidenceUri);
          console.log('[ComunitarioNuevo] ✅ Foto comunitaria adjuntada con éxito:', uploadRes);
        } catch (e: any) {
          console.error('[ComunitarioNuevo] ❌ Error al subir foto comunitaria:', e?.message || e);
        }
      } else {
        console.log('[ComunitarioNuevo] ℹ️ Reporte comunitario enviado sin foto adjunta.');
      }

      await StorageService.saveReportReceipt({
        public_code: response.public_code,
        type: 'reporte_comunitario',
        category_name: selectedCategory.name,
        created_at: response.created_at,
        address_reference: address.trim() || 'La Tinguiña',
        description_summary: description.trim().slice(0, 80),
      });

      router.replace(`/comunitario/${response.public_code}` as any);
    } catch (error: any) {
      Alert.alert(
        'Error al enviar reporte',
        error.message || 'No se pudo conectar con el servidor.'
      );
    } finally {
      setLoading(false);
    }
  };

  const activeCivicTags = selectedCategory
    ? COMMUNITY_QUICK_PRESETS[selectedCategory.id] || COMMUNITY_QUICK_PRESETS.default
    : COMMUNITY_QUICK_PRESETS.default;

  const isValid = description.trim().length >= 8 && (address.trim().length > 0 || coords !== null);

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppHeader
        title="Reporte Comunitario"
        subtitle="Muro Cívico Vecinal"
        showBack
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info banner */}
        <View style={[styles.infoBanner, { backgroundColor: '#E0F2FE', borderColor: '#BAE6FD' }]}>
          <Feather name="info" size={16} color="#0284C7" />
          <Text style={styles.infoText}>
            Tu reporte será publicado en el muro vecinal para coordinar atención comunitaria y generar tarjeta WhatsApp.
          </Text>
        </View>

        {/* 1. Category Selection */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          1. Tipo de Falla o Problema Urbano:
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
                    backgroundColor: isSelected ? '#E0F2FE' : theme.card,
                    borderColor: isSelected ? '#0284C7' : theme.cardBorder,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.catIconCircle,
                    { backgroundColor: isSelected ? '#0284C7' : theme.backgroundElement },
                  ]}
                >
                  <Feather
                    name="map-pin"
                    size={16}
                    color={isSelected ? '#FFFFFF' : theme.textSecondary}
                  />
                </View>
                <Text
                  style={[
                    styles.categoryName,
                    { color: isSelected ? '#0369A1' : theme.text },
                  ]}
                >
                  {cat.name}
                </Text>
                {isSelected && (
                  <View style={styles.selectedCheck}>
                    <Feather name="check" size={12} color="#0284C7" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* 2. Quick Civic Descriptors */}
        <View style={[styles.quickTagsSection, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.quickTagsHeader}>
            <View style={styles.quickTagsTitleRow}>
              <Feather name="zap" size={16} color="#0284C7" />
              <Text style={[styles.quickTagsTitle, { color: theme.text }]}>
                Toque rápido para describir la falla:
              </Text>
            </View>
            {description.length > 0 && (
              <Pressable onPress={() => setDescription('')}>
                <Text style={styles.clearText}>Limpiar</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.chipsWrap}>
            {activeCivicTags.map((tag, tIdx) => {
              const isAdded = description
                .split(' • ')
                .map((p) => p.trim().toLowerCase())
                .includes(tag.trim().toLowerCase());
              return (
                <Pressable
                  key={tIdx}
                  onPress={() => handleToggleCivicTag(tag)}
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
                    {tag}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Description Field */}
        <View style={styles.descBlock}>
          <View style={styles.descLabelRow}>
            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>
              2. Detalle del Problema:
            </Text>
            <Text
              style={[
                styles.counterText,
                { color: description.trim().length >= 8 ? '#16A34A' : theme.textSecondary },
              ]}
            >
              {description.trim().length >= 8 ? '✓ Listo' : 'Mínimo 8 letras'}
            </Text>
          </View>

          <View
            style={[
              styles.textAreaWrapper,
              {
                backgroundColor: theme.card,
                borderColor: description.trim().length >= 8 ? '#0284C7' : theme.cardBorder,
              },
            ]}
          >
            <TextInput
              style={[styles.textArea, { color: theme.text }]}
              placeholder="Toca los botones arriba o escribe aquí el estado de la falla..."
              placeholderTextColor={theme.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* 3. Location: GPS + La Tinguiña Zones */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          3. Ubicación del Problema:
        </Text>

        <Pressable
          onPress={handleGetLocation}
          disabled={gpsLoading}
          style={({ pressed }) => [
            styles.giantGpsBtn,
            {
              backgroundColor: coords ? '#DCFCE7' : '#0284C7',
              borderColor: coords ? '#16A34A' : '#0369A1',
              opacity: pressed || gpsLoading ? 0.85 : 1,
            },
          ]}
        >
          {gpsLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Feather
              name={coords ? 'check-circle' : 'navigation'}
              size={20}
              color={coords ? '#16A34A' : '#FFFFFF'}
            />
          )}
          <View style={styles.giantGpsTextWrap}>
            <Text style={[styles.giantGpsTitle, { color: coords ? '#15803D' : '#FFFFFF' }]}>
              {coords ? '✓ Ubicación GPS Fijada' : 'Fijar Mi Ubicación GPS (1 Toque)'}
            </Text>
            <Text style={[styles.giantGpsSub, { color: coords ? '#166534' : 'rgba(255,255,255,0.85)' }]}>
              {coords ? `GPS: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : 'Detecta la calle exacta automáticamente'}
            </Text>
          </View>
        </Pressable>

        {/* Zone chips */}
        <View style={[styles.quickTagsSection, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.tagGroupLabel, { color: theme.textSecondary }]}>
            Zonas de La Tinguiña (1 toque):
          </Text>
          <View style={styles.chipsWrap}>
            {LA_TINGUINA_ZONES.map((zone, zIdx) => {
              const isSelected = address.trim().toLowerCase() === zone.trim().toLowerCase();
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

        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: theme.card,
              borderColor: address.trim().length > 0 ? '#0284C7' : theme.cardBorder,
            },
          ]}
        >
          <Feather name="map-pin" size={18} color="#0284C7" />
          <TextInput
            style={[styles.textInput, { color: theme.text }]}
            placeholder="Calle, avenida o referencia..."
            placeholderTextColor={theme.textMuted}
            value={address}
            onChangeText={setAddress}
          />
        </View>

        {/* 4. Photo Evidence */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          4. Foto de la Incidencia (Opcional):
        </Text>

        <View style={styles.mediaOptionsRow}>
          <Pressable
            onPress={handleTakePhoto}
            style={({ pressed }) => [
              styles.mediaBtn,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Feather name="camera" size={20} color="#0284C7" />
            <Text style={[styles.mediaBtnText, { color: theme.text }]}>Tomar Foto</Text>
          </Pressable>

          <Pressable
            onPress={handlePickImage}
            style={({ pressed }) => [
              styles.mediaBtn,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Feather name="image" size={20} color="#0284C7" />
            <Text style={[styles.mediaBtnText, { color: theme.text }]}>Galería</Text>
          </Pressable>
        </View>

        {evidenceUri && (
          <View style={styles.previewWrap}>
            <Image
              source={{ uri: evidenceUri }}
              style={styles.previewImg}
              contentFit="cover"
            />
            <Pressable
              onPress={() => setEvidenceUri(null)}
              style={styles.removeBtn}
            >
              <Feather name="trash-2" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        )}

        {/* Submit */}
        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          style={({ pressed }) => [
            styles.submitBtn,
            {
              backgroundColor: isValid ? '#0284C7' : '#94A3B8',
              opacity: loading || pressed ? 0.85 : 1,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Feather name="send" size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>PUBLICAR EN MURO VECINAL</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.three,
    paddingBottom: Spacing.seven,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  infoText: {
    color: '#0369A1',
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
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
    color: '#0284C7',
    fontWeight: '700',
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
    minHeight: 75,
    lineHeight: 20,
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
  mediaOptionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  mediaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  mediaBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  previewWrap: {
    position: 'relative',
    height: 160,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  previewImg: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
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
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three + 2,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.one,
    elevation: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
