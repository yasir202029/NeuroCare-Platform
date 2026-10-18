"use client";

import { useEffect, useState, type ReactNode } from "react";
import { isFeatureEnabled, isFeatureEnabledBool, clearFlagsCache } from "@/lib/dynamic-config";

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Conditionally renders children only when a feature flag is enabled.
 * Falls back to `fallback` (or null) when disabled.
 *
 * Example: <FeatureGate feature="ai_insights"><AiInsightsPage /></FeatureGate>
 */
export default function FeatureGate({
  feature,
  children,
  fallback = null,
}: FeatureGateProps) {
  const [result, setResult] = useState<{ enabled: boolean; reason?: string } | null>(null);

  useEffect(() => {
    let active = true;
    isFeatureEnabled(feature).then((v) => {
      if (active) setResult(v);
    });
    return () => {
      active = false;
    };
  }, [feature]);

  // While loading, render fallback so the UI doesn't flicker content that may be gated
  if (!result) return <>{fallback}</>;
  if (!result.enabled) return <>{fallback}</>;
  return <>{children}</>;
}

/** Programmatically check a flag (for use in event handlers, effects, etc.) */
export { isFeatureEnabled, isFeatureEnabledBool, clearFlagsCache };
