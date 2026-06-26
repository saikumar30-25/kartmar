import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { deals, trips } from "@/lib/mock-data";
import { rupees } from "@/lib/format";
import { DealStatus } from "./home";
import { Button } from "@/components/ui/button";
import { Check, Truck, IndianRupee, AlertTriangle, Star } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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
  const deal = deals.find((d) => d.id === id);
  const trip = trips.find((t) => t.dealId === id);
  const [showPay, setShowPay] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [showRate, setShowRate] = useState(false);

  if (!deal) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Deal not found</p>
        <Link to="/deals" className="mt-4 inline-block text-brand-clay font-semibold">Back to deals</Link>
      </div>
    );
  }

  const stepIndex =
    deal.status === "confirmed" ? 0
      : deal.status === "paid" ? 1
      : deal.status === "in_transit" ? 3
      : deal.status === "delivered" || deal.status === "completed" ? 4
      : 0;

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/deals" className="text-xs font-bold uppercase tracking-wider text-brand-clay">← Back to deals</Link>
      <div className="mt-3 flex items-start gap-4 flex-wrap">
        <img src={deal.photo} alt="" className="size-20 rounded-2xl object-cover ring-1 ring-border" />
        <div className="flex-1 min-w-0">
          <h1 className="font-serif italic text-3xl text-brand-green">{deal.quantity}{deal.unit} {deal.productName}</h1>
          <p className="text-sm text-muted-foreground mt-1">{deal.farmerName} → {deal.buyerName}</p>
          <div className="mt-2"><DealStatus status={deal.status} /></div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-brand-green text-rupee">{rupees(deal.totalPaise)}</p>
          <p className="text-xs text-muted-foreground">@ {rupees(deal.agreedPrice)}/{deal.unit}</p>
        </div>
      </div>

      <section className="mt-8 rounded-2xl bg-card ring-1 ring-border p-5">
        <h2 className="font-semibold text-sm mb-4">Delivery progress</h2>
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
          <p className="text-2xl font-bold text-rupee">{rupees(deal.totalPaise)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {deal.status === "confirmed" ? "Pay into escrow to proceed" : "Held in escrow until delivery"}
          </p>
          {deal.status === "confirmed" && (
            <Button onClick={() => setShowPay(true)} className="mt-3 w-full bg-brand-clay text-white font-bold">
              Pay {rupees(deal.totalPaise)} via UPI
            </Button>
          )}
        </div>

        <div className="rounded-2xl bg-card ring-1 ring-border p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Truck className="size-4 text-brand-moss" /> Transport</h3>
          {trip ? (
            <>
              <p className="text-sm font-semibold">{trip.pickup} → {trip.delivery}</p>
              <p className="text-xs text-muted-foreground mt-1">{trip.distanceKm}km · {trip.weightKg}kg · Fare {rupees(trip.farePaise)}</p>
              <Button variant="outline" className="mt-3 w-full">Track driver</Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">No transport booked yet.</p>
              <Button
                onClick={() => {
                  toast.success("Transport request sent to 3 nearby partners.");
                }}
                className="mt-3 w-full bg-brand-green text-brand-cream font-bold"
              >
                Book transport
              </Button>
            </>
          )}
        </div>
      </section>

      <section className="mt-6 flex flex-wrap gap-3">
        {deal.status === "delivered" && (
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

      <Dialog open={showPay} onOpenChange={setShowPay}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay via UPI</DialogTitle>
            <DialogDescription>Mock Razorpay-style payment. No real charge.</DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-brand-cream p-5 text-center">
            <p className="text-xs uppercase text-muted-foreground tracking-widest">Amount</p>
            <p className="text-3xl font-bold text-brand-green text-rupee mt-1">{rupees(deal.totalPaise)}</p>
            <p className="text-xs mt-3 text-muted-foreground">UPI ID: agriconnect@hdfc</p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowPay(false);
                toast.success("Paid into escrow. We'll release to seller after delivery.");
                navigate({ to: "/deals" });
              }}
              className="w-full bg-brand-clay text-white"
            >
              Confirm payment
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
              <option>Wrong product</option>
              <option>Wrong quantity</option>
              <option>Damaged goods</option>
              <option>Did not arrive</option>
            </select>
            <Textarea placeholder="Describe what happened…" rows={4} />
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowDispute(false);
                toast.error("Dispute raised. Admin will review.");
              }}
              variant="destructive"
              className="w-full"
            >
              Submit dispute
            </Button>
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
            <Button
              onClick={() => {
                setShowRate(false);
                toast.success("Payment released to seller. Thank you!");
                navigate({ to: "/deals" });
              }}
              className="w-full bg-brand-green text-brand-cream"
            >
              Release payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
