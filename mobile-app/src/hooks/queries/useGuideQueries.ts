import { useQuery } from '@tanstack/react-query';
import { GuidesService } from '@/services/guidesService';
import { GuideCategory, GuideItem } from '@/types';

export const GUIDE_QUERY_KEYS = {
  categories: ['guides', 'categories'] as const,
  feed: (category?: string) => ['guides', 'feed', category || 'all'] as const,
};

export function useGuideCategories() {
  return useQuery<GuideCategory[], Error>({
    queryKey: GUIDE_QUERY_KEYS.categories,
    queryFn: () => GuidesService.getCategories(),
  });
}

export function useGuidesFeed(category?: string) {
  return useQuery<GuideItem[], Error>({
    queryKey: GUIDE_QUERY_KEYS.feed(category),
    queryFn: () => GuidesService.listGuides(category === 'all' ? undefined : category),
  });
}
