import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import {
  useDeal, useDealRealtime, useDealMessages, useSendDealMessage,
  useUpdateDealStatus, useTripForDeal, useCreateTrip, useRequireAuth,
} from "@/lib/queries";
import { rupees } from "@/lib/format";
import { DealStatus } from "./home";
import { Button } from "@/components/ui/button";
import { Check, Truck, IndianRupee, AlertTriangle, Star, Send, Loader2, MessageSquare, Phone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/deals/$id")({
  head: () => ({ meta: [{ title: "Deal — AgriConnect" }] }),
  component: () => (
    <AppShell>
      <Detail />
    </AppShell>
  ),
});

const STEPS = ["Confirmed", "Paid · escrow", "Driver assigned", "In transit", "Delivered"] as const;

function Detail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useRequireAuth();
  const { data: deal, isLoading } = useDeal(id);
  useDealRealtime(id);
  const { data: messages = [] } = useDealMessages(id);
  const sendMsg = useSendDealMessage();
  const updateStatus = useUpdateDealStatus();
  const { data: trip } = useTripForDeal(id);
  const createTrip = useCreateTrip();
  const [showPay, setShowPay] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [showRate, setShowRate] = useState(false);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  if (isLoading) return <div className="py-20 grid place-items-center"><Loader2 className="size-6 animate-spin" /></div>;
  if (!deal) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Deal not found</p>
        <Link to="/deals" className="mt-4 inline-block text-brand-clay font-semibold">Back to deals</Link>
      </div>
    );
  }

  const stepIndex =
    deal.status === "pending_payment" ? 0
      : deal.status === "paid" ? 1
      : deal.status === "in_transit" ? 3
      : deal.status === "delivered" || deal.status === "completed" ? 4
      : 0;

  const isBuyer = user?.id === deal.buyer_id;
  const isFarmer = user?.id === deal.farmer_id;

  const handleSend = async () => {
    if (!user || !draft.trim()) return;
    const role = isFarmer ? "farmer" : isBuyer ? "buyer" : "user";
    await sendMsg.mutateAsync({ deal_id: deal.id, sender_id: user.id, sender_role: role, message: draft.trim() });
    setDraft("");
  };

  const bookTransport = async () => {
    try {
      await createTrip.mutateAsync({
        deal_id: deal.id,
        pickup_district: deal.pickup_district ?? "",
        drop_district: deal.drop_district ?? "",
        distance_km: 0,
        fare_paise: Math.max(50000, Math.round(Number(deal.total_paise) * 0.05)),
        status: "offered",
      });
      toast.success("Transport request broadcast to nearby drivers.");
    } catch (e: any) {
      toast.error(e.message || "Failed to book transport");
    }
  };

  const pay = async () => {
    try {
      await updateStatus.mutateAsync({ id: deal.id, status: "paid" });
      toast.success("Paid into escrow. Released to seller after delivery.");
      setShowPay(false);
    } catch (e: any) {
      toast.error(e.message || "Payment failed");
    }
  };

  const release = async () => {
    try {
      await updateStatus.mutateAsync({ id: deal.id, status: "completed" });
      toast.success("Payment released. Thank you!");
      setShowRate(false);
      navigate({ to: "/deals" });
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  };

  const raiseDispute = async () => {
    try {
      await updateStatus.mutateAsync({ id: deal.id, status: "disputed" });
      toast.error("Dispute raised. Admin will review.");
      setShowDispute(false);
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/deals" className="text-xs font-bold uppercase tracking-wider text-brand-clay">← Back to deals</Link>
      <div className="mt-3 flex items-start gap-4 flex-wrap">
        {deal.photo_url ? (
          <img src={deal.photo_url} alt="" className="size-20 rounded-2xl object-cover ring-1 ring-border" />
        ) : (
          <div className="size-20 rounded-2xl bg-brand-moss/15" />
        )}
        <div className="flex-1 min-w-0">
          <h1 className="font-serif italic text-3xl text-brand-green">{Number(deal.quantity)}{deal.unit} {deal.product_name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{deal.pickup_district} → {deal.drop_district}</p>
          <div className="mt-2"><DealStatus status={deal.status} /></div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-brand-green text-rupee">{rupees(Number(deal.total_paise))}</p>
          <p className="text-xs text-muted-foreground">@ {rupees(Number(deal.agreed_price_paise))}/{deal.unit}</p>
        </div>
      </div>

      <section className="mt-8 rounded-2xl bg-card ring-1 ring-border p-5">
        <h2 className="font-semibold text-sm mb-4">Delivery progress (live)</h2>
        <ol className="space-y-3">
          {STEPS.map((label, i) => {
            const done = i <= stepIndex;
            return (
              <li key={label} className="flex items-center gap-3">
                <div className={`size-7 rounded-full grid place-items-center ${done ? "bg-brand-green text-brand-cream" : "bg-stone-100 text-muted-foreground"}`}>
                  {done ? <Check className="size-3.5" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                </div>
                <span className={`text-sm ${done ? "font-semibold" : "text-muted-foreground"}`}>{label}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="mt-6 grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-card ring-1 ring-border p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><IndianRupee className="size-4 text-brand-clay" /> Payment</h3>
          <p className="text-2xl font-bold text-rupee">{rupees(Number(deal.total_paise))}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {deal.status === "pending_payment" ? "Pay into escrow to proceed" : "Held in escrow until delivery"}
          </p>
          {deal.status === "pending_payment" && isBuyer && (
            <Button onClick={() => setShowPay(true)} className="mt-3 w-full bg-brand-clay text-white font-bold">
              Pay {rupees(Number(deal.total_paise))} via UPI
            </Button>
          )}
        </div>

        <div className="rounded-2xl bg-card ring-1 ring-border p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Truck className="size-4 text-brand-moss" /> Transport</h3>
          {trip ? (
            <>
              <p className="text-sm font-semibold">{trip.pickup_district} → {trip.drop_district}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {trip.distance_km ?? 0}km · Fare {rupees(Number(trip.fare_paise))} · <span className="capitalize">{trip.status.replaceAll("_", " ")}</span>
              </p>
              {trip.status === "offered" && <p className="mt-2 text-xs text-brand-clay">Waiting for a driver to accept…</p>}
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">No transport booked yet.</p>
              {deal.status === "paid" && (
                <Button onClick={bookTransport} disabled={createTrip.isPending} className="mt-3 w-full bg-brand-green text-brand-cream font-bold">
                  {createTrip.isPending ? "Booking…" : "Book transport"}
                </Button>
              )}
            </>
          )}
        </div>
      </section>

      <ContactCard deal={deal} trip={trip} viewerId={user?.id} />



      <section className="mt-6 flex flex-wrap gap-3">
        {deal.status === "delivered" && isBuyer && (
          <>
            <Button onClick={() => setShowRate(true)} className="bg-brand-green text-brand-cream">
              <Check className="size-4 mr-1.5" /> Confirm receipt & release payment
            </Button>
            <Button variant="outline" onClick={() => setShowDispute(true)}>
              <AlertTriangle className="size-4 mr-1.5" /> Raise dispute
            </Button>
          </>
        )}
      </section>

      {/* Realtime chat */}
      <section className="mt-8 rounded-2xl bg-card ring-1 ring-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="font-semibold text-sm">Chat (live)</h2>
        </div>
        <div ref={scrollRef} className="max-h-80 overflow-y-auto p-4 space-y-3 bg-brand-cream/30">
          {messages.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No messages yet. Say hi 👋</p>}
          {messages.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-brand-green text-brand-cream" : "bg-card ring-1 ring-border"}`}>
                  <p className="text-[10px] opacity-70 uppercase tracking-wider mb-0.5">{m.sender_role}</p>
                  <p>{m.message}</p>
                </div>
              </div>
            );
          })}
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2 p-3 border-t border-border"
        >
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message…" className="bg-card" />
          <Button type="submit" disabled={!draft.trim() || sendMsg.isPending} className="bg-brand-clay text-white">
            <Send className="size-4" />
          </Button>
        </form>
      </section>

      <Dialog open={showPay} onOpenChange={setShowPay}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay via UPI</DialogTitle>
            <DialogDescription>Mock Razorpay-style payment. No real charge.</DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-brand-cream p-5 text-center">
            <p className="text-xs uppercase text-muted-foreground tracking-widest">Amount</p>
            <p className="text-3xl font-bold text-brand-green text-rupee mt-1">{rupees(Number(deal.total_paise))}</p>
            <p className="text-xs mt-3 text-muted-foreground">UPI ID: agriconnect@hdfc</p>
          </div>
          <DialogFooter>
            <Button onClick={pay} disabled={updateStatus.isPending} className="w-full bg-brand-clay text-white">
              {updateStatus.isPending ? "Processing…" : "Confirm payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDispute} onOpenChange={setShowDispute}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raise a dispute</DialogTitle>
            <DialogDescription>Payment stays in escrow until our team reviews within 48 hours.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <select className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm">
              <option>Wrong product</option><option>Wrong quantity</option><option>Damaged goods</option><option>Did not arrive</option>
            </select>
            <Textarea placeholder="Describe what happened…" rows={4} />
          </div>
          <DialogFooter>
            <Button onClick={raiseDispute} variant="destructive" className="w-full">Submit dispute</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRate} onOpenChange={setShowRate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate this delivery</DialogTitle>
            <DialogDescription>Helps other buyers know what to expect.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center gap-2 py-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} className="size-10 rounded-full hover:bg-brand-clay/15 grid place-items-center text-brand-clay">
                <Star className="size-6 fill-brand-clay" />
              </button>
            ))}
          </div>
          <Textarea placeholder="Optional comment" />
          <DialogFooter>
            <Button onClick={release} className="w-full bg-brand-green text-brand-cream">Release payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type Contact = { id: string; name: string; phone: string | null } | null | undefined;

function ContactCard({
  deal,
  trip,
  viewerId,
}: {
  deal: { farmer: Contact; buyer: Contact; product_name: string };
  trip: { partner: Contact } | null | undefined;
  viewerId: string | undefined;
}) {
  const others: Array<{ role: string; contact: Contact }> = [];
  if (deal.farmer && deal.farmer.id !== viewerId) others.push({ role: "Farmer", contact: deal.farmer });
  if (deal.buyer && deal.buyer.id !== viewerId) others.push({ role: "Buyer", contact: deal.buyer });
  if (trip?.partner && trip.partner.id !== viewerId) others.push({ role: "Delivery partner", contact: trip.partner });

  if (others.length === 0) return null;

  return (
    <section className="mt-6 rounded-2xl bg-card ring-1 ring-border p-5">
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <MessageSquare className="size-4 text-emerald-600" /> Direct contacts
      </h3>
      <div className="grid sm:grid-cols-2 gap-3">
        {others.map(({ role, contact }) => {
          if (!contact) return null;
          const waMsg = `Hi ${contact.name}, regarding our AgriConnect deal for ${deal.product_name}.`;
          const wa = waLink(contact.phone, waMsg);
          const tel = telLink(contact.phone);
          return (
            <div key={contact.id} className="rounded-xl bg-brand-cream/60 ring-1 ring-border p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{role}</p>
              <p className="mt-0.5 font-semibold">{contact.name}</p>
              {wa ? (
                <div className="mt-2 flex gap-2">
                  <a
                    href={wa}
                    target="_blank" rel="noreferrer"
                    className="flex-1 text-center rounded-lg bg-emerald-600 text-white py-1.5 text-xs font-bold"
                  >
                    <MessageSquare className="size-3.5 inline mr-1" /> WhatsApp
                  </a>
                  <a
                    href={tel!}
                    className="rounded-lg ring-1 ring-border bg-card px-3 py-1.5 text-xs font-bold"
                  >
                    <Phone className="size-3.5 inline" />
                  </a>
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">No phone on file</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

