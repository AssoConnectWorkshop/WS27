import Anthropic from "@anthropic-ai/sdk";

export type ReceiptData = {
  amount: number | null;
  currency: string;
  date: string | null;
  merchant: string | null;
  category: string | null;
  comment: string | null;
  reimbursable: boolean;
  rejection_reason: string | null;
};

const client = new Anthropic();

export async function parseReceiptFromUrl(imageUrl: string, authHeader?: string): Promise<ReceiptData> {
  // Download image to base64
  // Extract Account SID from Twilio media URL (more reliable than env var)
  const accountSidMatch = imageUrl.match(/Accounts\/([^/]+)\//);
  const accountSid = accountSidMatch?.[1] ?? process.env.TWILIO_SSID;
  const authToken = process.env.TWILIO_TOKEN;
  const derivedAuth = accountSid && authToken
    ? `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`
    : authHeader;

  const fetchOptions: RequestInit = derivedAuth ? { headers: { Authorization: derivedAuth } } : {};
  const imgRes = await fetch(imageUrl, fetchOptions);
  if (!imgRes.ok) throw new Error(`401 — sid: ${accountSid?.slice(0, 10)} — url: ${imageUrl}`);

  const buffer = Buffer.from(await imgRes.arrayBuffer());
  const base64 = buffer.toString("base64");
  const mediaType = (imgRes.headers.get("content-type") ?? "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64 },
          },
          {
            type: "text",
            text: `Analyze this receipt and extract the following information. Respond ONLY with a JSON object, no other text:
{
  "amount": <total amount as a number, e.g. 25.50>,
  "currency": <currency code, e.g. "EUR", "USD" — default to "EUR" if unclear>,
  "date": <date in YYYY-MM-DD format, or null if not visible>,
  "merchant": <merchant/restaurant/shop name, or null>,
  "category": <one of: RECEPTION, TRAVEL, MISSION, FURNITURE, LOCATION, MARKETING_AND_COMMUNICATION, MILEAGE_EXPENSE, TELECOMMUNICATION, OTHER — pick the closest match>,
  "comment": <brief description, e.g. "Lunch at Le Petit Bistro">,
  "reimbursable": <true if this is a legitimate professional expense; false if it is a personal expense not eligible for reimbursement, such as dry cleaning / pressing, clothing, hairdresser, pharmacy, personal groceries, gym, etc.>,
  "rejection_reason": <if reimbursable is false, a short French explanation why, e.g. "Pressing / nettoyage à sec — dépense personnelle non prise en charge"; otherwise null>
}`,
          },
        ],
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "{}";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in receipt parser response");

  const parsed = JSON.parse(jsonMatch[0]) as ReceiptData;

  const merchant = parsed.merchant ?? "";
  const comment = parsed.comment ?? "";
  const PERSONAL_KEYWORDS = [
    "pressing", "nettoyage à sec", "blanchisserie", "laverie", "teinturerie",
    "coiffeur", "coiffure", "salon de coiffure", "barbier", "barber",
    "pharmacie", "parapharmacie",
    "vêtements", "vetements", "habillement", "boutique", "prêt-à-porter",
    "salle de sport", "gym", "fitness",
  ];
  const lowerText = `${merchant} ${comment}`.toLowerCase();
  const matchedKeyword = PERSONAL_KEYWORDS.find(kw => lowerText.includes(kw));

  const reimbursable = matchedKeyword ? false : parsed.reimbursable !== false;
  const rejection_reason = matchedKeyword
    ? `${merchant || matchedKeyword} — dépense personnelle non prise en charge`
    : (parsed.rejection_reason ?? null);

  return {
    amount: typeof parsed.amount === "number" ? parsed.amount : null,
    currency: parsed.currency ?? "EUR",
    date: parsed.date ?? null,
    merchant: merchant || null,
    category: parsed.category ?? null,
    comment: parsed.comment ?? null,
    reimbursable,
    rejection_reason,
  };
}

export function missingFields(data: ReceiptData): string[] {
  const missing: string[] = [];
  if (!data.amount) missing.push("amount");
  if (!data.date) missing.push("date");
  return missing;
}

export function formatConfirmation(data: ReceiptData): string {
  const today = new Date().toISOString().split("T")[0];
  return `✅ Voici ce que j'ai extrait du ticket :

💰 Montant : ${data.amount} ${data.currency}
📅 Date : ${data.date ?? today}
🏪 Marchand : ${data.merchant ?? "—"}
🏷 Catégorie : ${data.category ?? "other"}
📝 Commentaire : ${data.comment ?? "—"}

Réponds *oui* pour soumettre la dépense, ou envoie une correction (ex: "montant 32.50" ou "date 2026-06-20").`;
}
