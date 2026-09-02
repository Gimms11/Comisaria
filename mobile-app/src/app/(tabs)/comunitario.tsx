import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { AppHeader } from '@/components/ui/AppHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SocialCard } from '@/components/ui/SocialCard';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Category, CommunityReportItem } from '@/types';
import { CommunityReportsService } from '@/services/communityReportsService';

export default function CommunityFeedScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [reports, setReports] = useState<CommunityReportItem[]>([]);
  const [sharingReport, setSharingReport] = useState<CommunityReportItem | null>(null);

  const loadData = async () => {
    try {
      const [cats, items] = await Promise.all([
        CommunityReportsService.getCategories(),
        CommunityReportsService.listCommunityReports(),
      ]);
      setCategories(cats);
      setReports(items);
    } catch (e) {
      console.warn('Error loading community reports:', e);
    } finally {
      setLoading(false);
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

  const filteredReports = reports.filter((r) => {
    if (selectedCategory === 'all' || !selectedCategory) return true;

    const targetCategory = categories.find(
      (c) =>
        c.id === selectedCategory ||
        c.slug === selectedCategory ||
        c.name.toLowerCase() === selectedCategory.toLowerCase()
    );

    const reportCatId = r.category?.id || r.category_id;
    const reportCatSlug = r.category?.slug || r.category_slug;
    const reportCatName = (r.category?.name || r.category_name || '').trim().toLowerCase();

    // 1. Direct ID or slug match
    if (reportCatId && (reportCatId === selectedCategory || (targetCategory && reportCatId === targetCategory.id))) {
      return true;
    }
    if (reportCatSlug && (reportCatSlug === selectedCategory || (targetCategory && reportCatSlug === targetCategory.slug))) {
      return true;
    }

    // 2. Exact or substring name match
    if (targetCategory && targetCategory.name) {
      const targetName = targetCategory.name.trim().toLowerCase();
      if (reportCatName === targetName) {
        return true;
      }
      const targetWords = targetName.split(' ').filter((w) => w.length > 3);
      if (targetWords.some((w) => reportCatName.includes(w))) {
        return true;
      }
    }

    if (reportCatName && reportCatName === selectedCategory.toLowerCase().trim()) {
      return true;
    }

    return false;
  });

  const renderHeader = () => (
    <View style={styles.headerArea}>
      {/* Action Banner */}
      <View
        style={[
          styles.createBanner,
          {
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
          },
        ]}
      >
        <View style={styles.bannerInfo}>
          <View style={[styles.bannerBadge, { backgroundColor: '#E0F2FE' }]}>
            <Feather name="map-pin" size={14} color="#0284C7" />
            <Text style={styles.bannerBadgeText}>PARTICIPACIÓN CIUDADANA</Text>
          </View>
          <Text style={[styles.bannerTitle, { color: theme.text }]}>
            Muro Cívico Vecinal
          </Text>
          <Text style={[styles.bannerDesc, { color: theme.textSecondary }]}>
            Reporta problemas de alumbrado, baches, desmonte o áreas inseguras para coordinar atención comunitaria.
          </Text>
        </View>

        <Pressable
          onPress={() => router.push('/comunitario/nuevo' as any)}
          style={({ pressed }) => [
            styles.newReportButton,
            { backgroundColor: '#0284C7', opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Feather name="plus-circle" size={18} color="#FFFFFF" />
          <Text style={styles.newReportButtonText}>Nuevo Reporte</Text>
        </Pressable>
      </View>

      {/* Filter Categories Horizontal */}
      <View style={styles.categoryFilterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 'all', name: 'Todos', slug: 'all' } as Category, ...categories]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoryFilterList}
          renderItem={({ item }) => {
            const isSelected =
              selectedCategory === item.id ||
              (item.id === 'all' && selectedCategory === 'all') ||
              (item.slug === 'all' && selectedCategory === 'all');
            return (
              <Pressable
                onPress={() => setSelectedCategory(item.id)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.card,
                    borderColor: isSelected ? theme.primary : theme.cardBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isSelected ? '#FFFFFF' : theme.text },
                  ]}
                >
                  {item.name}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      <Text style={[styles.feedSectionTitle, { color: theme.text }]}>
        Incidencias Registradas ({filteredReports.length})
      </Text>
    </View>
  );

  const renderReportCard = ({ item }: { item: CommunityReportItem }) => {
    const formattedDate = new Date(item.created_at).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const hasMedia = item.media_urls && item.media_urls.length > 0;

    return (
      <View
        style={[
          styles.reportCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
          },
        ]}
      >
        {/* Top meta */}
        <View style={styles.reportTop}>
          <View style={styles.categoryTag}>
            <Feather name="alert-circle" size={13} color={theme.accent} />
            <Text style={[styles.categoryTagName, { color: theme.accent }]}>
              {item.category?.name || item.category_name || 'Reporte Vecinal'}
            </Text>
          </View>
          <StatusBadge status={item.status} size="small" />
        </View>

        {/* Code & date */}
        <View style={styles.codeDateRow}>
          <Text style={[styles.publicCode, { color: theme.textSecondary }]}>
            {item.public_code}
          </Text>
          <Text style={[styles.dateText, { color: theme.textSecondary }]}>
            {formattedDate}
          </Text>
        </View>

        {/* Description */}
        <Text style={[styles.description, { color: theme.text }]}>
          {item.description}
        </Text>

        {/* Location reference */}
        {item.address_reference ? (
          <View style={[styles.locationBox, { backgroundColor: theme.backgroundElement }]}>
            <Feather name="map-pin" size={13} color={theme.textSecondary} />
            <Text style={[styles.locationText, { color: theme.textSecondary }]} numberOfLines={2}>
              {item.address_reference}
            </Text>
          </View>
        ) : null}

        {/* Photo evidence preview */}
        {hasMedia && (
          <Image
            source={{ uri: item.media_urls[0] }}
            style={styles.cardImage}
            contentFit="cover"
            transition={200}
          />
        )}

        {/* Actions bar */}
        <View style={[styles.reportActions, { borderTopColor: theme.cardBorder }]}>
          <Pressable
            onPress={() => router.push(`/comunitario/${item.public_code}` as any)}
            style={({ pressed }) => [
              styles.actionItem,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="eye" size={15} color={theme.textSecondary} />
            <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>
              Ver Detalle
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push(`/comunitario/${item.public_code}` as any)}
            style={({ pressed }) => [
              styles.shareItemBtn,
              { backgroundColor: '#25D366', opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Feather name="share-2" size={13} color="#FFFFFF" />
            <Text style={styles.shareItemBtnText}>Tarjeta WhatsApp</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <AppHeader
        title="Muro Cívico Vecinal"
        subtitle="Problemas de infraestructura distrital"
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Cargando incidencias vecinales...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredReports}
          keyExtractor={(item) => item.public_code}
          renderItem={renderReportCard}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={40} color={theme.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No hay incidencias en esta categoría
              </Text>
              <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
                Sé el primero en registrar un problema de tu barrio.
              </Text>
              {selectedCategory !== 'all' && (
                <Pressable
                  onPress={() => setSelectedCategory('all')}
                  style={({ pressed }) => [
                    styles.resetFilterBtn,
                    { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Feather name="refresh-cw" size={14} color="#FFFFFF" />
                  <Text style={styles.resetFilterBtnText}>Ver todas las incidencias</Text>
                </Pressable>
              )}
            </View>
          }
        />
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
    gap: Spacing.two,
  },
  loadingText: {
    fontSize: 14,
  },
  listContent: {
    padding: Spacing.four,
    gap: Spacing.three,
    paddingBottom: Spacing.seven,
  },
  headerArea: {
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  createBanner: {
    padding: Spacing.four,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: Spacing.three,
  },
  bannerInfo: {
    gap: 4,
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  bannerBadgeText: {
    color: '#0284C7',
    fontWeight: '800',
    fontSize: 10,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  bannerDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  newReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two + 4,
    borderRadius: BorderRadius.md,
  },
  newReportButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  categoryFilterContainer: {
    marginHorizontal: -Spacing.four,
  },
  categoryFilterList: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  filterChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  feedSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: Spacing.one,
  },
  reportCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  reportTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryTagName: {
    fontSize: 12,
    fontWeight: '700',
  },
  codeDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  publicCode: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dateText: {
    fontSize: 11,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: Spacing.two,
    borderRadius: BorderRadius.md,
  },
  locationText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  cardImage: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.one,
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: Spacing.two,
    marginTop: Spacing.one,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  shareItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.three,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  shareItemBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.seven,
    gap: Spacing.two,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyDesc: {
    fontSize: 13,
  },
  resetFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two + 2,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.two,
  },
  resetFilterBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
