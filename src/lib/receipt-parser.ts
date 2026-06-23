import Anthropic from "@anthropic-ai/sdk";

export type ReceiptData = {
  amount: number | null;
  currency: string;
  date: string | null;
  merchant: string | null;
  category: string | null;
  comment: string | null;
};

const client = new Anthropic();

export async function parseReceiptFromUrl(imageUrl: string, authHeader?: string): Promise<ReceiptData> {
  // Download image to base64
  const fetchOptions: RequestInit = authHeader ? { headers: { Authorization: authHeader } } : {};
  let imgRes = await fetch(imageUrl, fetchOptions);
  if (!imgRes.ok && authHeader) {
    imgRes = await fetch(imageUrl);
  }
  if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status} — url: ${imageUrl.slice(0, 80)} — hasAuth: ${!!authHeader}`);

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
  "category": <one of: restaurant, transport, accommodation, office_supplies, other>,
  "comment": <brief description, e.g. "Lunch at Le Petit Bistro">
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
  return {
    amount: typeof parsed.amount === "number" ? parsed.amount : null,
    currency: parsed.currency ?? "EUR",
    date: parsed.date ?? null,
    merchant: parsed.merchant ?? null,
    category: parsed.category ?? null,
    comment: parsed.comment ?? null,
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
