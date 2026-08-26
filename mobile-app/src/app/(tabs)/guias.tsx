import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppHeader } from '@/components/ui/AppHeader';
import { GuideVideoCard } from '@/components/guides/GuideVideoCard';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { GuideCategory, GuideItem } from '@/types';
import { GuidesService } from '@/services/guidesService';

export default function GuidesScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<GuideCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [guides, setGuides] = useState<GuideItem[]>([]);

  const screenHeight = Dimensions.get('window').height;
  const cardHeight = Math.max(500, screenHeight - 220);

  const loadData = async (catId?: string) => {
    try {
      const [cats, items] = await Promise.all([
        GuidesService.getCategories(),
        GuidesService.listGuides(catId === 'all' ? undefined : catId),
      ]);
      setCategories(cats);
      setGuides(items);
    } catch (e) {
      console.warn('Error loading guides:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    loadData(catId);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(selectedCategory);
    setRefreshing(false);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <AppHeader
        title="Biblioteca Cívica"
        subtitle="Micro-videos y consejos preventivos"
      />

      {/* Top category bar */}
      <View style={[styles.categoryBar, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => {
            const isSelected =
              selectedCategory === item.id ||
              (item.id === 'all' && selectedCategory === 'all') ||
              (item.slug === 'todas' && selectedCategory === 'all');
            return (
              <Pressable
                onPress={() => handleCategorySelect(item.id)}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.backgroundElement,
                    borderColor: isSelected ? theme.primary : theme.cardBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryPillText,
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

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Cargando guías y micro-videos...
          </Text>
        </View>
      ) : (
        <FlatList
          data={guides}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <GuideVideoCard guide={item} height={cardHeight} />
            </View>
          )}
          pagingEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.feedContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Feather name="video-off" size={40} color={theme.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No hay videos en esta temática
              </Text>
              <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
                Selecciona otra categoría o actualiza el feed.
              </Text>
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
  categoryBar: {
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
  },
  categoryList: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  categoryPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  feedContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.seven,
  },
  cardWrapper: {
    marginBottom: Spacing.two,
  },
  emptyBox: {
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
});
