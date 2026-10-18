export type FeatureFlag = {
  key: string;
  name: string;
  description?: string | null;
  rolloutPct: number;
};

let flagsCache: FeatureFlag[] | null = null;
let cacheTs = 0;
const CACHE_TTL_MS = 30_000; // re-fetch every 30s so toggles take effect without reload

export async function getPublicFlags(): Promise<FeatureFlag[]> {
  const now = Date.now();
  if (flagsCache && now - cacheTs < CACHE_TTL_MS) return flagsCache;
  const res = await fetch("/api/v1/config", { credentials: "include" });
  if (!res.ok) return [];
  const data = (await res.json()) as { flags: FeatureFlag[] };
  flagsCache = data.flags ?? [];
  cacheTs = now;
  return flagsCache;
}

export async function isFeatureEnabled(key: string): Promise<boolean> {
  const flags = await getPublicFlags();
  return flags.some((f) => f.key === key);
}

export function clearFlagsCache() {
  flagsCache = null;
  cacheTs = 0;
}
