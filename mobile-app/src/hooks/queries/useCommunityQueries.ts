import { useQuery } from '@tanstack/react-query';
import { CommunityReportsService } from '@/services/communityReportsService';
import { Category, CommunityReportItem } from '@/types';

export const COMMUNITY_QUERY_KEYS = {
  categories: ['community', 'categories'] as const,
  reports: (category?: string) => ['community', 'reports', category || 'all'] as const,
  reportDetail: (code: string) => ['community', 'report', code] as const,
};

export function useCommunityCategories() {
  return useQuery<Category[], Error>({
    queryKey: COMMUNITY_QUERY_KEYS.categories,
    queryFn: () => CommunityReportsService.getCategories(),
  });
}

export function useCommunityReports(category?: string) {
  return useQuery<CommunityReportItem[], Error>({
    queryKey: COMMUNITY_QUERY_KEYS.reports(category),
    queryFn: async () => {
      const items = await CommunityReportsService.listCommunityReports(0, 50);
      if (!category || category === 'all') return items;
      return items.filter(
        (i) => i.category_id === category || i.category?.slug === category || i.category_slug === category
      );
    },
  });
}

export function useCommunityReportDetail(code: string) {
  return useQuery<CommunityReportItem, Error>({
    queryKey: COMMUNITY_QUERY_KEYS.reportDetail(code),
    queryFn: () => CommunityReportsService.getCommunityReport(code),
    enabled: !!code,
  });
}
