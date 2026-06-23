import { createClient } from "@/lib/supabase/server";
import { parseReceiptFromUrl, missingFields, formatConfirmation, type ReceiptData } from "@/lib/receipt-parser";
import { createExpenseReport, uploadReceiptFile, getExpenseReports } from "@/lib/assoconnect";

type Session = {
  phone: string;
  state: string;
  pending: (ReceiptData & { imageUrl?: string; missingField?: string }) | null;
};

function twiml(message: string): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`;
  return new Response(xml, { headers: { "Content-Type": "text/xml" } });
}

async function getSession(supabase: Awaited<ReturnType<typeof createClient>>, phone: string): Promise<Session> {
  const { data } = await supabase
    .from("ws27_whatsapp_sessions")
    .select("*")
    .eq("phone", phone)
    .single();
  return data ?? { phone, state: "idle", pending: null };
}

async function saveSession(supabase: Awaited<ReturnType<typeof createClient>>, session: Session) {
  await supabase.from("ws27_whatsapp_sessions").upsert({
    phone: session.phone,
    state: session.state,
    pending: session.pending,
    updated_at: new Date().toISOString(),
  });
}

async function clearSession(supabase: Awaited<ReturnType<typeof createClient>>, phone: string) {
  await supabase.from("ws27_whatsapp_sessions").upsert({
    phone,
    state: "idle",
    pending: null,
    updated_at: new Date().toISOString(),
  });
}

function parseCorrection(text: string, pending: ReceiptData): ReceiptData | null {
  const lower = text.toLowerCase().trim();

  const amountMatch = lower.match(/(?:montant|amount)\s+([\d.,]+)/);
  if (amountMatch) {
    return { ...pending, amount: parseFloat(amountMatch[1].replace(",", ".")) };
  }

  const dateMatch = lower.match(/(?:date)\s+(\d{4}-\d{2}-\d{2}|\d{2}[-/]\d{2}[-/]\d{4})/);
  if (dateMatch) {
    let date = dateMatch[1];
    if (date.match(/^\d{2}[-/]\d{2}[-/]\d{4}$/)) {
      const [d, m, y] = date.split(/[-/]/);
      date = `${y}-${m}-${d}`;
    }
    return { ...pending, date };
  }

  const categoryMatch = lower.match(/(?:catégorie|categorie|category)\s+(\w+)/);
  if (categoryMatch) {
    return { ...pending, category: categoryMatch[1] };
  }

  const commentMatch = lower.match(/(?:commentaire|comment|note)\s+(.+)/);
  if (commentMatch) {
    return { ...pending, comment: commentMatch[1] };
  }

  return null;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const from = formData.get("From") as string;
  const body = (formData.get("Body") as string ?? "").trim();
  const numMedia = parseInt(formData.get("NumMedia") as string ?? "0");
  const mediaUrl = formData.get("MediaUrl0") as string | null;
  const mediaType = formData.get("MediaContentType0") as string | null;

  const supabase = await createClient();
  const session = await getSession(supabase, from);

  // --- User sends an image ---
  if (numMedia > 0 && mediaUrl && mediaType?.startsWith("image/")) {
    const authHeader = `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`;

    let receipt: ReceiptData;
    try {
      receipt = await parseReceiptFromUrl(mediaUrl, authHeader);
    } catch {
      return twiml("❌ Je n'ai pas pu analyser l'image. Réessaie avec une photo plus nette.");
    }

    const pending = { ...receipt, imageUrl: mediaUrl };
    const missing = missingFields(receipt);

    if (missing.length > 0) {
      const field = missing[0];
      await saveSession(supabase, { phone: from, state: `awaiting_${field}`, pending });
      const question = field === "amount"
        ? "💰 Quel est le montant total de la dépense ? (ex: 25.50)"
        : "📅 Quelle est la date de la dépense ? (format: AAAA-MM-JJ)";
      return twiml(`🧾 Ticket reçu !\n\n${question}`);
    }

    await saveSession(supabase, { phone: from, state: "awaiting_confirmation", pending });
    return twiml(formatConfirmation(receipt));
  }

  // --- User replies with missing amount ---
  if (session.state === "awaiting_amount" && session.pending) {
    const amount = parseFloat(body.replace(",", "."));
    if (isNaN(amount)) {
      return twiml("❌ Montant invalide. Ex: 25.50");
    }
    const updated = { ...session.pending, amount };
    const missing = missingFields(updated);
    if (missing.length > 0) {
      await saveSession(supabase, { phone: from, state: `awaiting_${missing[0]}`, pending: updated });
      return twiml("📅 Quelle est la date ? (format: AAAA-MM-JJ)");
    }
    await saveSession(supabase, { phone: from, state: "awaiting_confirmation", pending: updated });
    return twiml(formatConfirmation(updated));
  }

  // --- User replies with missing date ---
  if (session.state === "awaiting_date" && session.pending) {
    let date = body;
    if (date.match(/^\d{2}[-/]\d{2}[-/]\d{4}$/)) {
      const [d, m, y] = date.split(/[-/]/);
      date = `${y}-${m}-${d}`;
    }
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return twiml("❌ Format invalide. Ex: 2026-06-23");
    }
    const updated = { ...session.pending, date };
    await saveSession(supabase, { phone: from, state: "awaiting_confirmation", pending: updated });
    return twiml(formatConfirmation(updated));
  }

  // --- User confirms or corrects ---
  if (session.state === "awaiting_confirmation" && session.pending) {
    const lower = body.toLowerCase();

    if (["oui", "ok", "yes", "o", "confirm", "confirmer"].includes(lower)) {
      const d = session.pending;
      const today = new Date().toISOString().split("T")[0];
      try {
        const expense = await createExpenseReport({
          date: d.date ?? today,
          category: d.category ?? "other",
          comment: d.comment ?? `Dépense ${d.merchant ?? ""}`.trim(),
          amount: d.amount!,
          currency: d.currency ?? "EUR",
        });

        // Try to attach receipt image (non-blocking)
        if (d.imageUrl) {
          uploadReceiptFile(d.imageUrl, expense["@id"]).catch(() => null);
        }

        await clearSession(supabase, from);
        return twiml(`✅ Dépense soumise pour validation !\n\n💰 ${d.amount} ${d.currency ?? "EUR"}\n📝 ${d.comment ?? ""}\n\nLe trésorier recevra une notification.`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur inconnue";
        return twiml(`❌ Erreur lors de la soumission : ${msg.slice(0, 200)}`);
      }
    }

    if (["non", "no", "annuler", "cancel"].includes(lower)) {
      await clearSession(supabase, from);
      return twiml("🚫 Dépense annulée.");
    }

    // Try to parse a correction
    const corrected = parseCorrection(body, session.pending);
    if (corrected) {
      await saveSession(supabase, { phone: from, state: "awaiting_confirmation", pending: { ...corrected, imageUrl: session.pending.imageUrl } });
      return twiml(formatConfirmation(corrected));
    }

    return twiml(`Je n'ai pas compris. Réponds *oui* pour confirmer, *non* pour annuler, ou envoie une correction.\nEx: "montant 32.50" ou "date 2026-06-20"\n\n${formatConfirmation(session.pending)}`);
  }

  // --- List pending expenses ---
  const lower = body.toLowerCase();
  if (["liste", "list", "dépenses", "depenses", "pending"].includes(lower)) {
    try {
      const { "hydra:member": reports } = await getExpenseReports();
      if (!reports.length) {
        return twiml("📋 Aucune dépense en attente de validation.");
      }
      const lines = reports.slice(0, 5).map((r) =>
        `• ${r.date} — ${r.amount.amount} ${r.amount.currency} — ${r.comment ?? r.category}`
      );
      return twiml(`📋 Dépenses en attente :\n\n${lines.join("\n")}`);
    } catch {
      return twiml("❌ Impossible de récupérer les dépenses.");
    }
  }

  // --- Default help ---
  return twiml(`👋 Bonjour ! Pour soumettre une dépense, envoie une photo de ton ticket.\n\nCommandes :\n• 📸 Photo d'un ticket → créer une dépense\n• *liste* → voir les dépenses en attente`);
}
