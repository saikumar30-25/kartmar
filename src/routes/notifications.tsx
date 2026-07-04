import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useRequireAuth } from "@/lib/queries";
import { readLog, clearLog, type NotifEvent } from "@/lib/notification-log";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Bell, Check, X, MessageSquare, Truck, AlertTriangle, Info, Trash2 } from "lucide-react";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Kartmar" }] }),
  component: () => (
    <AppShell>
      <NotificationsPage />
    </AppShell>
  ),
});

function NotificationsPage() {
  const { user } = useRequireAuth();
  const [events, setEvents] = useState<NotifEvent[]>([]);

  useEffect(() => {
    if (!user) return;
    setEvents(readLog(user.id));
    const onUpdate = () => setEvents(readLog(user.id));
    window.addEventListener("kartmar:notif-log", onUpdate);
    return () => window.removeEventListener("kartmar:notif-log", onUpdate);
  }, [user]);

  if (!user) return null;

  const failed = events.filter((e) => e.status === "failed").length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-moss">Activity log</p>
          <h1 className="font-serif italic text-4xl text-brand-green mt-1">Notifications</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {events.length} event{events.length === 1 ? "" : "s"}
            {failed > 0 && <span className="text-destructive font-semibold"> · {failed} failed</span>}
          </p>
        </div>
        {events.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearLog(user.id);
              setEvents([]);
            }}
          >
            <Trash2 className="size-3.5 mr-1.5" /> Clear
          </Button>
        )}
      </header>

      {events.length === 0 ? (
        <div className="rounded-2xl bg-card ring-1 ring-border p-10 text-center">
          <Bell className="size-8 mx-auto text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No notifications yet.</p>
          <Link to="/browse" className="mt-4 inline-block text-brand-clay text-xs font-bold">Browse listings →</Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {events.map((e) => (
            <EventRow key={e.id} e={e} />
          ))}
        </ul>
      )}
    </div>
  );
}

const KIND_META: Record<
  NotifEvent["kind"],
  { icon: typeof Bell; tint: string }
> = {
  interest_received: { icon: Bell, tint: "bg-brand-clay/15 text-brand-clay" },
  interest_accepted: { icon: Check, tint: "bg-emerald-100 text-emerald-700" },
  interest_rejected: { icon: X, tint: "bg-rose-100 text-rose-700" },
  trip_partner_accepted: { icon: Truck, tint: "bg-brand-moss/15 text-brand-moss" },
  whatsapp_open: { icon: MessageSquare, tint: "bg-emerald-100 text-emerald-700" },
  whatsapp_failed: { icon: AlertTriangle, tint: "bg-amber-100 text-amber-800" },
  deal_created: { icon: Info, tint: "bg-sky-100 text-sky-700" },
};

function EventRow({ e }: { e: NotifEvent }) {
  const meta = KIND_META[e.kind] ?? { icon: Info, tint: "bg-stone-100 text-stone-700" };
  const Icon = meta.icon;
  const failed = e.status === "failed";
  return (
    <li
      className={`rounded-xl bg-card ring-1 p-3 flex items-start gap-3 ${
        failed ? "ring-destructive/30 bg-destructive/5" : "ring-border"
      }`}
    >
      <div className={`size-9 rounded-lg grid place-items-center shrink-0 ${meta.tint}`}>
        <Icon className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm">{e.title}</p>
          <span
            className={`text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded ${
              e.status === "sent"
                ? "bg-emerald-100 text-emerald-700"
                : e.status === "failed"
                  ? "bg-rose-100 text-rose-700"
                  : "bg-stone-100 text-stone-700"
            }`}
          >
            {e.status}
          </span>
        </div>
        {e.description && <p className="text-xs text-muted-foreground mt-0.5 break-words">{e.description}</p>}
        {e.meta && "link" in e.meta && typeof e.meta.link === "string" && (
          <a
            href={e.meta.link}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-emerald-700 font-mono break-all mt-1 inline-block hover:underline"
          >
            {e.meta.link}
          </a>
        )}
        <p className="text-[10px] text-muted-foreground mt-1">{new Date(e.ts).toLocaleString()}</p>
      </div>
    </li>
  );
}
