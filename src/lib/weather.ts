export type UserLocation = { distrito?: string; municipio?: string };

export type WeatherSummary = {
  latitude: number;
  longitude: number;
  rainLast3Days: number; // mm
  rainYesterday: number; // mm
  forecastRainNext3Days: number; // mm
  avgSunshineHours: number; // hours/day over last 3 days
  avgMaxTemp: number; // °C over last 3 days
  updatedAt: string; // ISO
};

async function geocode(name: string): Promise<{ lat: number; lon: number } | null> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', name);
  url.searchParams.set('count', '1');
  url.searchParams.set('language', 'pt');
  url.searchParams.set('format', 'json');

  const res = await fetch(url.toString(), { next: { revalidate: 6 * 60 * 60 } });
  if (!res.ok) return null;
  const json = (await res.json()) as { results?: { latitude: number; longitude: number }[] };
  const hit = json.results?.[0];
  if (!hit) return null;
  return { lat: hit.latitude, lon: hit.longitude };
}

export async function geocodeLocation(
  loc: UserLocation,
): Promise<{ lat: number; lon: number } | null> {
  const parts = [] as string[];
  if (loc.municipio) parts.push(loc.municipio);
  if (loc.distrito) parts.push(loc.distrito);
  parts.push('Portugal');
  const q1 = parts.filter(Boolean).join(', ');
  const g1 = await geocode(q1);
  if (g1) return g1;
  if (loc.municipio) {
    const g2 = await geocode(`${loc.municipio}, Portugal`);
    if (g2) return g2;
  }
  if (loc.distrito) {
    const g3 = await geocode(`${loc.distrito}, Portugal`);
    if (g3) return g3;
  }
  return null;
}

export async function fetchWeatherSummary(
  lat: number,
  lon: number,
): Promise<WeatherSummary | null> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set(
    'daily',
    [
      'precipitation_sum',
      'precipitation_hours',
      'sunshine_duration',
      'shortwave_radiation_sum',
      'temperature_2m_max',
    ].join(','),
  );
  url.searchParams.set('past_days', '3');
  url.searchParams.set('forecast_days', '3');

  const res = await fetch(url.toString(), { next: { revalidate: 60 * 60 } });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    daily?: {
      time?: string[];
      precipitation_sum?: number[];
      sunshine_duration?: number[]; // seconds
      temperature_2m_max?: number[];
    };
  };

  const d = json.daily;
  if (!d?.time || !d.precipitation_sum || !d.sunshine_duration || !d.temperature_2m_max)
    return null;

  const todayStr = new Date().toISOString().slice(0, 10);
  const idxToday = d.time.indexOf(todayStr);
  const lastIndex = d.time.length - 1;

  // choose indices for the last 3 fully past days where possible
  const endPast = idxToday > -1 ? idxToday - 1 : Math.min(lastIndex - 3, lastIndex);
  const indicesPast = [endPast, endPast - 1, endPast - 2].filter((i) => i >= 0);

  const sum = (arr: number[], idxs: number[]) =>
    idxs.reduce((acc, i) => acc + (Number(arr[i]) || 0), 0);
  const avg = (arr: number[], idxs: number[]) => (idxs.length ? sum(arr, idxs) / idxs.length : 0);

  const rainLast3Days = Number(sum(d.precipitation_sum, indicesPast).toFixed(1));
  const rainYesterday = Number(
    (indicesPast.length && indicesPast[0] >= 0
      ? d.precipitation_sum[indicesPast[0]] || 0
      : 0
    ).toFixed(1),
  );
  const avgSunshineHours = Number((avg(d.sunshine_duration, indicesPast) / 3600).toFixed(1));
  const avgMaxTemp = Number(avg(d.temperature_2m_max, indicesPast).toFixed(1));

  // forecast next 3 days from today index
  const startForecast = idxToday > -1 ? idxToday + 1 : lastIndex - 2;
  const forecastIdxs = [startForecast, startForecast + 1, startForecast + 2].filter(
    (i) => i >= 0 && i <= lastIndex,
  );
  const forecastRainNext3Days = Number(sum(d.precipitation_sum, forecastIdxs).toFixed(1));

  return {
    latitude: lat,
    longitude: lon,
    rainLast3Days,
    rainYesterday,
    forecastRainNext3Days,
    avgSunshineHours,
    avgMaxTemp,
    updatedAt: new Date().toISOString(),
  };
}

export async function getWeatherByLocation(loc: UserLocation): Promise<WeatherSummary | null> {
  const geo = await geocodeLocation(loc);
  if (!geo) return null;
  return fetchWeatherSummary(geo.lat, geo.lon);
}

export function computeWateringDelta(summary: WeatherSummary | null): {
  delta: number;
  skipToday: boolean;
} {
  if (!summary) return { delta: 0, skipToday: false };
  let delta = 0;

  // rain-based relaxation
  if (summary.rainLast3Days >= 15) delta += 3;
  else if (summary.rainLast3Days >= 10) delta += 2;
  else if (summary.rainLast3Days >= 5) delta += 1;

  if (summary.forecastRainNext3Days >= 10) delta += 1;

  // heat/sun-based tightening
  let tighten = 0;
  if (summary.avgSunshineHours >= 12) tighten += 2;
  else if (summary.avgSunshineHours >= 10) tighten += 1;
  if (summary.avgMaxTemp >= 32) tighten += 2;
  else if (summary.avgMaxTemp >= 28) tighten += 1;
  delta -= Math.min(3, tighten);

  if (delta > 4) delta = 4;
  if (delta < -3) delta = -3;

  const skipToday = summary.rainYesterday >= 5; // >=5mm ontem -> geralmente chega para dispensar rega
  return { delta, skipToday };
}
