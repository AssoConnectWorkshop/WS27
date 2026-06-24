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
  const personsRes = await fetch(`${BASE_URL}/organizations/${orgUlid}/persons?itemsPerPage=5`, {
    headers: { Accept: "application/ld+json", "X-AUTH-TOKEN": token! },
  });
  const personsData = await personsRes.json();
  const persons = personsData["hydra:member"]?.map((p: { "@id": string; email: string; firstName: string }) => ({
    id: p["@id"], email: p.email, firstName: p.firstName,
  }));

  return Response.json({ persons, orgUlid, personUlid });
}
