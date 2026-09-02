import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  ViewToken,
  AppState,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { AppHeader } from '@/components/ui/AppHeader';
import { GuideVideoCard } from '@/components/guides/GuideVideoCard';
import { BorderRadius, Spacing } from '@/constants/theme';
import { GuideCategory, GuideItem } from '@/types';
import { GuidesService } from '@/services/guidesService';

export default function GuidesScreen() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<GuideCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [guides, setGuides] = useState<GuideItem[]>([]);
  const [feedHeight, setFeedHeight] = useState<number>(600);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isScreenFocused, setIsScreenFocused] = useState<boolean>(true);

  const flatListRef = useRef<FlatList<GuideItem>>(null);

  // Pause playback immediately when user navigates to another tab
  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      return () => {
        setIsScreenFocused(false);
      };
    }, [])
  );

  // Pause playback if the app is sent to background / screen locked
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      setIsScreenFocused(state === 'active');
    });
    return () => sub.remove();
  }, []);

  const loadData = async (catId?: string) => {
    try {
      const [cats, items] = await Promise.all([
        GuidesService.getCategories(),
        GuidesService.listGuides(catId === 'all' ? undefined : catId),
      ]);
      setCategories(cats);
      setGuides(items);

      // Pre-warm thumbnail images into memory/disk cache for zero-lag swipe
      if (items.length > 0) {
        const urls = items
          .slice(0, 6)
          .map((g) => g.thumbnail_url)
          .filter(Boolean) as string[];
        urls.forEach((url) => {
          Image.prefetch(url).catch(() => {});
        });
      }
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
    setLoading(true);
    loadData(catId);
    setActiveIndex(0);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Biblioteca Cívica"
        subtitle="TikTok de Prevención y Trámites"
      />

      {/* Pinned Category Filter Bar */}
      <View style={styles.categoryBar}>
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
                style={({ pressed }) => [
                  styles.categoryPill,
                  {
                    backgroundColor: isSelected ? '#047857' : '#1E293B',
                    borderColor: isSelected ? '#10B981' : '#334155',
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    { color: isSelected ? '#FFFFFF' : '#94A3B8' },
                  ]}
                >
                  {item.name}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Main Snap TikTok Feed */}
      <View
        style={styles.feedContainer}
        onLayout={(e) => {
          const { height } = e.nativeEvent.layout;
          if (height > 0) setFeedHeight(height);
        }}
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>
              Cargando feed preventivo...
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={guides}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => {
              // 3-Window Resource Allocation:
              // - Active index: fully playing
              // - Adjacent indexes (distance === 1): preloading buffer
              // - Far indexes (distance > 1): only poster thumbnail, NO native video decoder in memory
              const distance = Math.abs(index - activeIndex);
              const renderMode =
                distance === 0 ? 'active' : distance === 1 ? 'preload' : 'thumbnail_only';

              return (
                <GuideVideoCard
                  guide={item}
                  height={feedHeight}
                  isActive={isScreenFocused && index === activeIndex}
                  renderMode={renderMode}
                />
              );
            }}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={feedHeight}
            snapToAlignment="start"
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(_, index) => ({
              length: feedHeight,
              offset: feedHeight * index,
              index,
            })}
            windowSize={3}
            maxToRenderPerBatch={2}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={Platform.OS === 'android'}
            ListEmptyComponent={
              <View style={[styles.emptyBox, { height: feedHeight }]}>
                <Feather name="video-off" size={44} color="#64748B" />
                <Text style={styles.emptyTitle}>
                  No hay videos en esta temática
                </Text>
                <Text style={styles.emptyDesc}>
                  Selecciona otra categoría en la barra superior.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#05070B',
    overflow: 'hidden',
  },
  categoryBar: {
    backgroundColor: '#131B2E',
    borderBottomColor: '#1E293B',
    borderBottomWidth: 1,
    paddingVertical: Spacing.two,
    zIndex: 20,
  },
  categoryList: {
    paddingHorizontal: Spacing.three,
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
    fontWeight: '800',
  },
  feedContainer: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyBox: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.five,
    gap: Spacing.two,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyDesc: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 260,
  },
});
