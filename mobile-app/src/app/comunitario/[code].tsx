import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppHeader } from '@/components/ui/AppHeader';
import { SocialCard } from '@/components/ui/SocialCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { CommunityReportItem } from '@/types';
import { CommunityReportsService } from '@/services/communityReportsService';

export default function CommunityReportDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ code: string }>();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<CommunityReportItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.code) {
      CommunityReportsService.getCommunityReport(params.code)
        .then((data) => setReport(data))
        .catch((e) => setError(e.message || 'Reporte no encontrado'))
        .finally(() => setLoading(false));
    }
  }, [params.code]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <AppHeader
        title="Detalle de Incidencia"
        subtitle={params.code || 'Reporte Vecinal'}
        showBack
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Cargando información del reporte...
          </Text>
        </View>
      ) : error || !report ? (
        <View style={styles.centerContainer}>
          <Feather name="alert-circle" size={40} color={theme.danger} />
          <Text style={[styles.errorTitle, { color: theme.text }]}>
            Reporte no disponible
          </Text>
          <Text style={[styles.errorDesc, { color: theme.textSecondary }]}>
            {error || 'No se pudo cargar la información de esta incidencia.'}
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.backBtnText}>Volver</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Social Card Component with WhatsApp button */}
          <SocialCard report={report} />

          {/* Additional details */}
          <View
            style={[
              styles.detailCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Información de la Incidencia
            </Text>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Estado Actual:
              </Text>
              <StatusBadge status={report.status} size="small" />
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Fecha de Registro:
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {new Date(report.created_at).toLocaleString('es-PE')}
              </Text>
            </View>

            <View style={styles.infoBlock}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Ubicación / Referencia:
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {report.address_reference || 'Sector urbano La Tinguiña, Ica'}
              </Text>
            </View>

            <View style={styles.infoBlock}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Descripción Completa:
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {report.description}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  loadingText: {
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  errorDesc: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 300,
  },
  backBtn: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two + 2,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.two,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.four,
    paddingBottom: Spacing.seven,
  },
  detailCard: {
    padding: Spacing.four,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: Spacing.three,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: Spacing.one,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoBlock: {
    gap: 4,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: 13,
    lineHeight: 18,
  },
});
