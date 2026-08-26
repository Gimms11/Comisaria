import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/ui/AppHeader';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { GuideItem, LocalReportReceipt } from '@/types';
import { GuidesService } from '@/services/guidesService';
import { StorageService } from '@/services/storageService';
import { GuideStepsSheet } from '@/components/guides/GuideStepsSheet';

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);
  const [featuredGuides, setFeaturedGuides] = useState<GuideItem[]>([]);
  const [myReports, setMyReports] = useState<LocalReportReceipt[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<GuideItem | null>(null);

  const loadData = async () => {
    try {
      const [guides, saved] = await Promise.all([
        GuidesService.listGuides(),
        StorageService.getMyReports(),
      ]);
      setFeaturedGuides(guides.slice(0, 4));
      setMyReports(saved);
    } catch (e) {
      console.warn('Error loading home data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <AppHeader />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Banner de Bienvenida y Seguridad */}
        <View
          style={[
            styles.heroBanner,
            {
              backgroundColor: theme.primaryDark,
              borderColor: theme.cardBorder,
            },
          ]}
        >
          <View style={styles.heroTextContent}>
            <View style={styles.heroBadge}>
              <Feather name="shield" size={13} color="#D1FAE5" />
              <Text style={styles.heroBadgeText}>FASE 1 — CANAL OFICIAL</Text>
            </View>
            <Text style={styles.heroTitle}>
              Seguridad Ciudadana al Alcance de Todos
            </Text>
            <Text style={styles.heroSubtitle}>
              Denuncia delitos en forma 100% anónima o reporta fallas urbanas de tu barrio sin crear cuenta.
            </Text>
          </View>
        </View>

        {/* 2 Botones de Acción Primarios */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          ¿Qué deseas realizar hoy?
        </Text>

        <View style={styles.primaryGrid}>
          {/* Card 1: Denuncia Anónima */}
          <Pressable
            onPress={() => router.push('/denuncia/nueva' as any)}
            style={({ pressed }) => [
              styles.primaryCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <View style={[styles.cardIconBox, { backgroundColor: '#DC2626' }]}>
              <Feather name="alert-triangle" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.cardContent}>
              <View style={styles.cardTitleRow}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Denuncia Anónima
                </Text>
                <View style={styles.zeroTraceBadge}>
                  <Text style={styles.zeroTraceText}>Zero Datos</Text>
                </View>
              </View>
              <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
                Extorsión, robos, sospechosos o violencia. Tu identidad está 100% protegida.
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>

          {/* Card 2: Reporte Comunitario */}
          <Pressable
            onPress={() => router.push('/comunitario/nuevo' as any)}
            style={({ pressed }) => [
              styles.primaryCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <View style={[styles.cardIconBox, { backgroundColor: '#0284C7' }]}>
              <Feather name="map-pin" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.cardContent}>
              <View style={styles.cardTitleRow}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Reporte Comunitario
                </Text>
                <View style={[styles.zeroTraceBadge, { backgroundColor: '#E0F2FE' }]}>
                  <Text style={[styles.zeroTraceText, { color: '#0369A1' }]}>Muro Vecinal</Text>
                </View>
              </View>
              <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
                Baches, alumbrado apagado, basura y fallas urbanas con tarjeta para compartir en WhatsApp.
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>

        {/* Accesos Rápidos Secundarios */}
        <View style={styles.secondaryGrid}>
          <Pressable
            onPress={() => router.push('/(tabs)/seguimiento' as any)}
            style={({ pressed }) => [
              styles.secondaryCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={[styles.secIconBox, { backgroundColor: theme.primaryLight }]}>
              <Feather name="search" size={20} color={theme.primary} />
            </View>
            <View>
              <Text style={[styles.secTitle, { color: theme.text }]}>
                Consultar Estado
              </Text>
              <Text style={[styles.secDesc, { color: theme.textSecondary }]}>
                Rastreo por código LT-2026
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/guias' as any)}
            style={({ pressed }) => [
              styles.secondaryCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={[styles.secIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Feather name="play" size={20} color="#D97706" />
            </View>
            <View>
              <Text style={[styles.secTitle, { color: theme.text }]}>
                Guías TikTok
              </Text>
              <Text style={[styles.secDesc, { color: theme.textSecondary }]}>
                Videos y consejos rápidos
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Mis Reportes Guardados Localmente */}
        {myReports.length > 0 && (
          <View style={styles.savedSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>
                Mis Códigos Guardados ({myReports.length})
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)/seguimiento' as any)}
              >
                <Text style={[styles.seeAllText, { color: theme.primary }]}>
                  Ver todos
                </Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.savedScroll}
            >
              {myReports.slice(0, 5).map((rep) => (
                <Pressable
                  key={rep.public_code}
                  onPress={() => {
                    router.push({
                      pathname: '/(tabs)/seguimiento',
                      params: { code: rep.public_code, pin: rep.followup_code },
                    } as any);
                  }}
                  style={({ pressed }) => [
                    styles.savedChip,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.primary,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <View style={styles.savedChipHeader}>
                    <Feather name="file-text" size={14} color={theme.primary} />
                    <Text style={[styles.savedCode, { color: theme.primary }]}>
                      {rep.public_code}
                    </Text>
                  </View>
                  <Text style={[styles.savedCategory, { color: theme.text }]} numberOfLines={1}>
                    {rep.category_name}
                  </Text>
                  <Text style={[styles.savedTime, { color: theme.textSecondary }]}>
                    {new Date(rep.created_at).toLocaleDateString('es-PE')}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Carrusel de Guías Destacadas */}
        <View style={styles.guidesSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>
              Orientación y Prevención Cívica
            </Text>
            <Pressable onPress={() => router.push('/(tabs)/guias' as any)}>
              <Text style={[styles.seeAllText, { color: theme.primary }]}>
                Ver Feed
              </Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.guidesScroll}
          >
            {featuredGuides.map((guide) => (
              <Pressable
                key={guide.id}
                onPress={() => setSelectedGuide(guide)}
                style={({ pressed }) => [
                  styles.guideThumbCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.cardBorder,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View style={styles.guideIconBanner}>
                  <Feather name="play-circle" size={26} color="#047857" />
                  <View style={styles.guideDurBadge}>
                    <Text style={styles.guideDurText}>{guide.duration_seconds}s</Text>
                  </View>
                </View>
                <View style={styles.guideInfo}>
                  <Text style={[styles.guideCategory, { color: theme.primary }]}>
                    {guide.category?.name || guide.category_name || 'Guía Cívica'}
                  </Text>
                  <Text style={[styles.guideTitle, { color: theme.text }]} numberOfLines={2}>
                    {guide.title}
                  </Text>
                  <View style={styles.guideStats}>
                    <Feather name="heart" size={12} color={theme.textSecondary} />
                    <Text style={[styles.guideStatsText, { color: theme.textSecondary }]}>
                      {guide.helpful_count} valoraciones
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Footer info distrital */}
        <View style={[styles.footerCard, { backgroundColor: theme.backgroundElement }]}>
          <Feather name="info" size={16} color={theme.textSecondary} />
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Comisaría Rural PNP La Tinguiña — Distrito de La Tinguiña, Provincia de Ica. Todos los reportes son procesados con reserva de identidad.
          </Text>
        </View>
      </ScrollView>

      <GuideStepsSheet
        guide={selectedGuide}
        visible={!!selectedGuide}
        onClose={() => setSelectedGuide(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
    paddingBottom: Spacing.seven,
  },
  heroBanner: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroTextContent: {
    gap: Spacing.two,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  heroBadgeText: {
    color: '#D1FAE5',
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  primaryGrid: {
    gap: Spacing.three,
  },
  primaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: Spacing.three,
    elevation: 2,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
    }),
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 3,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  zeroTraceBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  zeroTraceText: {
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 10,
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  secondaryGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  secondaryCard: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.two,
  },
  secIconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  secDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  savedSection: {
    gap: Spacing.two,
  },
  savedScroll: {
    gap: Spacing.two,
    paddingVertical: 4,
  },
  savedChip: {
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    width: 170,
    gap: 4,
  },
  savedChipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  savedCode: {
    fontWeight: '800',
    fontSize: 13,
  },
  savedCategory: {
    fontSize: 12,
    fontWeight: '600',
  },
  savedTime: {
    fontSize: 11,
  },
  guidesSection: {
    gap: Spacing.two,
  },
  guidesScroll: {
    gap: Spacing.three,
    paddingVertical: 4,
  },
  guideThumbCard: {
    width: 200,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  guideIconBanner: {
    height: 90,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  guideDurBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  guideDurText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  guideInfo: {
    padding: Spacing.three,
    gap: 3,
  },
  guideCategory: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  guideStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  guideStatsText: {
    fontSize: 11,
  },
  footerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
  },
  footerText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
});
