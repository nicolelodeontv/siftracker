import { NextRequest, NextResponse } from "next/server";
import { fetchCurrentWeather } from "@/lib/weather";

export const dynamic = "force-dynamic";

function parseCoordinate(value: string | null, min: number, max: number) {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

function decodeHeader(value: string | null) {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getVercelIpLocation(request: NextRequest) {
  const lat = parseCoordinate(request.headers.get("x-vercel-ip-latitude"), -90, 90);
  const lon = parseCoordinate(request.headers.get("x-vercel-ip-longitude"), -180, 180);
  if (lat === null || lon === null) return null;

  const city = decodeHeader(request.headers.get("x-vercel-ip-city"));
  const country = request.headers.get("x-vercel-ip-country")?.toUpperCase() ?? "";
  const location = city ? `${city}${country ? `, ${country}` : ""}` : "Approximate location";

  return {
    lat,
    lon,
    location,
    timezone: request.headers.get("x-vercel-ip-timezone") || "auto",
  };
}

export async function GET(request: NextRequest) {
  try {
    const lat = parseCoordinate(request.nextUrl.searchParams.get("lat"), -90, 90);
    const lon = parseCoordinate(request.nextUrl.searchParams.get("lon"), -180, 180);
    const requestedLocation = request.nextUrl.searchParams.get("location")?.trim().slice(0, 120);

    const preciseLocation = lat !== null && lon !== null
      ? {
          lat,
          lon,
          location: requestedLocation || "Current location",
          timezone: "auto",
        }
      : null;

    const location = preciseLocation ?? getVercelIpLocation(request);
    if (!location) {
      return NextResponse.json(
        { error: "Location unavailable" },
        { status: 502, headers: { "Cache-Control": "no-store" } }
      );
    }

    const weather = await fetchCurrentWeather(
      location.lat,
      location.lon,
      location.location,
      location.timezone
    );

    return NextResponse.json(weather, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch weather" },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
