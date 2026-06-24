import "server-only";

const BASE_URL = "https://app.assoconnect.com/api/v1";

export async function GET() {
  const token = process.env.ASSOCONNECT_API_KEY!;
  const orgUlid = process.env.ASSOCONNECT_ORGANIZATION_ULID!;
  const personUlid = process.env.ASSOCONNECT_PERSON_ULID ?? "01KVTGQXSSNSQV5CA3541A3E7X";
  const headers = { Accept: "application/ld+json", "Content-Type": "application/ld+json", "X-AUTH-TOKEN": token };

  const combos = [
    { organization: `/api/v1/organizations/${orgUlid}`, person: `/api/v1/crm/people/${personUlid}` },
    { organization: `/api/v1/organization/${orgUlid}`, person: `/api/v1/crm/people/${personUlid}` },
    { organization: `/api/v1/organizations/${orgUlid}`, person: `/api/v1/crm/person/${personUlid}` },
    { organization: `/api/v1/organization/${orgUlid}`, person: `/api/v1/crm/person/${personUlid}` },
  ];

  const results = [];
  for (const combo of combos) {
    const res = await fetch(`${BASE_URL}/finance_expense_reports`, {
      method: "POST",
      headers,
      body: JSON.stringify({ ...combo, date: "2026-06-24", category: "OTHER", comment: "debug", amount: { amount: 100, currency: "EUR" } }),
    });
    const text = await res.text();
    const detail = (() => { try { return JSON.parse(text).detail; } catch { return text; } })();
    results.push({ combo, status: res.status, detail: detail?.slice(0, 150) });
    if (res.ok) break;
  }

  return Response.json(results);
}
