import "server-only";

const BASE_URL = "https://app.assoconnect.com/api/v1";

// Test user JWT auth (Abir ABDOULA — test account)
// Access token expires ~12h, auto-refreshed via refresh token
const TEST_REFRESH_TOKEN = "bbfd1676-6fd9-11f1-ab28-1a2136a09b62";
let cachedAccessToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpYXQiOjE3ODIzMTE2MzcsImV4cCI6MTc4MjM1NDgzNywicm9sZXMiOltdLCJzZXNzaW9uLWlkIjoiYmJmOWMyYmUtNmZkOS0xMWYxLWFkNDUtMWEyMTM2YTA5YjYyIiwidG9rZW4tdHlwZSI6ImFjY2VzcyIsInVzZXJuYW1lIjoiMDFLVlRHUVhTU05TUVY1Q0EzNTQxQTNFN1gifQ.IHF18HaiO42DHylNuBNLJvS5yS-jGsHDF83lgnohvY_ZAD26hMRltih1tM21uG57X_sCNJuCfhKuSF3K1J1YWhhAjsCuY442S-mNfryS71DU58wHIZ9MqnX6ae7rxnTIeVBJ9pjWu_XcLlBSVRnEJnH-9HRZenE0XpjZ7mKWpiewoOo909KPBep7AzvwlJTL09hAafS8EPTaV8tw-zh1dqXiJd7Q2fPiRcuBe89UqpSIALXFitcQ8rBjwHm6clyXfvDU1E7EqABv9yQY89GFw6j1P2Jbq-A7BdUg-xENNcBkHZCvC4CEHKw8teOrKwXjGOicfJZPkIcdmtJTA4uAtMAyOyfEJuwsV6yTJyirLWRoCwN8cRa5XMsVMTp4bsfAo8cmtp_LB6du4I43jKom2-Bg5PmB008A37_xI9Cg5ZbEdT7pcBVNqaWNWG-GWn_1LbayhhfiU7rsUVsXbFb9-Y-P5vW-6IC8HOncC-V1UrQ380tmPXhfDf9InE1hAMyk8abkuNELr7ZoNKkfewU5YHBqmhKmfzpNSFTi_iRAmkkye1CJiwgTOvl2oqXd5dpWeDBzYarWJggH6bv_ZdRd62D7XYhfMnVpotGNhqyc4Oj2Wovau0ZtiAKQg7BlUwuLiF7NDMNSbhT60UYrJSmsGB1X3oy2j407T8Qi-4xu6d8";

function isTokenExpired(jwt: string): boolean {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64").toString());
    return payload.exp * 1000 < Date.now() + 60_000;
  } catch {
    return true;
  }
}

async function getUserToken(): Promise<string> {
  if (!isTokenExpired(cachedAccessToken)) return cachedAccessToken;
  const res = await fetch("https://assoconnect-workshops.assoconnect.com/api/v1/token/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: TEST_REFRESH_TOKEN }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  const data = await res.json();
  cachedAccessToken = data.token ?? data.access_token;
  return cachedAccessToken;
}

async function requestAsUser<T>(path: string): Promise<T> {
  const token = await getUserToken();
  const res = await fetch(`https://assoconnect-workshops.assoconnect.com/api/v1${path}`, {
    headers: {
      Accept: "application/ld+json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AssoConnect GET ${path} failed: ${res.status} ${res.statusText} — ${text}`);
  }
  return res.json() as Promise<T>;
}

async function postAsUser<T>(path: string, body: unknown): Promise<T> {
  const token = await getUserToken();
  const res = await fetch(`https://assoconnect-workshops.assoconnect.com/api/v1${path}`, {
    method: "POST",
    headers: {
      Accept: "application/ld+json",
      "Content-Type": "application/ld+json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AssoConnect POST ${path} failed: ${res.status} ${res.statusText} — ${text}`);
  }
  return res.json() as Promise<T>;
}

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
  return requestAsUser<{ "hydra:member": ExpenseReport[] }>(`/organizations/${orgUlid}/finance_expense_reports?status=submitted&itemsPerPage=10`);
}

export async function createExpenseReport(data: {
  date: string;
  category: string;
  comment: string;
  amount: number;
  currency: string;
}) {
  const orgUlid = process.env.ASSOCONNECT_ORGANIZATION_ULID;
  const personUlid = process.env.ASSOCONNECT_PERSON_ULID ?? "01KVTGQXSSNSQV5CA3541A3E7X";
  if (!orgUlid) throw new Error("ASSOCONNECT_ORGANIZATION_ULID is not set");

  const orgIri = `/api/v1/organizations/${orgUlid}`;
  const personIri = `/api/v1/crm/people/${personUlid}`;

  return postAsUser<ExpenseReport>("/finance_expense_reports", {
    organization: orgIri,
    person: personIri,
    date: data.date,
    category: data.category,
    comment: data.comment,
    amount: { amount: Math.round(data.amount * 100), currency: data.currency },
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
