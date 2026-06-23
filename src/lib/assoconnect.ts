import "server-only";

const BASE_URL = "https://app.assoconnect.com/api/v1";

export type Organization = {
  "@id": string;
  "@type": string;
  brand: string;
  isAdvanced: boolean;
  isLegalIndependent: boolean;
  logoUrl: string;
  name: string;
  parent: string | null;
  phoneNumber: string;
  url: string;
};

export type ExpenseReport = {
  "@id": string;
  "@type": string;
  id: string;
  date: string;
  category: string;
  comment: string;
  amount: { amount: number; currency: string };
  status: string;
  person: string;
};

export type MediaObject = {
  "@id": string;
  "@type": string;
  id: string;
  uploadUrl?: string;
};

function getToken() {
  const token = process.env.ASSOCONNECT_API_KEY;
  if (!token) throw new Error("ASSOCONNECT_API_KEY is not set");
  return token;
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Accept: "application/ld+json",
      "X-AUTH-TOKEN": getToken(),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AssoConnect ${path} failed: ${res.status} ${res.statusText} — ${body}`);
  }

  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/ld+json",
      "Content-Type": "application/ld+json",
      "X-AUTH-TOKEN": getToken(),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AssoConnect POST ${path} failed: ${res.status} ${res.statusText} — ${text}`);
  }

  return res.json() as Promise<T>;
}

export function getOrganization(ulid = process.env.ASSOCONNECT_ORGANIZATION_ULID) {
  if (!ulid) throw new Error("ASSOCONNECT_ORGANIZATION_ULID is not set");
  return request<Organization>(`/organizations/${ulid}`);
}

export function getExpenseReports(orgUlid = process.env.ASSOCONNECT_ORGANIZATION_ULID) {
  if (!orgUlid) throw new Error("ASSOCONNECT_ORGANIZATION_ULID is not set");
  return request<{ "hydra:member": ExpenseReport[] }>(`/organizations/${orgUlid}/finance_expense_reports?status=submitted&itemsPerPage=10`);
}

export function createExpenseReport(data: {
  date: string;
  category: string;
  comment: string;
  amount: number;
  currency: string;
}) {
  const orgUlid = process.env.ASSOCONNECT_ORGANIZATION_ULID;
  const personUlid = process.env.ASSOCONNECT_PERSON_ULID ?? "01KVTGQXSSNSQV5CA3541A3E7X";
  if (!orgUlid) throw new Error("ASSOCONNECT_ORGANIZATION_ULID is not set");

  return post<ExpenseReport>("/finance_expense_reports", {
    organization: `/api/v1/organizations/${orgUlid}`,
    person: `/api/v1/persons/${personUlid}`,
    date: data.date,
    category: data.category,
    comment: data.comment,
    amount: { amount: data.amount, currency: data.currency },
  });
}

export async function uploadReceiptFile(imageUrl: string, expenseReportIri: string) {
  // Download image from Twilio
  const imgRes = await fetch(imageUrl, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_SSID}:${process.env.TWILIO_TOKEN}`).toString("base64")}`,
    },
  });
  if (!imgRes.ok) throw new Error(`Failed to download image: ${imgRes.status}`);

  const imageBuffer = Buffer.from(await imgRes.arrayBuffer());
  const mimeType = imgRes.headers.get("content-type") ?? "image/jpeg";

  // Create MediaObject
  const { createHash } = await import("crypto");
  const md5 = createHash("md5").update(imageBuffer).digest("base64");
  const orgUlid = process.env.ASSOCONNECT_ORGANIZATION_ULID;

  const mediaObj = await post<MediaObject & { uploadUrl?: string }>("/media_objects", {
    contentMd5: md5,
    organization: `/api/v1/organizations/${orgUlid}`,
    type: "expense_report",
    mimeType,
  });

  // Upload to S3 if uploadUrl provided
  if (mediaObj.uploadUrl) {
    await fetch(mediaObj.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": mimeType, "Content-MD5": md5 },
      body: imageBuffer,
    });
  }

  // Link file to expense report
  await post("/finance_expense_report_files", {
    mediaObject: mediaObj["@id"],
    expenseReport: expenseReportIri,
  });
}
