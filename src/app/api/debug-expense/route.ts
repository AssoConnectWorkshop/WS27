import "server-only";

const REFRESH_TOKEN = "bbfd1676-6fd9-11f1-ab28-1a2136a09b62";
const BASE = "https://assoconnect-workshops.assoconnect.com";

export async function GET() {
  const results: Record<string, unknown>[] = [];

  for (const path of ["/api/token/refresh", "/api/v1/token/refresh", "/token/refresh"]) {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: REFRESH_TOKEN }),
    });
    const text = await res.text();
    results.push({ path, status: res.status, raw: text.slice(0, 300) });
    if (res.ok) break;
  }

  return Response.json(results);
}
