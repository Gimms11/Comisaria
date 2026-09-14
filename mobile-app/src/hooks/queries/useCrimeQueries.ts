import { useQuery } from '@tanstack/react-query';
import { CrimeReportsService } from '@/services/crimeReportsService';
import { Category } from '@/types';

export const CRIME_QUERY_KEYS = {
  categories: ['crime', 'categories'] as const,
  reportDetail: (code: string, pin?: string) => ['crime', 'report', code, pin] as const,
};

export function useCrimeCategories() {
  return useQuery<Category[], Error>({
    queryKey: CRIME_QUERY_KEYS.categories,
    queryFn: () => CrimeReportsService.getCategories(),
  });
}
