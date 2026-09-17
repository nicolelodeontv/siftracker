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

const LABEL_CLASS =
  "block whitespace-nowrap text-[7px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:text-[8px] sm:tracking-[0.16em]";
const VALUE_TEXT_CLASS =
  "font-mono text-[8px] font-bold tabular-nums sm:text-[10px]";

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/weather");
        if (!res.ok) throw new Error("bad response");
        const data: WeatherResponse = await res.json();
        if (!cancelled) {
          setWeather(data);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }

    load();
    const interval = setInterval(load, 15 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (error && !weather) return null;

  const Icon = weather ? WEATHER_ICONS[weather.icon] ?? Cloud : Cloud;

  return (
    <>
      {/* Below sm: compact 40px icon-only circle, matching the other header controls */}
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

      {/* sm and up: exact PhtClockDisplay typography */}
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
