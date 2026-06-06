/** Utilitas keamanan: sanitasi input, batas payload, CSRF origin, JWT secret. */

const CONTROL_CHARS = /[\0\x08\x0B\x0C\x0E-\x1F\x7F]/g;

export class RequestValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function sanitizePlainText(input: string, maxLen: number): string {
  return input.replace(CONTROL_CHARS, "").trim().slice(0, maxLen);
}

export function containsMarkup(input: string): boolean {
  return (
    /[<>]/.test(input) ||
    /javascript:/i.test(input) ||
    /data:text\/html/i.test(input) ||
    /on\w+\s*=/.test(input)
  );
}

export function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      console.error("JWT_SECRET tidak valid — semua sesi ditolak.");
      return new TextEncoder().encode(
        "invalid-production-secret-not-configured!!"
      );
    }
    return new TextEncoder().encode("dev-only-insecure-secret-min-32-chars!!");
  }
  return new TextEncoder().encode(secret);
}

/** Cek Origin/Referer untuk mencegah CSRF pada request mutasi. */
export function isSameOrigin(request: Request): boolean {
  try {
    const expectedHost = new URL(request.url).host;

    const origin = request.headers.get("origin");
    if (origin) {
      return new URL(origin).host === expectedHost;
    }

    const referer = request.headers.get("referer");
    if (referer) {
      return new URL(referer).host === expectedHost;
    }

    return process.env.NODE_ENV !== "production";
  } catch {
    return false;
  }
}

export async function readJsonBody(
  request: Request,
  maxBytes = 16_384
): Promise<unknown> {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const size = Number(contentLength);
    if (!Number.isFinite(size) || size > maxBytes) {
      throw new RequestValidationError("Payload terlalu besar", 413);
    }
  }

  const raw = await request.text();
  if (raw.length > maxBytes) {
    throw new RequestValidationError("Payload terlalu besar", 413);
  }
  if (!raw.trim()) {
    throw new RequestValidationError("Format tidak valid", 400);
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new RequestValidationError("Format tidak valid", 400);
  }
}

export function jsonBodyErrorResponse(error: unknown) {
  if (error instanceof RequestValidationError) {
    return { error: error.message, status: error.status };
  }
  return { error: "Format tidak valid", status: 400 };
}
