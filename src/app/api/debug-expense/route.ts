import "server-only";

const BASE_URL = "https://app.assoconnect.com/api/v1";

export async function GET() {
  const token = process.env.ASSOCONNECT_API_KEY;
  const orgUlid = process.env.ASSOCONNECT_ORGANIZATION_ULID;
  const personUlid = process.env.ASSOCONNECT_PERSON_ULID ?? "01KVTGQXSSNSQV5CA3541A3E7X";

  const payloads = [
    { organization: `/api/v1/organizations/${orgUlid}`, person: `/api/v1/persons/${personUlid}` },
    { organization: `/organizations/${orgUlid}`, person: `/persons/${personUlid}` },
    { organization: `${BASE_URL}/organizations/${orgUlid}`, person: `${BASE_URL}/persons/${personUlid}` },
    { organization: orgUlid, person: personUlid },
  ];

  const results = [];
  for (const iri of payloads) {
    const body = {
      ...iri,
      date: "2026-06-24",
      category: "other",
      comment: "debug test",
      amount: { amount: 1, currency: "EUR" },
    };
    const res = await fetch(`${BASE_URL}/finance_expense_reports`, {
      method: "POST",
      headers: {
        Accept: "application/ld+json",
        "Content-Type": "application/ld+json",
        "X-AUTH-TOKEN": token!,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    results.push({ iri, status: res.status, response: text.slice(0, 300) });
    if (res.ok) break; // stop at first success
  }

  return Response.json(results);
}
