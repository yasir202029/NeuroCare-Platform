import { describe, expect, it, vi, beforeEach } from "vitest";
import { evaluateMonitoringReadings } from "../src/services/monitoring.service.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("evaluateMonitoringReadings", () => {
  it("returns no alerts for in-range values", () => {
    expect(
      evaluateMonitoringReadings({
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        pulse: 72,
        weightKg: 72,
        sleepHours: 7,
      }),
    ).toEqual([]);
  });

  it("returns WARNING for implausible values", () => {
    const alerts = evaluateMonitoringReadings({ bloodPressureSystolic: 400 });
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({ metric: "bloodPressureSystolic", severity: "WARNING" });
  });

  it("returns CRITICAL for out-of-safe-range values within plausible range", () => {
    const alerts = evaluateMonitoringReadings({ pulse: 155 });
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({ metric: "pulse", severity: "CRITICAL" });
  });

  it("skips missing readings — missing stays missing", () => {
    expect(evaluateMonitoringReadings({})).toEqual([]);
    expect(evaluateMonitoringReadings({ notes: "no measurements" } as never)).toEqual([]);
  });
});
