import { computeWateringDelta, WeatherSummary } from '../src/lib/weather';

describe('computeWateringDelta', () => {
  const baseSummary: WeatherSummary = {
    latitude: 38.7,
    longitude: -9.1,
    rainLast3Days: 0,
    rainYesterday: 0,
    forecastRainNext3Days: 0,
    avgSunshineHours: 5,
    avgMaxTemp: 20,
    updatedAt: new Date().toISOString(),
  };

  it('should return 0 delta for neutral weather', () => {
    const result = computeWateringDelta(baseSummary);
    expect(result.delta).toBe(0);
    expect(result.skipToday).toBe(false);
  });

  it('should skip today if it rained heavily yesterday', () => {
    const summary = { ...baseSummary, rainYesterday: 10 };
    const result = computeWateringDelta(summary);
    expect(result.skipToday).toBe(true);
  });

  it('should increase interval (positive delta) if it rained recently', () => {
    const summary = { ...baseSummary, rainLast3Days: 15 }; // >= 15mm -> +3
    const result = computeWateringDelta(summary);
    expect(result.delta).toBeGreaterThan(0);
    expect(result.delta).toBe(3);
  });

  it('should decrease interval (negative delta) if it is hot and sunny', () => {
    const summary = {
      ...baseSummary,
      avgSunshineHours: 13, // >= 12 -> +2 tighten (which means delta -= 2)
      avgMaxTemp: 33, // >= 32 -> +2 tighten (which means delta -= 2)
    };
    // tighten total = 4. delta -= 4.
    // But delta is clamped to -3 at the bottom?
    // Code: delta -= Math.min(3, tighten); -> delta -= 3.
    // So expected is -3.
    const result = computeWateringDelta(summary);
    expect(result.delta).toBe(-3);
  });

  it('should handle null summary gracefully', () => {
    const result = computeWateringDelta(null);
    expect(result).toEqual({ delta: 0, skipToday: false });
  });
});
