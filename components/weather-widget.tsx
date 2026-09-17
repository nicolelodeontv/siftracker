"use client";

import { useEffect, useState } from "react";
import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  type LucideIcon,
} from "lucide-react";

type WeatherResponse = {
  location: string;
  tempC: number;
  feelsLikeC: number;
  label: string;
  icon: string;
  isDay: boolean;
};

type CachedWeather = {
  weather: WeatherResponse;
  cachedAt: number;
};

const WEATHER_ICONS: Record<string, LucideIcon> = {
  sun: Sun,
  "cloud-sun": CloudSun,
  cloud: Cloud,
  "cloud-fog": CloudFog,
  "cloud-drizzle": CloudDrizzle,
  "cloud-rain": CloudRain,
  "cloud-snow": CloudSnow,
  "cloud-storm": CloudLightning,
};

const CACHE_KEY = "sif-weather-v2";
const CACHE_TTL = 15 * 60 * 1000;
const LOCATION_TIMEOUT = 5000;

const LABEL_CLASS =
  "block whitespace-nowrap text-[7px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:text-[8px] sm:tracking-[0.16em]";
const VALUE_TEXT_CLASS =
  "font-mono text-[8px] font-bold tabular-nums sm:text-[10px]";

function readCachedWeather() {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedWeather;
    if (!cached?.weather || Date.now() - cached.cachedAt >= CACHE_TTL) return null;
    return cached.weather;
  } catch {
    return null;
  }
}

function writeCachedWeather(weather: WeatherResponse) {
  try {
    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ weather, cachedAt: Date.now() } satisfies CachedWeather)
    );
  } catch {
    // Storage can be unavailable in private/restricted browsing modes.
  }
}

async function getBrowserCoordinates() {
  if (!navigator.geolocation) throw new Error("Geolocation unsupported");

  try {
    if (navigator.permissions?.query) {
      const permission = await navigator.permissions.query({ name: "geolocation" });
      if (permission.state === "denied") throw new Error("Geolocation denied");
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Geolocation denied") throw error;
  }

  return new Promise<{ lat: number; lon: number }>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      }),
      () => reject(new Error("Geolocation unavailable")),
      {
        enableHighAccuracy: false,
        timeout: LOCATION_TIMEOUT,
        maximumAge: CACHE_TTL,
      }
    );
  });
}

async function fetchWeather(path: string) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), LOCATION_TIMEOUT);

  try {
    const res = await fetch(path, { cache: "no-store", signal: controller.signal });
    if (!res.ok) throw new Error("Weather request failed");
    return (await res.json()) as WeatherResponse;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const cached = readCachedWeather();
      if (cached) {
        setWeather(cached);
        setError(false);
        return;
      }

      try {
        let data: WeatherResponse;

        try {
          const coords = await getBrowserCoordinates();
          const params = new URLSearchParams({
            lat: String(Math.round(coords.lat * 1000) / 1000),
            lon: String(Math.round(coords.lon * 1000) / 1000),
            location: "Current location",
          });
          data = await fetchWeather(`/api/weather?${params.toString()}`);
        } catch {
          data = await fetchWeather("/api/weather");
        }

        if (cancelled) return;
        setWeather(data);
        setError(false);
        writeCachedWeather(data);
      } catch {
        if (!cancelled) setError(true);
      }
    }

    load();
    const interval = window.setInterval(load, CACHE_TTL);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  if (error && !weather) return null;

  const Icon = weather ? WEATHER_ICONS[weather.icon] ?? Cloud : Cloud;

  return (
    <>
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-card/80 text-foreground shadow-sm backdrop-blur sm:hidden"
        aria-label={
          weather
            ? `Weather: ${Math.round(weather.tempC)}°C, ${weather.label}`
            : "Weather loading"
        }
        title={weather ? `${Math.round(weather.tempC)}°C · ${weather.label}` : "Weather loading"}
      >
        <Icon
          className={`size-3.5 shrink-0 ${!weather ? "animate-pulse" : ""}`}
        />
      </div>

      <div
        className="hidden min-w-0 text-right leading-tight sm:block"
        aria-label={
          weather
            ? `Weather in ${weather.location}: ${Math.round(weather.tempC)}°C, ${weather.label}`
            : "Weather loading"
        }
      >
        <span className={`${LABEL_CLASS} truncate`}>
          {weather ? weather.location : "Weather"}
        </span>
        <span
          className={`${VALUE_TEXT_CLASS} flex items-center justify-end gap-1 whitespace-nowrap`}
        >
          <Icon
            className={`h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3 ${!weather ? "animate-pulse" : ""}`}
          />
          {weather ? (
            <>
              <span className="truncate">
                {Math.round(weather.tempC)}°C · {weather.label}
              </span>
              <span
                className={`${VALUE_TEXT_CLASS} shrink-0 text-muted-foreground`}
              >
                · feels {Math.round(weather.feelsLikeC)}°C
              </span>
            </>
          ) : (
            <span>Loading…</span>
          )}
        </span>
      </div>
    </>
  );
}
