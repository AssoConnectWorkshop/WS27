import "server-only";
import { parseReceiptFromUrl } from "@/lib/receipt-parser";

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url");
  if (!url) return Response.json({ error: "Pass ?url=<image_url>" }, { status: 400 });
  try {
    const result = await parseReceiptFromUrl(url);
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
