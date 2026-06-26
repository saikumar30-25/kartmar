import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { requirements } from "@/lib/mock-data";
import { rupees, relativeDays } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Sparkles, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/requirements/$id")({
  head: () => ({ meta: [{ title: "Requirement — AgriConnect" }] }),
  component: () => (
    <AppShell>
      <Detail />
    </AppShell>
  ),
});

function Detail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const req = requirements.find((r) => r.id === id);
  if (!req) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Requirement not found</p>
        <Link to="/home" className="mt-4 inline-block text-brand-clay font-semibold">Back home</Link>
      </div>
    );
  }
  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-xs font-bold uppercase tracking-widest text-brand-clay">Buyer requirement</p>
      <h1 className="mt-2 font-serif italic text-4xl text-brand-green">
        {req.quantity}{req.unit} {req.productName}
      </h1>
      <div className="mt-3 flex items-baseline gap-3">
        <span className="text-3xl font-bold text-brand-green text-rupee">{rupees(req.offerPrice)}</span>
        <span className="text-sm text-muted-foreground">per {req.unit} offered</span>
      </div>

      <div className="mt-6 rounded-2xl bg-card ring-1 ring-border p-5">
        <p className="font-semibold">{req.buyer.name}</p>
        <p className="text-xs text-muted-foreground">{req.buyer.business} · ★ {req.buyer.rating}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-brand-cream/60 ring-1 ring-border p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <Calendar className="size-3" /> Needed by
            </div>
            <p className="mt-1 font-semibold">{relativeDays(req.requiredBy)}</p>
          </div>
          <div className="rounded-xl bg-brand-cream/60 ring-1 ring-border p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <MapPin className="size-3" /> Distance
            </div>
            <p className="mt-1 font-semibold">{req.distanceKm} km away</p>
          </div>
        </div>
      </div>

      <p className="mt-6 text-sm text-muted-foreground leading-relaxed">{req.description}</p>

      <div className="mt-8 grid gap-3">
        <Button
          onClick={() => {
            toast.success("Bargain started — buyer will see your offer.");
            navigate({ to: "/deals" });
          }}
          className="h-12 bg-brand-clay text-white font-bold"
        >
          <Sparkles className="size-4 mr-2" /> Start AI Bargaining
        </Button>
        <a
          href={`https://wa.me/919876543210?text=${encodeURIComponent(`Hi, I can supply ${req.productName}.`)}`}
          target="_blank"
          rel="noreferrer"
          className="h-12 grid place-items-center rounded-md bg-emerald-600 text-white text-sm font-bold"
        >
          <MessageSquare className="size-4 inline mr-1.5" /> Message buyer on WhatsApp
        </a>
      </div>
    </div>
  );
}
