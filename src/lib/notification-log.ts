// Lightweight per-user in-app notification event log (localStorage).
// Purpose: give the user a visible trail of booking notifications, WhatsApp
// deep-link attempts, and whether they succeeded or failed to open.

export type NotifKind =
  | "interest_received"
  | "interest_accepted"
  | "interest_rejected"
  | "trip_partner_accepted"
  | "whatsapp_open"
  | "whatsapp_failed"
  | "deal_created";

export type NotifEvent = {
  id: string;
  ts: number;
  kind: NotifKind;
  title: string;
  description?: string;
  status: "sent" | "failed" | "info";
  meta?: Record<string, unknown>;
};

const LIMIT = 200;

function keyFor(userId: string) {
  return `kartmar.notif.log.${userId}`;
}

export function readLog(userId: string): NotifEvent[] {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return [];
    return JSON.parse(raw) as NotifEvent[];
  } catch {
    return [];
  }
}

export function logEvent(userId: string, ev: Omit<NotifEvent, "id" | "ts"> & { ts?: number }) {
  try {
    const entry: NotifEvent = {
      id: crypto.randomUUID(),
      ts: ev.ts ?? Date.now(),
      kind: ev.kind,
      title: ev.title,
      description: ev.description,
      status: ev.status,
      meta: ev.meta,
    };
    const cur = readLog(userId);
    const next = [entry, ...cur].slice(0, LIMIT);
    localStorage.setItem(keyFor(userId), JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("kartmar:notif-log", { detail: entry }));
    return entry;
  } catch {
    return null;
  }
}

export function clearLog(userId: string) {
  try {
    localStorage.removeItem(keyFor(userId));
    window.dispatchEvent(new CustomEvent("kartmar:notif-log", { detail: null }));
  } catch {
    // ignore
  }
}

// Attempt to open a WhatsApp deep-link and log outcome.
export function openWhatsAppWithLog(
  userId: string,
  link: string | null,
  meta: { to?: string | null; phone?: string | null; context: string; message?: string },
) {
  if (!link) {
    logEvent(userId, {
      kind: "whatsapp_failed",
      title: `WhatsApp not sent — no phone`,
      description: `${meta.context}${meta.to ? ` → ${meta.to}` : ""}`,
      status: "failed",
      meta,
    });
    return false;
  }
  try {
    const w = window.open(link, "_blank", "noopener");
    const ok = !!w || /iP(ad|hone)|Android/.test(navigator.userAgent);
    logEvent(userId, {
      kind: ok ? "whatsapp_open" : "whatsapp_failed",
      title: ok ? "WhatsApp opened" : "WhatsApp blocked by browser",
      description: `${meta.context}${meta.to ? ` → ${meta.to}` : ""}${meta.phone ? ` (${meta.phone})` : ""}`,
      status: ok ? "sent" : "failed",
      meta: { ...meta, link },
    });
    return ok;
  } catch (e: any) {
    logEvent(userId, {
      kind: "whatsapp_failed",
      title: "WhatsApp failed to open",
      description: e?.message ?? "Unknown error",
      status: "failed",
      meta: { ...meta, link },
    });
    return false;
  }
}
