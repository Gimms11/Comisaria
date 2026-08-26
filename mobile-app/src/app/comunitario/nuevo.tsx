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

  const handleGetLocation = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso no concedido', 'Puedes ingresar la dirección o referencia manualmente.');
        setGpsLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      if (!address) {
        setAddress(`Ubicación GPS: ${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`);
      }
    } catch {
      Alert.alert('Aviso', 'No se pudo obtener el GPS. Ingrese la dirección manualmente.');
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
      Alert.alert('Descripción requerida', 'Describe brevemente el problema vecinal (mínimo 8 caracteres).');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Ubicación requerida', 'Por favor ingresa la calle, avenida o referencia del lugar.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create community report
      const response = await CommunityReportsService.createReport({
        category_id: selectedCategory.id,
        description: description.trim(),
        latitude: coords?.lat || null,
        longitude: coords?.lng || null,
        address_reference: address.trim(),
      });

      // 2. Upload photo if selected
      if (evidenceUri) {
        try {
          await CommunityReportsService.uploadEvidence(response.public_code, evidenceUri);
        } catch (e) {
          console.warn('Community media upload warning:', e);
        }
      }

      // 3. Save receipt locally
      await StorageService.saveReportReceipt({
        public_code: response.public_code,
        type: 'reporte_comunitario',
        category_name: selectedCategory.name,
        created_at: response.created_at,
        address_reference: address.trim(),
        description_summary: description.trim().slice(0, 80),
      });

      // 4. Navigate to report detail with social card
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

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppHeader
        title="Reporte Comunitario"
        subtitle="Problemas de infraestructura vecinal"
        showBack
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info card */}
        <View style={[styles.infoBanner, { backgroundColor: '#E0F2FE', borderColor: '#BAE6FD' }]}>
          <Feather name="info" size={16} color="#0284C7" />
          <Text style={styles.infoText}>
            Este reporte será visible públicamente en el muro vecinal para coordinar solución con autoridades y ser difundido en redes.
          </Text>
        </View>

        {/* Categories */}
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
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: isSelected ? '#E0F2FE' : theme.card,
                    borderColor: isSelected ? '#0284C7' : theme.cardBorder,
                  },
                ]}
              >
                <Feather
                  name="map-pin"
                  size={18}
                  color={isSelected ? '#0284C7' : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.categoryName,
                    { color: isSelected ? '#0369A1' : theme.text },
                  ]}
                >
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Description */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: Spacing.two }]}>
          2. Detalle del Problema:
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
            placeholder="Describe el estado de la falla, riesgo para peatones o vehículos..."
            placeholderTextColor={theme.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Location */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: Spacing.two }]}>
          3. Ubicación o Referencia:
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
            placeholder="Calle, avenida, cuadra o cruce..."
            placeholderTextColor={theme.textMuted}
            value={address}
            onChangeText={setAddress}
          />
        </View>

        <Pressable
          onPress={handleGetLocation}
          disabled={gpsLoading}
          style={({ pressed }) => [
            styles.gpsBtn,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.cardBorder,
              opacity: pressed || gpsLoading ? 0.7 : 1,
            },
          ]}
        >
          {gpsLoading ? (
            <ActivityIndicator size="small" color="#0284C7" />
          ) : (
            <Feather name="navigation" size={16} color="#0284C7" />
          )}
          <Text style={styles.gpsBtnText}>
            {coords ? '✓ Coordenadas GPS fijadas' : 'Usar mi ubicación GPS actual'}
          </Text>
        </Pressable>

        {/* Photo attachment */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: Spacing.two }]}>
          4. Foto de la Incidencia:
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
              backgroundColor: '#0284C7',
              opacity: loading || pressed ? 0.85 : 1,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Feather name="send" size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>Publicar Reporte Vecinal</Text>
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
    minHeight: 90,
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
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two + 4,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  gpsBtnText: {
    color: '#0284C7',
    fontSize: 13,
    fontWeight: '700',
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
    height: 180,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginTop: Spacing.one,
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
    marginTop: Spacing.two,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
