import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { listings } from "@/lib/mock-data";
import { rupees, relativeDays } from "@/lib/format";
import { FreshnessBadge, GradeBadge } from "@/components/FreshnessBadge";
import { BargainChat } from "@/components/BargainChat";
import { Button } from "@/components/ui/button";
import { Sparkles, MapPin, Calendar, Phone, MessageSquare } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
  const navigate = useNavigate();
  const listing = listings.find((l) => l.id === id);
  const [bargaining, setBargaining] = useState(false);
  const [confirmedPrice, setConfirmedPrice] = useState<number | null>(null);

  if (!listing) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Listing not found</p>
        <Link to="/browse" className="mt-4 inline-block text-brand-clay font-semibold">Back to browse</Link>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div>
        <div className="rounded-3xl overflow-hidden ring-1 ring-border bg-card">
          <img src={listing.photo} alt={listing.productName} className="w-full aspect-[4/3] object-cover" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <GradeBadge grade={listing.qualityGrade} />
          <FreshnessBadge availableUntil={listing.availableUntil} />
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-clay/15 text-brand-clay px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="size-3" /> AI freshness {listing.freshnessScore}/10
          </span>
        </div>

        <div className="mt-6 rounded-2xl bg-card ring-1 ring-border p-5">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-full bg-brand-moss/15 text-brand-green font-bold grid place-items-center">
              {listing.farmer.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{listing.farmer.name}</p>
              <p className="text-xs text-muted-foreground">★ {listing.farmer.rating} · {listing.farmer.village}</p>
            </div>
            <Button variant="outline" size="sm"><Phone className="size-3.5 mr-1" /> Call</Button>
          </div>
          <a
            href={`https://wa.me/919876543210?text=${encodeURIComponent(`Hi, interested in your ${listing.productName} listing on AgriConnect.`)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 w-full block text-center rounded-lg bg-emerald-600 text-white py-2.5 text-sm font-bold"
          >
            <MessageSquare className="size-4 inline mr-1.5" /> Message on WhatsApp
          </a>
        </div>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-moss capitalize">{listing.category}</p>
        <h1 className="mt-2 font-serif italic text-4xl text-brand-green">
          {listing.productName}
          {listing.telugu && <span className="text-2xl text-muted-foreground ml-2 not-italic font-normal">{listing.telugu}</span>}
        </h1>

        <div className="mt-5 flex items-baseline gap-3">
          <span className="text-4xl font-bold text-brand-green text-rupee">{rupees(listing.displayPrice)}</span>
          <span className="text-sm text-muted-foreground">per {listing.unit}</span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <Info icon={Calendar} label="Available until" value={relativeDays(listing.availableUntil)} />
          <Info icon={MapPin} label="Distance" value={`${listing.distanceKm} km away`} />
          <Info icon={Sparkles} label="Total available" value={`${listing.quantity} ${listing.unit}`} />
          <Info icon={Calendar} label="Harvested" value={relativeDays(listing.harvestedAt).replace("ago", "")} />
        </div>

        <p className="mt-6 text-sm text-muted-foreground leading-relaxed">{listing.description}</p>

        {!bargaining && !confirmedPrice && (
          <Button
            onClick={() => setBargaining(true)}
            className="mt-8 w-full h-14 text-base bg-brand-clay hover:bg-brand-clay/90 text-white font-bold shadow-lg shadow-brand-clay/20"
          >
            <Sparkles className="size-5 mr-2" /> Start AI Bargaining
          </Button>
        )}

        {bargaining && !confirmedPrice && (
          <div className="mt-6">
            <BargainChat
              listing={listing}
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
                {listing.quantity}{listing.unit} of {listing.productName} at <strong>{rupees(confirmedPrice ?? 0)}/{listing.unit}</strong>.
                Total: <strong className="text-rupee">{rupees((confirmedPrice ?? 0) * listing.quantity)}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-xl bg-brand-cream p-4 text-sm">
              <p className="font-semibold mb-2">Next steps:</p>
              <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                <li>Pay into escrow via UPI</li>
                <li>Book transport from the deal page</li>
                <li>Confirm delivery to release payment to {listing.farmer.name}</li>
              </ol>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  toast.success("Deal saved. Open deals to continue.");
                  navigate({ to: "/deals" });
                }}
                className="bg-brand-green text-brand-cream w-full"
              >
                Continue to deal page
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
