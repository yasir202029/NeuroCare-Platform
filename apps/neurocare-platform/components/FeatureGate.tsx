"use client";

import { useEffect, useState, type ReactNode } from "react";
import { isFeatureEnabled, clearFlagsCache } from "@/lib/dynamic-config";

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
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    isFeatureEnabled(feature).then((v: boolean) => {
      if (active) setEnabled(v);
    });
    return () => {
      active = false;
    };
  }, [feature]);

  // While loading, render fallback so the UI doesn't flicker content that may be gated
  if (enabled === null) return <>{fallback}</>;
  if (!enabled) return <>{fallback}</>;
  return <>{children}</>;
}

/** Programmatically check a flag (for use in event handlers, effects, etc.) */
export { isFeatureEnabled, clearFlagsCache };
