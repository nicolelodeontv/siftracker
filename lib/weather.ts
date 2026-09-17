// Pure weather fetch + formatting, kept independent from the UI —
// same separation as lib/calculator.ts.
// Uses Open-Meteo (https://open-meteo.com): free, no API key, no signup.

export type WeatherSnapshot = {
  location: string;
  tempC: number;
  feelsLikeC: number;
  code: number;
  isDay: boolean;
  label: string;
  icon: string; // key into WEATHER_ICONS in the component
  fetchedAt: string;
};

const WMO_MAP: Record<number, { label: string; icon: string }> = {
  0: { label: "Clear sky", icon: "sun" },
  1: { label: "Mostly clear", icon: "cloud-sun" },
  2: { label: "Partly cloudy", icon: "cloud-sun" },
  3: { label: "Overcast", icon: "cloud" },
  45: { label: "Fog", icon: "cloud-fog" },
  48: { label: "Freezing fog", icon: "cloud-fog" },
  51: { label: "Light drizzle", icon: "cloud-drizzle" },
  53: { label: "Drizzle", icon: "cloud-drizzle" },
  55: { label: "Dense drizzle", icon: "cloud-drizzle" },
  56: { label: "Freezing drizzle", icon: "cloud-drizzle" },
  57: { label: "Freezing drizzle", icon: "cloud-drizzle" },
  61: { label: "Light rain", icon: "cloud-rain" },
  63: { label: "Rain", icon: "cloud-rain" },
  65: { label: "Heavy rain", icon: "cloud-rain" },
  66: { label: "Freezing rain", icon: "cloud-rain" },
  67: { label: "Freezing rain", icon: "cloud-rain" },
  71: { label: "Light snow", icon: "cloud-snow" },
  73: { label: "Snow", icon: "cloud-snow" },
  75: { label: "Heavy snow", icon: "cloud-snow" },
  77: { label: "Snow grains", icon: "cloud-snow" },
  80: { label: "Rain showers", icon: "cloud-rain" },
  81: { label: "Rain showers", icon: "cloud-rain" },
  82: { label: "Violent showers", icon: "cloud-rain" },
  85: { label: "Snow showers", icon: "cloud-snow" },
  86: { label: "Snow showers", icon: "cloud-snow" },
  95: { label: "Thunderstorm", icon: "cloud-storm" },
  96: { label: "Thunderstorm", icon: "cloud-storm" },
  99: { label: "Thunderstorm", icon: "cloud-storm" },
};

export function describeWeatherCode(code: number) {
  return WMO_MAP[code] ?? { label: "Unknown", icon: "cloud" };
}

export async function fetchCurrentWeather(
  lat: number,
  lon: number,
  locationName: string,
  timezone = "Asia/Manila"
): Promise<WeatherSnapshot> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,weather_code,is_day"
  );
  url.searchParams.set("timezone", timezone);

  const res = await fetch(url.toString(), { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`Open-Meteo request failed: ${res.status}`);

  const data = await res.json();
  const current = data.current;
  const { label, icon } = describeWeatherCode(current.weather_code);

  return {
    location: locationName,
    tempC: current.temperature_2m,
    feelsLikeC: current.apparent_temperature,
    code: current.weather_code,
    isDay: current.is_day === 1,
    label,
    icon,
    fetchedAt: current.time,
  };
}
