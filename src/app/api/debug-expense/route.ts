import "server-only";

const BASE_URL = "https://app.assoconnect.com/api/v1";

export async function GET() {
  const token = process.env.ASSOCONNECT_API_KEY!;
  const orgUlid = process.env.ASSOCONNECT_ORGANIZATION_ULID!;
  const personUlid = process.env.ASSOCONNECT_PERSON_ULID ?? "01KVTGQXSSNSQV5CA3541A3E7X";
  const headers = { Accept: "application/ld+json", "X-AUTH-TOKEN": token };

  const routes = [
    `/crm/people/${personUlid}`,
    `/organizations/${orgUlid}/crm/people?itemsPerPage=3`,
    `/crm/people?organization=/api/v1/organizations/${orgUlid}&itemsPerPage=3`,
  ];

  const results: Record<string, unknown>[] = [];
  for (const route of routes) {
    const res = await fetch(`${BASE_URL}${route}`, { headers });
    const text = await res.text();
    results.push({ route, status: res.status, raw: text.slice(0, 400) });
    if (res.ok) break;
  }

  return Response.json(results);
}
