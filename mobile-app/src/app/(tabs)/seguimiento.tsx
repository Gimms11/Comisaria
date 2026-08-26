import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { AppHeader } from '@/components/ui/AppHeader';
import { StatusBadge, getStatusConfig } from '@/components/ui/StatusBadge';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { LocalReportReceipt, ReportStatusDetail } from '@/types';
import { CrimeReportsService } from '@/services/crimeReportsService';
import { StorageService } from '@/services/storageService';

export default function TrackingScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ code?: string; pin?: string }>();

  const [publicCode, setPublicCode] = useState(params.code || '');
  const [pin, setPin] = useState(params.pin || '');
  const [showPinInput, setShowPinInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReportStatusDetail | null>(null);
  const [myReports, setMyReports] = useState<LocalReportReceipt[]>([]);

  useEffect(() => {
    StorageService.getMyReports().then(setMyReports);
  }, []);

  useEffect(() => {
    if (params.code) {
      setPublicCode(params.code);
      if (params.pin) {
        setPin(params.pin);
        setShowPinInput(true);
      }
      handleSearch(params.code, params.pin);
    }
  }, [params.code, params.pin]);

  const handleSearch = async (codeToSearch?: string, pinToSearch?: string) => {
    const searchCode = (codeToSearch || publicCode).trim().toUpperCase();
    if (!searchCode) {
      setError('Por favor ingresa un código de denuncia (ej. LT-2026-000123)');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await CrimeReportsService.getReportStatus(
        searchCode,
        pinToSearch || pin || undefined
      );
      setResult(data);
    } catch (e: any) {
      setError(
        e.message ||
          'No se pudo encontrar el reporte. Verifica el código e intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSaved = (saved: LocalReportReceipt) => {
    setPublicCode(saved.public_code);
    if (saved.followup_code) {
      setPin(saved.followup_code);
      setShowPinInput(true);
      handleSearch(saved.public_code, saved.followup_code);
    } else {
      handleSearch(saved.public_code);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppHeader
        title="Consulta y Seguimiento"
        subtitle="Rastreo anónimo en tiempo real"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Card */}
        <View
          style={[
            styles.searchCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: theme.primaryLight }]}>
              <Feather name="search" size={18} color={theme.primary} />
            </View>
            <View>
              <Text style={[styles.searchCardTitle, { color: theme.text }]}>
                Ingresa tu Código de Denuncia
              </Text>
              <Text style={[styles.searchCardSub, { color: theme.textSecondary }]}>
                Formato oficial: LT-2026-XXXXXX
              </Text>
            </View>
          </View>

          {/* Input Code */}
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.cardBorder,
              },
            ]}
          >
            <Feather name="hash" size={18} color={theme.textSecondary} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Ej. LT-2026-000123"
              placeholderTextColor={theme.textMuted}
              value={publicCode}
              onChangeText={(text) => {
                setPublicCode(text.toUpperCase());
                setError(null);
              }}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {publicCode.length > 0 && (
              <Pressable onPress={() => setPublicCode('')}>
                <Feather name="x" size={16} color={theme.textSecondary} />
              </Pressable>
            )}
          </View>

          {/* PIN toggle */}
          <Pressable
            onPress={() => setShowPinInput(!showPinInput)}
            style={styles.pinToggleRow}
          >
            <Feather
              name={showPinInput ? 'check-square' : 'square'}
              size={16}
              color={theme.primary}
            />
            <Text style={[styles.pinToggleText, { color: theme.text }]}>
              Tengo clave secreta / PIN de 6 dígitos
            </Text>
          </Pressable>

          {showPinInput && (
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.cardBorder,
                },
              ]}
            >
              <Feather name="key" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="PIN secreto de 6 dígitos"
                placeholderTextColor={theme.textMuted}
                value={pin}
                onChangeText={setPin}
                keyboardType="numeric"
                maxLength={6}
                secureTextEntry
              />
            </View>
          )}

          {/* Submit Search Button */}
          <Pressable
            onPress={() => handleSearch()}
            disabled={loading}
            style={({ pressed }) => [
              styles.searchButton,
              {
                backgroundColor: theme.primary,
                opacity: loading || pressed ? 0.8 : 1,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Feather name="search" size={18} color="#FFFFFF" />
                <Text style={styles.searchButtonText}>Buscar Estado</Text>
              </>
            )}
          </Pressable>

          {error && (
            <View style={[styles.errorBox, { backgroundColor: theme.dangerLight }]}>
              <Feather name="alert-circle" size={16} color={theme.danger} />
              <Text style={[styles.errorText, { color: theme.danger }]}>
                {error}
              </Text>
            </View>
          )}
        </View>

        {/* Quick stored codes */}
        {myReports.length > 0 && !result && (
          <View style={styles.storedSection}>
            <Text style={[styles.storedTitle, { color: theme.text }]}>
              Mis Denuncias y Reportes en este dispositivo:
            </Text>
            <View style={styles.storedList}>
              {myReports.map((saved) => (
                <Pressable
                  key={saved.public_code}
                  onPress={() => handleSelectSaved(saved)}
                  style={({ pressed }) => [
                    styles.storedItem,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.cardBorder,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <View style={styles.storedItemLeft}>
                    <View style={[styles.typeBadge, { backgroundColor: theme.primaryLight }]}>
                      <Text style={[styles.typeBadgeText, { color: theme.primaryDark }]}>
                        {saved.type === 'denuncia_anonima' ? 'DENUNCIA' : 'VECINAL'}
                      </Text>
                    </View>
                    <Text style={[styles.storedCode, { color: theme.text }]}>
                      {saved.public_code}
                    </Text>
                    <Text style={[styles.storedCat, { color: theme.textSecondary }]} numberOfLines={1}>
                      {saved.category_name}
                    </Text>
                  </View>
                  <Feather name="arrow-right" size={18} color={theme.primary} />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Search Result */}
        {result && (
          <View style={styles.resultContainer}>
            {/* Status Summary Card */}
            <View
              style={[
                styles.resultCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                },
              ]}
            >
              <View style={styles.resultHeader}>
                <View>
                  <Text style={[styles.resCode, { color: theme.primary }]}>
                    {result.public_code}
                  </Text>
                  <Text style={[styles.resCategory, { color: theme.text }]}>
                    {result.category_name}
                  </Text>
                </View>
                <StatusBadge status={result.status} size="medium" />
              </View>

              {/* Pin verification banner */}
              <View
                style={[
                  styles.verificationBanner,
                  {
                    backgroundColor: result.is_verified
                      ? theme.successLight
                      : theme.backgroundElement,
                  },
                ]}
              >
                <Feather
                  name={result.is_verified ? 'unlock' : 'lock'}
                  size={14}
                  color={result.is_verified ? theme.success : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.verificationText,
                    {
                      color: result.is_verified
                        ? theme.success
                        : theme.textSecondary,
                    },
                  ]}
                >
                  {result.is_verified
                    ? 'Identidad validada con PIN secreto: Detalles completos visibles'
                    : 'Modo público: Ingrese su PIN secreto para ver el detalle de los hechos'}
                </Text>
              </View>

              {/* Description */}
              <View style={styles.descBlock}>
                <Text style={[styles.blockLabel, { color: theme.textSecondary }]}>
                  DESCRIPCIÓN DEL HECHO
                </Text>
                <Text style={[styles.blockValue, { color: theme.text }]}>
                  {result.description}
                </Text>
              </View>

              {/* Dates */}
              <View style={styles.dateRow}>
                <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>
                  Registrado el:{' '}
                  <Text style={{ color: theme.text, fontWeight: '600' }}>
                    {new Date(result.created_at).toLocaleString('es-PE')}
                  </Text>
                </Text>
              </View>
            </View>

            {/* Timeline of Status History */}
            <View
              style={[
                styles.timelineCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                },
              ]}
            >
              <Text style={[styles.timelineTitle, { color: theme.text }]}>
                Historial de Atención Policial
              </Text>

              {result.history && result.history.length > 0 ? (
                <View style={styles.timelineList}>
                  {result.history.map((hist, idx) => {
                    const conf = getStatusConfig(hist.status);
                    const isLast = idx === result.history.length - 1;
                    return (
                      <View key={idx} style={styles.timelineItem}>
                        <View style={styles.timelineLeftCol}>
                          <View
                            style={[
                              styles.timelineDot,
                              { backgroundColor: conf.textColor },
                            ]}
                          />
                          {!isLast && (
                            <View
                              style={[
                                styles.timelineLine,
                                { backgroundColor: theme.cardBorder },
                              ]}
                            />
                          )}
                        </View>
                        <View style={styles.timelineContent}>
                          <View style={styles.timelineHeader}>
                            <Text
                              style={[
                                styles.timelineStatus,
                                { color: conf.textColor },
                              ]}
                            >
                              {conf.label}
                            </Text>
                            <Text
                              style={[
                                styles.timelineDate,
                                { color: theme.textSecondary },
                              ]}
                            >
                              {new Date(hist.created_at).toLocaleDateString('es-PE', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Text>
                          </View>
                          {hist.note && (
                            <Text
                              style={[
                                styles.timelineNote,
                                {
                                  color: theme.text,
                                  backgroundColor: theme.backgroundElement,
                                },
                              ]}
                            >
                              💬 {hist.note}
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.timelineItem}>
                  <View style={styles.timelineLeftCol}>
                    <View
                      style={[styles.timelineDot, { backgroundColor: '#F59E0B' }]}
                    />
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineStatus, { color: '#B45309' }]}>
                      Pendiente de Asignación
                    </Text>
                    <Text
                      style={[
                        styles.timelineDate,
                        { color: theme.textSecondary },
                      ]}
                    >
                      En cola de revisión por el operador de guardia.
                    </Text>
                  </View>
                </View>
              )}
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
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.four,
    paddingBottom: Spacing.seven,
  },
  searchCard: {
    padding: Spacing.four,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: Spacing.three,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchCardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  searchCardSub: {
    fontSize: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.OS === 'ios' ? Spacing.two + 4 : Spacing.one,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  pinToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  pinToggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.one,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  storedSection: {
    gap: Spacing.two,
  },
  storedTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  storedList: {
    gap: Spacing.two,
  },
  storedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  storedItemLeft: {
    flex: 1,
    gap: 3,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  storedCode: {
    fontSize: 15,
    fontWeight: '800',
  },
  storedCat: {
    fontSize: 12,
  },
  resultContainer: {
    gap: Spacing.three,
  },
  resultCard: {
    padding: Spacing.four,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: Spacing.three,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  resCode: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  resCategory: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  verificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two + 2,
    borderRadius: BorderRadius.md,
  },
  verificationText: {
    fontSize: 12,
    flex: 1,
    fontWeight: '600',
  },
  descBlock: {
    gap: 4,
  },
  blockLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  blockValue: {
    fontSize: 13,
    lineHeight: 19,
  },
  dateRow: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: Spacing.two,
  },
  dateLabel: {
    fontSize: 11,
  },
  timelineCard: {
    padding: Spacing.four,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: Spacing.three,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  timelineList: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 60,
  },
  timelineLeftCol: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: Spacing.two,
    paddingBottom: Spacing.three,
    gap: 4,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  timelineStatus: {
    fontSize: 13,
    fontWeight: '700',
  },
  timelineDate: {
    fontSize: 11,
  },
  timelineNote: {
    fontSize: 12,
    padding: Spacing.two,
    borderRadius: BorderRadius.md,
    marginTop: 2,
    lineHeight: 16,
  },
});
