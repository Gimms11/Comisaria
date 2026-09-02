import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Platform,
  Linking,
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

  const handleCallEmergency = (number: string) => {
    const clean = number.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${clean}`).catch(() => {});
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
        {/* 1. Quick Emergency Dial Bar (For when in immediate danger) */}
        <View style={[styles.sosQuickBar, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
          <View style={styles.sosLeft}>
            <View style={styles.sosPulseDot} />
            <Text style={styles.sosBarTitle}>LÍNEA DE EMERGENCIA 24/7</Text>
          </View>
          <View style={styles.sosButtonsRow}>
            <Pressable
              onPress={() => handleCallEmergency('105')}
              style={({ pressed }) => [
                styles.sosCallBtn,
                { backgroundColor: '#DC2626', opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Feather name="phone-call" size={13} color="#FFFFFF" />
              <Text style={styles.sosCallBtnText}>105 PNP</Text>
            </Pressable>

            <Pressable
              onPress={() => handleCallEmergency('056256114')}
              style={({ pressed }) => [
                styles.sosCallBtnSec,
                { backgroundColor: '#FFFFFF', borderColor: '#DC2626', opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Feather name="phone" size={12} color="#DC2626" />
              <Text style={styles.sosCallBtnSecText}>Comisaría</Text>
            </Pressable>
          </View>
        </View>

        {/* 2. HERO CARD: PRINCIPAL USE CASE — DENUNCIA ANÓNIMA EXPRÉS */}
        <Pressable
          onPress={() => router.push('/denuncia/nueva' as any)}
          style={({ pressed }) => [
            styles.heroCard,
            {
              backgroundColor: '#991B1B',
              borderColor: '#B91C1C',
              opacity: pressed ? 0.95 : 1,
            },
          ]}
        >
          {/* Top meta badge */}
          <View style={styles.heroTopRow}>
            <View style={styles.heroSafetyBadge}>
              <Feather name="shield" size={13} color="#FEF2F2" />
              <Text style={styles.heroSafetyText}>100% ANÓNIMO • ZERO RASTREO</Text>
            </View>
            <View style={styles.heroTimeBadge}>
              <Feather name="clock" size={11} color="#FEF2F2" />
              <Text style={styles.heroTimeText}>15 SEGUNDOS</Text>
            </View>
          </View>

          {/* Main Title & Subtitle */}
          <View style={styles.heroBody}>
            <Text style={styles.heroMainTitle}>
              ¿Testigo o Víctima de un Delito?
            </Text>
            <Text style={styles.heroMainSub}>
              Robos, extorsión, violencia o sujetos armados. Registra tu denuncia con 1 toque sin escribir tu nombre ni DNI.
            </Text>
          </View>

          {/* Fast features bar */}
          <View style={styles.heroFeaturesRow}>
            <View style={styles.heroFeatureItem}>
              <Feather name="zap" size={13} color="#FDE047" />
              <Text style={styles.heroFeatureText}>1-Toque Descriptores</Text>
            </View>
            <View style={styles.heroFeatureItem}>
              <Feather name="navigation" size={13} color="#FDE047" />
              <Text style={styles.heroFeatureText}>GPS Automático</Text>
            </View>
            <View style={styles.heroFeatureItem}>
              <Feather name="camera" size={13} color="#FDE047" />
              <Text style={styles.heroFeatureText}>Foto Segura</Text>
            </View>
          </View>

          {/* CTA Button */}
          <View style={styles.heroCtaBtn}>
            <Text style={styles.heroCtaText}>DENUNCIAR AHORA</Text>
            <Feather name="arrow-right" size={18} color="#991B1B" />
          </View>
        </Pressable>

        {/* 3. SECONDARY BENTO GRID */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Servicios Ciudadanos
        </Text>

        <View style={styles.bentoGrid}>
          {/* Bento 1: Reporte Comunitario */}
          <Pressable
            onPress={() => router.push('/comunitario/nuevo' as any)}
            style={({ pressed }) => [
              styles.bentoCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <View style={[styles.bentoIconBox, { backgroundColor: '#E0F2FE' }]}>
              <Feather name="map-pin" size={22} color="#0284C7" />
            </View>
            <View style={styles.bentoInfo}>
              <View style={styles.bentoTitleRow}>
                <Text style={[styles.bentoTitle, { color: theme.text }]}>
                  Reporte Vecinal
                </Text>
                <View style={[styles.bentoBadge, { backgroundColor: '#E0F2FE' }]}>
                  <Text style={[styles.bentoBadgeText, { color: '#0369A1' }]}>Muro Cívico</Text>
                </View>
              </View>
              <Text style={[styles.bentoDesc, { color: theme.textSecondary }]}>
                Alumbrado apagado, baches o basura con tarjeta para WhatsApp.
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={theme.textSecondary} />
          </Pressable>

          {/* Bento 2: Consultar Estado */}
          <View style={styles.bentoHalfRow}>
            <Pressable
              onPress={() => router.push('/(tabs)/seguimiento' as any)}
              style={({ pressed }) => [
                styles.bentoHalfCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <View style={[styles.bentoSmallIcon, { backgroundColor: theme.primaryLight }]}>
                <Feather name="search" size={18} color={theme.primary} />
              </View>
              <Text style={[styles.bentoHalfTitle, { color: theme.text }]}>
                Consultar Estado
              </Text>
              <Text style={[styles.bentoHalfSub, { color: theme.textSecondary }]}>
                Rastreo código LT-2026
              </Text>
            </Pressable>

            {/* Bento 3: Guías Preventivas */}
            <Pressable
              onPress={() => router.push('/(tabs)/guias' as any)}
              style={({ pressed }) => [
                styles.bentoHalfCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <View style={[styles.bentoSmallIcon, { backgroundColor: '#FEF3C7' }]}>
                <Feather name="play-circle" size={18} color="#D97706" />
              </View>
              <Text style={[styles.bentoHalfTitle, { color: theme.text }]}>
                Guías de Ayuda
              </Text>
              <Text style={[styles.bentoHalfSub, { color: theme.textSecondary }]}>
                Videos y trámites DNI
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 4. MIS DENUNCIAS / REPORTES GUARDADOS */}
        {myReports.length > 0 && (
          <View style={styles.savedSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>
                Mis Códigos en este equipo ({myReports.length})
              </Text>
              <Pressable onPress={() => router.push('/(tabs)/seguimiento' as any)}>
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

        {/* 5. CARRUSEL DE GUÍAS DESTACADAS */}
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
          <Feather name="shield" size={16} color={theme.textSecondary} />
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Comisaría Rural PNP La Tinguiña — Ica. Todos los reportes son procesados con absoluta reserva y protección de identidad.
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
  sosQuickBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
  },
  sosLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sosPulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DC2626',
  },
  sosBarTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#991B1B',
    letterSpacing: 0.5,
  },
  sosButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  sosCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  sosCallBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
  },
  sosCallBtnSec: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  sosCallBtnSecText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 11,
  },
  heroCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.four,
    borderWidth: 1.5,
    gap: Spacing.three,
    elevation: 6,
    ...Platform.select({
      web: { boxShadow: '0 6px 20px rgba(153, 27, 27, 0.35)' },
      default: {
        shadowColor: '#991B1B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
    }),
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroSafetyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  heroSafetyText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  heroTimeText: {
    color: '#FDE047',
    fontSize: 10,
    fontWeight: '900',
  },
  heroBody: {
    gap: 4,
  },
  heroMainTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  heroMainSub: {
    color: '#FEE2E2',
    fontSize: 13,
    lineHeight: 18,
  },
  heroFeaturesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.25)',
    padding: Spacing.two + 2,
    borderRadius: BorderRadius.lg,
  },
  heroFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroFeatureText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  heroCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: '#FFFFFF',
    paddingVertical: Spacing.three,
    borderRadius: BorderRadius.lg,
  },
  heroCtaText: {
    color: '#991B1B',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.5,
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
  bentoGrid: {
    gap: Spacing.two,
  },
  bentoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three + 2,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    gap: Spacing.three,
  },
  bentoIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoInfo: {
    flex: 1,
    gap: 2,
  },
  bentoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  bentoTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  bentoBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  bentoBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  bentoDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  bentoHalfRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  bentoHalfCard: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    gap: Spacing.one + 2,
  },
  bentoSmallIcon: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoHalfTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  bentoHalfSub: {
    fontSize: 11,
    lineHeight: 15,
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
