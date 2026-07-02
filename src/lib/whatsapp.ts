// Normalize an Indian phone to E.164 for WhatsApp (wa.me needs digits only,
// with country code, no leading +).
export function waNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;
  // Already has 91xxxxxxxxxx (12) or 12+ digits — trust it.
  if (digits.length >= 11 && digits.startsWith("91")) return digits;
  // 10-digit Indian mobile → prefix 91.
  if (digits.length === 10) return `91${digits}`;
  // Fallback: return what we have (better than nothing).
  return digits;
}

export function waLink(phone: string | null | undefined, message: string): string | null {
  const n = waNumber(phone);
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}

export function telLink(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `tel:+91${digits}`;
  return `tel:+${digits}`;
}
