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

  // First: list persons to get their canonical @id
  const headers = { Accept: "application/ld+json", "X-AUTH-TOKEN": token! };

  const [orgRes, personRes] = await Promise.all([
    fetch(`${BASE_URL}/organizations/${orgUlid}`, { headers }),
    fetch(`${BASE_URL}/persons/${personUlid}`, { headers }),
  ]);

  const orgRaw = await orgRes.text();
  const personRaw = await personRes.text();

  return Response.json({
    org: { status: orgRes.status, raw: orgRaw.slice(0, 500) },
    person: { status: personRes.status, raw: personRaw.slice(0, 500) },
  });
}
