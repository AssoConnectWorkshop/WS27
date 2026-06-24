import "server-only";

const BASE_URL = "https://app.assoconnect.com/api/v1";

export async function GET() {
  const token = process.env.ASSOCONNECT_API_KEY!;
  const orgUlid = process.env.ASSOCONNECT_ORGANIZATION_ULID!;
  const personUlid = process.env.ASSOCONNECT_PERSON_ULID ?? "01KVTGQXSSNSQV5CA3541A3E7X";
  const headers = { Accept: "application/ld+json", "Content-Type": "application/ld+json", "X-AUTH-TOKEN": token };

  const categories = ["travel", "meal", "accommodation", "office", "other", "restaurant", "transport", "miscellaneous"];

  for (const category of categories) {
    const res = await fetch(`${BASE_URL}/finance_expense_reports`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        organization: `/api/v1/organizations/${orgUlid}`,
        person: `/api/v1/crm/people/${personUlid}`,
        date: "2026-06-24",
        category,
        comment: "debug test",
        amount: { amount: 100, currency: "EUR" },
      }),
    });
    const text = await res.text();
    if (res.ok) return Response.json({ success: true, category, id: JSON.parse(text)["@id"] });
    const detail = JSON.parse(text).detail ?? text.slice(0, 200);
    if (!detail.includes("enumeration")) return Response.json({ stoppedAt: category, status: res.status, detail });
  }

  return Response.json({ tried: categories, result: "all failed with enum error" });
}
