import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useListing, useCreateDeal, useRequireAuth, useCreateInterest } from "@/lib/queries";
import { rupees } from "@/lib/format";
import { GradeBadge } from "@/components/FreshnessBadge";
import { BargainChat } from "@/components/BargainChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, MapPin, Calendar, Phone, MessageSquare, Loader2, HandHeart } from "lucide-react";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/listings/$id")({
  head: () => ({ meta: [{ title: "Listing — AgriConnect" }] }),
  component: () => (
    <AppShell>
      <Detail />
    </AppShell>
  ),
});

function Detail() {
  const { id } = Route.useParams();
  const { user } = useRequireAuth();
  const navigate = useNavigate();
  const { data: listing, isLoading } = useListing(id);
  const createDeal = useCreateDeal();
  const createInterest = useCreateInterest();
  const [bargaining, setBargaining] = useState(false);
  const [confirmedPrice, setConfirmedPrice] = useState<number | null>(null);
  const [interestOpen, setInterestOpen] = useState(false);
  const [iMsg, setIMsg] = useState("");
  const [iQty, setIQty] = useState("");
  const [iOffer, setIOffer] = useState("");

  if (isLoading) return <div className="py-20 grid place-items-center"><Loader2 className="size-6 animate-spin" /></div>;
  if (!listing) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Listing not found</p>
        <Link to="/browse" className="mt-4 inline-block text-brand-clay font-semibold">Back to browse</Link>
      </div>
    );
  }

  const farmer = (listing as any).farmer;
  const displayPrice = Number(listing.price_paise);
  const floorPrice = Number(listing.min_price_paise ?? Math.round(displayPrice * 0.78));
  const acceptPrice = Math.round((displayPrice + floorPrice) / 2);

  const handleConfirm = async () => {
    if (!user || confirmedPrice == null) return;
    const total = confirmedPrice * Number(listing.quantity);
    try {
      const deal = await createDeal.mutateAsync({
        listing_id: listing.id,
        farmer_id: listing.farmer_id,
        buyer_id: user.id,
        product_name: listing.product_name,
        photo_url: listing.photo_url,
        quantity: listing.quantity,
        unit: listing.unit,
        agreed_price_paise: confirmedPrice,
        total_paise: total,
        pickup_district: listing.district,
        drop_district: user.district,
      });
      toast.success("Deal created");
      navigate({ to: "/deals/$id", params: { id: deal.id } });
    } catch (e: any) {
      toast.error(e.message || "Failed to create deal");
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div>
        <div className="rounded-3xl overflow-hidden ring-1 ring-border bg-card">
          {listing.photo_url ? (
            <img src={listing.photo_url} alt={listing.product_name} className="w-full aspect-[4/3] object-cover" />
          ) : (
            <div className="w-full aspect-[4/3] bg-brand-moss/15 grid place-items-center text-brand-green">No photo</div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <GradeBadge grade={listing.quality_grade} />
        </div>

        <div className="mt-6 rounded-2xl bg-card ring-1 ring-border p-5">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-full bg-brand-moss/15 text-brand-green font-bold grid place-items-center">
              {(farmer?.name ?? "F").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{farmer?.name ?? "Farmer"}</p>
              <p className="text-xs text-muted-foreground">★ {Number(farmer?.rating ?? 5).toFixed(1)} · {farmer?.district}, {farmer?.state}</p>
            </div>
            {farmer?.phone && (
              <Button variant="outline" size="sm" asChild>
                <a href={`tel:${farmer.phone}`}><Phone className="size-3.5 mr-1" /> Call</a>
              </Button>
            )}
          </div>
          {farmer?.phone && (
            <a
              href={`https://wa.me/${String(farmer.phone).replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, interested in your ${listing.product_name} listing on AgriConnect.`)}`}
              target="_blank" rel="noreferrer"
              className="mt-3 w-full block text-center rounded-lg bg-emerald-600 text-white py-2.5 text-sm font-bold"
            >
              <MessageSquare className="size-4 inline mr-1.5" /> WhatsApp
            </a>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-moss capitalize">{listing.category}</p>
        <h1 className="mt-2 font-serif italic text-4xl text-brand-green">{listing.product_name}</h1>

        <div className="mt-5 flex items-baseline gap-3">
          <span className="text-4xl font-bold text-brand-green text-rupee">{rupees(displayPrice)}</span>
          <span className="text-sm text-muted-foreground">per {listing.unit}</span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <Info icon={Calendar} label="Available until" value={listing.available_until ?? "—"} />
          <Info icon={MapPin} label="Location" value={`${listing.district}, ${listing.state}`} />
          <Info icon={Sparkles} label="Total available" value={`${listing.quantity} ${listing.unit}`} />
          <Info icon={Calendar} label="Harvested" value={listing.harvest_date ?? "—"} />
        </div>

        {listing.description && <p className="mt-6 text-sm text-muted-foreground leading-relaxed">{listing.description}</p>}

        {!bargaining && !confirmedPrice && user?.id !== listing.farmer_id && (
          <Button
            onClick={() => setBargaining(true)}
            className="mt-8 w-full h-14 text-base bg-brand-clay hover:bg-brand-clay/90 text-white font-bold shadow-lg shadow-brand-clay/20"
          >
            <Sparkles className="size-5 mr-2" /> Start AI Bargaining
          </Button>
        )}

        {user?.id === listing.farmer_id && (
          <p className="mt-8 rounded-xl bg-brand-cream p-4 text-sm text-muted-foreground text-center">This is your listing.</p>
        )}

        {bargaining && !confirmedPrice && (
          <div className="mt-6">
            <BargainChat
              listing={{
                id: listing.id,
                productName: listing.product_name,
                unit: listing.unit,
                quantity: Number(listing.quantity),
                displayPrice,
                acceptPrice,
                floorPrice,
                farmerName: farmer?.name ?? "Farmer",
              }}
              onAccept={(price) => {
                setConfirmedPrice(price);
                setBargaining(false);
              }}
            />
          </div>
        )}

        <Dialog open={confirmedPrice !== null} onOpenChange={(o) => !o && setConfirmedPrice(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif italic text-2xl text-brand-green">Deal confirmed!</DialogTitle>
              <DialogDescription>
                {Number(listing.quantity)}{listing.unit} of {listing.product_name} at <strong>{rupees(confirmedPrice ?? 0)}/{listing.unit}</strong>.
                Total: <strong className="text-rupee">{rupees((confirmedPrice ?? 0) * Number(listing.quantity))}</strong>.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleConfirm} disabled={createDeal.isPending} className="bg-brand-green text-brand-cream w-full">
                {createDeal.isPending ? "Saving…" : "Save deal & continue"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-brand-cream/60 ring-1 ring-border p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <Icon className="size-3" /> {label}
      </div>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
