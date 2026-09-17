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
  "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground";
const VALUE_CLASS = "text-sm font-semibold text-foreground";

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
    <div className="order-last mt-1 flex w-full min-w-0 flex-col items-end text-right sm:order-none sm:mt-0 sm:w-auto">
      <span className={`${LABEL_CLASS} truncate`}>
        {weather ? weather.location : "Weather"}
      </span>
      <span className={`${VALUE_CLASS} flex items-center gap-1.5`}>
        <Icon
          className={`h-4 w-4 shrink-0 ${!weather ? "animate-pulse" : ""}`}
        />
        {weather ? (
          <>
            <span className="truncate">
              {Math.round(weather.tempC)}°C · {weather.label}
            </span>
            <span className="hidden shrink-0 text-muted-foreground sm:inline">
              · feels {Math.round(weather.feelsLikeC)}°C
            </span>
          </>
        ) : (
          <span className="hidden sm:inline">Loading…</span>
        )}
      </span>
    </div>
  );
}