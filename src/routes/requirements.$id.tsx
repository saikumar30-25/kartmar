import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useRequirement, useCreateDeal, useRequireAuth } from "@/lib/queries";
import { rupees } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Sparkles, MessageSquare, Loader2 } from "lucide-react";
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
  const { user } = useRequireAuth();
  const { data: req, isLoading } = useRequirement(id);
  const createDeal = useCreateDeal();

  if (isLoading) return <div className="py-20 grid place-items-center"><Loader2 className="size-6 animate-spin" /></div>;
  if (!req) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Requirement not found</p>
        <Link to="/home" className="mt-4 inline-block text-brand-clay font-semibold">Back home</Link>
      </div>
    );
  }

  const offer = Number(req.target_price_paise ?? 0);
  const buyer = (req as any).buyer;

  const startBargain = async () => {
    if (!user) return;
    try {
      const deal = await createDeal.mutateAsync({
        farmer_id: user.id,
        buyer_id: req.buyer_id,
        product_name: req.product_name,
        quantity: req.quantity,
        unit: req.unit,
        agreed_price_paise: offer,
        total_paise: offer * Number(req.quantity),
        pickup_district: user.district ?? "",
        drop_district: req.district,
        status: "pending_payment",
      });
      toast.success("Bargain started. Buyer notified.");
      navigate({ to: "/deals/$id", params: { id: deal.id } });
    } catch (err: any) {
      toast.error(err.message || "Failed");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-xs font-bold uppercase tracking-widest text-brand-clay">Buyer requirement</p>
      <h1 className="mt-2 font-serif italic text-4xl text-brand-green">
        {Number(req.quantity)}{req.unit} {req.product_name}
      </h1>
      <div className="mt-3 flex items-baseline gap-3">
        <span className="text-3xl font-bold text-brand-green text-rupee">{offer ? rupees(offer) : "—"}</span>
        <span className="text-sm text-muted-foreground">per {req.unit} offered</span>
      </div>

      <div className="mt-6 rounded-2xl bg-card ring-1 ring-border p-5">
        <p className="font-semibold">{buyer?.name ?? "Buyer"}</p>
        <p className="text-xs text-muted-foreground">★ {Number(buyer?.rating ?? 5).toFixed(1)} · {buyer?.district}, {buyer?.state}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-brand-cream/60 ring-1 ring-border p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <Calendar className="size-3" /> Needed by
            </div>
            <p className="mt-1 font-semibold">{req.needed_by ?? "Flexible"}</p>
          </div>
          <div className="rounded-xl bg-brand-cream/60 ring-1 ring-border p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <MapPin className="size-3" /> Location
            </div>
            <p className="mt-1 font-semibold">{req.district}, {req.state}</p>
          </div>
        </div>
      </div>

      {req.notes && <p className="mt-6 text-sm text-muted-foreground leading-relaxed">{req.notes}</p>}

      <div className="mt-8 grid gap-3">
        <Button onClick={startBargain} disabled={createDeal.isPending} className="h-12 bg-brand-clay text-white font-bold">
          <Sparkles className="size-4 mr-2" /> {createDeal.isPending ? "Starting…" : "Start AI Bargaining"}
        </Button>
        {buyer?.phone && (
          <a
            href={`https://wa.me/${String(buyer.phone).replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I can supply ${req.product_name}.`)}`}
            target="_blank" rel="noreferrer"
            className="h-12 grid place-items-center rounded-md bg-emerald-600 text-white text-sm font-bold"
          >
            <MessageSquare className="size-4 inline mr-1.5" /> Message buyer on WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
