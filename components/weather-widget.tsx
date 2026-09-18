"use client";

import { useEffect, useRef, useState } from "react";
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
import {
  formatPhilippineDate,
  formatPhilippineTime,
  getCurrentClockIn,
  type TimeFormat,
} from "@/lib/use-philippine-clock";

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

type Props = {
  timeFormat: TimeFormat;
};

export function WeatherWidget({ timeFormat }: Props) {
  const dateRef = useRef<HTMLSpanElement>(null);
  const timeRef = useRef<HTMLTimeElement>(null);
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      if (dateRef.current) dateRef.current.textContent = formatPhilippineDate(now);
      if (timeRef.current) timeRef.current.textContent = formatPhilippineTime(getCurrentClockIn(), timeFormat);
    };

    tick();
    const clockInterval = window.setInterval(tick, 1000);
    return () => window.clearInterval(clockInterval);
  }, [timeFormat]);

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

  const Icon = weather ? WEATHER_ICONS[weather.icon] ?? Cloud : Cloud;
  const primaryText = weather ? `${Math.round(weather.tempC)}°C` : "—";
  const conditionText = weather ? weather.label : error ? "Weather unavailable" : "Loading weather";
  const feelsText = weather ? `feels ${Math.round(weather.feelsLikeC)}°C` : error ? "—" : "Loading…";
  const locationText = weather ? weather.location : error ? "Location unavailable" : "Resolving location…";

  return (
    <>
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-card/80 text-foreground shadow-sm backdrop-blur sm:hidden"
        aria-label={weather ? `Weather: ${primaryText}` : error ? "Weather unavailable" : "Weather loading"}
        title={weather ? `${primaryText} · ${weather.location}` : error ? "Weather unavailable" : "Weather loading"}
      >
        <Icon className={`size-3.5 shrink-0 ${!weather ? "animate-pulse" : ""}`} />
      </div>

      <div
        className="hidden min-w-0 flex-col items-end leading-tight sm:flex"
        aria-label={
          weather
            ? `Philippine Standard Time · ${locationText} · ${primaryText} · ${conditionText} · ${feelsText}`
            : error
              ? "Philippine Standard Time · Location unavailable · Weather unavailable"
              : "Philippine Standard Time · Resolving location · Loading weather"
        }
        title={weather ? locationText : error ? "Weather unavailable" : "Weather loading"}
      >
        <div className="flex max-w-[48rem] items-center justify-end gap-2 whitespace-nowrap text-[7px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:text-[8px] sm:tracking-[0.12em]">
          <span>Philippine Standard Time</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{locationText}</span>
        </div>
        <div className="mt-0.5 flex max-w-[48rem] items-center justify-end gap-1 whitespace-nowrap font-mono text-[8px] font-bold tabular-nums sm:text-[10px]">
          <span ref={dateRef} suppressHydrationWarning>--</span>
          <span aria-hidden="true">·</span>
          <time ref={timeRef} suppressHydrationWarning>--:--:--</time>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Icon className={`h-3 w-3 shrink-0 ${!weather ? "animate-pulse" : ""}`} />
            <span>{primaryText}</span>
          </span>
          <span aria-hidden="true">·</span>
          <span>{conditionText}</span>
          <span aria-hidden="true">·</span>
          <span>{feelsText}</span>
        </div>
      </div>
    </>
  );
}
