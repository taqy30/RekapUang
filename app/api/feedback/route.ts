import { NextResponse } from "next/server";
import { getSession, isSameOrigin } from "@/lib/auth";
import { sendFeedbackEmail } from "@/lib/email";
import { FEEDBACK_TYPE_LABELS, getFeedbackRecipient } from "@/lib/feedback";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { jsonBodyErrorResponse, readJsonBody } from "@/lib/security";
import { feedbackSchema, safeParseJson } from "@/lib/validation";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Origin tidak valid" }, { status: 403 });
  }

  const ip = getClientIp(request.headers);
  const ipLimit = rateLimit(`feedback:ip:${ip}`, 5, 60 * 15);
  if (!ipLimit.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak pengiriman. Coba lagi nanti." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await readJsonBody(request);
  } catch (err) {
    const parsed = jsonBodyErrorResponse(err);
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  const parsed = safeParseJson(feedbackSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { type, subject, message, contactEmail, pageUrl, website } = parsed.data;

  if (website) {
    return NextResponse.json({
      message: "Terima kasih, masukan Anda telah kami terima.",
    });
  }

  const session = await getSession();

  try {
    await sendFeedbackEmail(getFeedbackRecipient(), {
      type,
      typeLabel: FEEDBACK_TYPE_LABELS[type],
      subject,
      message,
      contactEmail,
      pageUrl,
      senderName: session?.name,
      senderEmail: session?.email,
      ip,
    });
  } catch (err) {
    console.error("Gagal kirim email feedback:", err);
    return NextResponse.json(
      {
        error:
          "Gagal mengirim masukan. Periksa koneksi SMTP atau coba lagi nanti.",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    message: "Terima kasih. Masukan Anda telah dikirim ke tim RekapUang.",
  });
}
