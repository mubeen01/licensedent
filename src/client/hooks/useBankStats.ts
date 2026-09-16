import { getPublicBankStats, useQuery } from 'wasp/client/operations';
import type { PublicBankStats } from '../../landing-page/operations';

/**
 * Bank-wide counters straight from the database, for any marketing surface
 * (landing, hero, CTA, auth pitch, dashboard). Replaces the old hardcoded
 * "9,000+ questions" copy that had drifted far from the real bank — a brand
 * risk for a product selling "human-verified" content.
 *
 * `loading` stays true until the first successful fetch; callers should fall
 * back to copy that makes no numeric claim while loading.
 */
export function useBankStats(): { stats: PublicBankStats | null; loading: boolean } {
  const { data, isLoading } = useQuery(getPublicBankStats);
  return { stats: data ?? null, loading: isLoading };
}
