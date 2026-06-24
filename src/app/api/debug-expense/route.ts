import "server-only";

const BASE_URL = "https://app.assoconnect.com/api/v1";

export async function GET() {
  const token = process.env.ASSOCONNECT_API_KEY!;
  const orgUlid = process.env.ASSOCONNECT_ORGANIZATION_ULID!;
  const personUlid = process.env.ASSOCONNECT_PERSON_ULID ?? "01KVTGQXSSNSQV5CA3541A3E7X";
  const headers = { Accept: "application/ld+json", "X-AUTH-TOKEN": token };

  const orgRes = await fetch(`${BASE_URL}/organizations/${orgUlid}`, { headers });
  const org = await orgRes.json();

  const personRes = await fetch(`${BASE_URL}/persons/${personUlid}`, { headers });
  const person = await personRes.json();

  return Response.json({ org, person });
}
