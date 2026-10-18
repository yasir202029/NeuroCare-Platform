export type FeatureFlag = {
  key: string;
  name: string;
  description?: string | null;
  rolloutPct: number;
};

export type FlagCheck = { enabled: boolean; reason?: string };

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

/** Check whether a flag is enabled for the current user/org (respects rollout %). */
export async function isFeatureEnabled(key: string): Promise<FlagCheck> {
  // Try the saas check endpoint first (supports org-based rollout)
  try {
    const res = await fetch(`/api/v1/saas/feature-flags/${encodeURIComponent(key)}/check`, {
      credentials: "include",
    });
    if (res.ok) {
      const data = (await res.json()) as FlagCheck;
      return data;
    }
  } catch {
    // fall through to public flags
  }
  // Fallback: check public flags list
  const flags = await getPublicFlags();
  const flag = flags.find((f) => f.key === key);
  return { enabled: !!flag, reason: flag ? "public" : "not_found" };
}

/** Backward-compatible boolean check. */
export async function isFeatureEnabledBool(key: string): Promise<boolean> {
  const result = await isFeatureEnabled(key);
  return result.enabled;
}

export function clearFlagsCache() {
  flagsCache = null;
  cacheTs = 0;
}
