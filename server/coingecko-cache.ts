/** Re-export shared cache helpers (prefer importing from `lib/coingecko-cache.ts`). */
export {
  type CacheEntry,
  getCached,
  clearCache,
  fetchCoinGecko,
  cacheStats,
} from '../lib/coingecko-cache.ts'
