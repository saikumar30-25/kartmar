import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useMyInterests, useRespondInterest, useRequireAuth } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquare, Phone, Check, X, Inbox, Send, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { rupees } from "@/lib/format";
import { waLink, telLink } from "@/lib/whatsapp";

export const Route = createFileRoute("/interests")({
  head: () => ({ meta: [{ title: "Interests — AgriConnect" }] }),
  component: () => (
    <AppShell>
      <InterestsPage />
    </AppShell>
  ),
});

function InterestsPage() {
  const { user } = useRequireAuth();
  const { data = [], isLoading } = useMyInterests();

  if (!user) return null;
  if (isLoading) return <div className="py-20 grid place-items-center"><Loader2 className="size-6 animate-spin" /></div>;

  const received = data.filter((r) => r.farmer_id === user.id);
  const sent = data.filter((r) => r.buyer_id === user.id);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-moss">Interest requests</p>
        <h1 className="font-serif italic text-4xl text-brand-green mt-1">Buyer enquiries</h1>
      </header>

      <section>
        <h2 className="flex items-center gap-2 font-semibold text-lg mb-3">
          <Inbox className="size-4 text-brand-clay" /> Received ({received.length})
        </h2>
        {received.length === 0 ? (
          <p className="text-sm text-muted-foreground">No buyer enquiries yet.</p>
        ) : (
          <div className="space-y-3">
            {received.map((r) => <ReceivedCard key={r.id} r={r} />)}
          </div>
        )}
      </section>

      <section>
        <h2 className="flex items-center gap-2 font-semibold text-lg mb-3">
          <Send className="size-4 text-brand-moss" /> Sent ({sent.length})
        </h2>
        {sent.length === 0 ? (
          <p className="text-sm text-muted-foreground">You haven't expressed interest in any listing. <Link to="/browse" className="text-brand-clay font-semibold">Browse now →</Link></p>
        ) : (
          <div className="space-y-3">
            {sent.map((r) => <SentCard key={r.id} r={r} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function statusPill(status: string) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    accepted: "bg-emerald-100 text-emerald-800",
    rejected: "bg-rose-100 text-rose-800",
  };
  return <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full ${map[status] ?? "bg-stone-100"}`}>{status}</span>;
}

function ReceivedCard({ r }: { r: any }) {
  const respond = useRespondInterest();
  const [reply, setReply] = useState("");
  const [showReply, setShowReply] = useState(false);
  const buyerPhone = r.buyer?.phone ?? r.buyer_phone;
  const waMsgText = `Hi ${r.buyer_name}, regarding your interest in ${r.listing?.product_name ?? "my listing"} on AgriConnect.`;

  const act = async (status: "accepted" | "rejected") => {
    try {
      await respond.mutateAsync({ id: r.id, status, response: reply || undefined });
      toast.success(status === "accepted" ? "Buyer notified — accepted" : "Buyer notified — declined");
      setShowReply(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="rounded-2xl bg-card ring-1 ring-border p-4">
      <div className="flex items-start gap-3">
        {r.listing?.photo_url && <img src={r.listing.photo_url} alt="" className="size-14 rounded-lg object-cover" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold">{r.buyer_name}</p>
            {statusPill(r.status)}
          </div>
          <p className="text-xs text-muted-foreground">for <strong>{r.listing?.product_name ?? "Listing"}</strong>{r.quantity ? ` · ${r.quantity} ${r.listing?.unit ?? ""}` : ""}{r.offer_price_paise ? ` · offers ${rupees(r.offer_price_paise)}/${r.listing?.unit ?? "unit"}` : ""}</p>
          <p className="text-xs text-muted-foreground mt-0.5"><MapPin className="size-3 inline" /> {r.buyer_address}{r.buyer_pincode ? ` — ${r.buyer_pincode}` : ""}</p>
        </div>
      </div>
      {r.message && <p className="mt-3 text-sm bg-brand-cream/60 rounded-lg p-3">{r.message}</p>}
      {r.farmer_response && <p className="mt-2 text-xs text-emerald-800 bg-emerald-50 rounded-lg p-2"><strong>Your reply:</strong> {r.farmer_response}</p>}

      {r.status === "pending" && (
        <div className="mt-3 space-y-2">
          {showReply && (
            <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Optional reply to buyer…" rows={2} />
          )}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => act("accepted")} disabled={respond.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Check className="size-3.5 mr-1" /> Accept
            </Button>
            <Button size="sm" variant="outline" onClick={() => act("rejected")} disabled={respond.isPending}>
              <X className="size-3.5 mr-1" /> Decline
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowReply((s) => !s)}>
              {showReply ? "Hide reply" : "Add reply"}
            </Button>
            {buyerPhone && (
              <>
                <Button size="sm" variant="outline" asChild>
                  <a href={telLink(buyerPhone)!}><Phone className="size-3.5 mr-1" /> Call</a>
                </Button>
                <Button size="sm" asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <a href={waLink(buyerPhone, waMsgText)!} target="_blank" rel="noreferrer">
                    <MessageSquare className="size-3.5 mr-1" /> WhatsApp
                  </a>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
      {r.status !== "pending" && buyerPhone && (
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline" asChild>
            <a href={telLink(buyerPhone)!}><Phone className="size-3.5 mr-1" /> Call buyer</a>
          </Button>
          <Button size="sm" asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <a href={waLink(buyerPhone, waMsgText)!} target="_blank" rel="noreferrer">
              <MessageSquare className="size-3.5 mr-1" /> WhatsApp
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}

function SentCard({ r }: { r: any }) {
  const farmerPhone = r.farmer?.phone;
  const waMsgText = `Hi, I sent an interest request for ${r.listing?.product_name ?? "your listing"} on AgriConnect.`;
  return (
    <div className="rounded-2xl bg-card ring-1 ring-border p-4">
      <div className="flex items-start gap-3">
        {r.listing?.photo_url && <img src={r.listing.photo_url} alt="" className="size-14 rounded-lg object-cover" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold">{r.listing?.product_name ?? "Listing"}</p>
            {statusPill(r.status)}
          </div>
          <p className="text-xs text-muted-foreground">Farmer: {r.farmer?.name ?? "—"} · {r.farmer?.district ?? ""}</p>
        </div>
      </div>
      {r.farmer_response && (
        <p className="mt-2 text-xs bg-brand-cream/60 rounded-lg p-2"><strong>Farmer replied:</strong> {r.farmer_response}</p>
      )}
      {r.status === "accepted" && farmerPhone && (
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline" asChild>
            <a href={telLink(farmerPhone)!}><Phone className="size-3.5 mr-1" /> Call farmer</a>
          </Button>
          <Button size="sm" asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <a href={waLink(farmerPhone, waMsgText)!} target="_blank" rel="noreferrer">
              <MessageSquare className="size-3.5 mr-1" /> WhatsApp
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
