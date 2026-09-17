// Same pattern as app/api/health/route.ts and app/api/workloads/route.ts —
// stateless, no database, safe for serverless.

import { NextResponse } from "next/server";
import { fetchCurrentWeather } from "@/lib/weather";

const LOCATION = {
  name: "Cebu City, Philippines",
  lat: 10.3157,
  lon: 123.8854,
};

export async function GET() {
  try {
    const weather = await fetchCurrentWeather(
      LOCATION.lat,
      LOCATION.lon,
      LOCATION.name
    );
    return NextResponse.json(weather);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch weather" },
      { status: 502 }
    );
  }
}
