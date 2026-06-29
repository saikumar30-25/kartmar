import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { rupees } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useEffect, useMemo, useState } from "react";
import { Truck, MapPin, Check, IndianRupee, Star, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  useMyPartnerProfile, useTogglePartnerOnline, usePartnerTrips,
  useAcceptTrip, useUpdateTripStatus, useRequireAuth,
} from "@/lib/queries";

export const Route = createFileRoute("/partner")({
  head: () => ({ meta: [{ title: "Partner dashboard — AgriConnect" }] }),
  component: () => (
    <AppShell>
      <Partner />
    </AppShell>
  ),
});

function Partner() {
  const { user } = useRequireAuth();
  const { data: profile, isLoading: loadingProfile } = useMyPartnerProfile();
  const { data: trips = [], isLoading: loadingTrips } = usePartnerTrips();
  const toggleOnline = useTogglePartnerOnline();
  const acceptTrip = useAcceptTrip();
  const updateStatus = useUpdateTripStatus();
  const [seenOfferIds, setSeenOfferIds] = useState<Set<string>>(new Set());
  const [activeOffer, setActiveOffer] = useState<string | null>(null);

  const offered = useMemo(() => trips.filter((t) => t.status === "offered" && !t.partner_id), [trips]);
  const mine = useMemo(() => trips.filter((t) => t.partner_id === user?.id), [trips, user]);

  // Realtime new-offer notification toast
  useEffect(() => {
    if (!profile?.is_online) return;
    offered.forEach((t) => {
      if (!seenOfferIds.has(t.id)) {
        toast.message("New booking request", {
          description: `${t.pickup_district} → ${t.drop_district} · ${t.distance_km ?? 0}km`,
          action: { label: "View", onClick: () => setActiveOffer(t.id) },
        });
      }
    });
    setSeenOfferIds(new Set(offered.map((t) => t.id)));
  }, [offered, profile?.is_online]); // eslint-disable-line react-hooks/exhaustive-deps

  const monthly = mine.filter((t) => t.status === "delivered");
  const earnings = monthly.reduce((sum, t) => sum + Number(t.fare_paise), 0);
  const activeOfferTrip = trips.find((t) => t.id === activeOffer);

  if (loadingProfile) return <div className="py-20 grid place-items-center"><Loader2 className="size-6 animate-spin" /></div>;

  if (!profile) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <Truck className="size-10 mx-auto text-brand-clay" />
        <h1 className="text-3xl font-extrabold mt-3">Become a partner</h1>
        <p className="text-sm text-muted-foreground mt-2">Register your vehicle to start accepting delivery trips.</p>
        <Link to="/partner/register" className="mt-6 inline-block rounded-xl gradient-accent text-white px-5 py-3 text-sm font-extrabold shadow-bold">
          Register now
        </Link>
      </div>
    );
  }

  const isApproved = profile.verification_status === "approved";
  const isRejected = profile.verification_status === "rejected";


  const handleOnline = (v: boolean) => {
    if (!user) return;
    if (!isApproved) {
      toast.error("You can go online only after admin approves your documents.");
      return;
    }
    toggleOnline.mutate({ id: user.id, is_online: v });
  };

  const accept = async (tripId: string) => {
    if (!user) return;
    if (!isApproved) {
      toast.error("Your account is awaiting verification. You'll be able to accept trips after approval.");
      return;
    }
    try {
      await acceptTrip.mutateAsync({ id: tripId, partner_id: user.id });
      toast.success("Trip accepted. Customer notified.");
      setActiveOffer(null);
    } catch (e: any) {
      toast.error(e.message || "Already taken");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-moss">Delivery partner</p>
          <h1 className="font-serif italic text-4xl text-brand-green mt-1">Driver dashboard</h1>
        </div>
        <label className="flex items-center gap-3 rounded-full bg-card ring-1 ring-border px-4 py-2">
          <span className={`size-2.5 rounded-full ${profile.is_online ? "bg-emerald-500" : "bg-stone-300"}`} />
          <span className="text-sm font-semibold">{profile.is_online ? "Online" : "Offline"}</span>
          <Switch checked={!!profile.is_online} onCheckedChange={handleOnline} />
        </label>
      </header>

      <section className="grid sm:grid-cols-3 gap-3">
        <Stat icon={Truck} label="Delivered trips" value={`${monthly.length}`} />
        <Stat icon={IndianRupee} label="Earnings" value={rupees(earnings)} />
        <Stat icon={Star} label="Rating" value={`${Number(profile.rating ?? 5).toFixed(1)} ★`} />
      </section>

      <section>
        <h2 className="font-serif italic text-2xl text-brand-green mb-4">
          Open requests {offered.length > 0 && <span className="text-sm text-brand-clay font-sans not-italic">({offered.length} live)</span>}
        </h2>
        {loadingTrips ? (
          <div className="py-10 grid place-items-center"><Loader2 className="size-5 animate-spin" /></div>
        ) : offered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open requests right now. {profile.is_online ? "We'll notify you instantly." : "Go online to receive requests."}</p>
        ) : (
          <div className="rounded-2xl bg-card ring-1 ring-border divide-y divide-border overflow-hidden">
            {offered.map((t) => (
              <button key={t.id} onClick={() => setActiveOffer(t.id)} className="w-full p-4 flex items-center gap-4 hover:bg-brand-cream/50 text-left">
                <div className="size-12 rounded-xl bg-brand-clay/15 text-brand-clay grid place-items-center"><Truck className="size-5" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{t.distance_km ?? 0}km · {t.pickup_district} → {t.drop_district}</p>
                  <p className="text-xs text-muted-foreground">Posted {new Date(t.created_at).toLocaleTimeString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-rupee">{rupees(Number(t.fare_paise))}</p>
                  <p className="text-[10px] text-brand-clay font-bold uppercase">Accept →</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-serif italic text-2xl text-brand-green mb-4">My trips</h2>
        {mine.length === 0 ? (
          <p className="text-sm text-muted-foreground">No trips yet.</p>
        ) : (
          <div className="rounded-2xl bg-card ring-1 ring-border divide-y divide-border overflow-hidden">
            {mine.map((t) => (
              <div key={t.id} className="p-4 flex items-center gap-4 flex-wrap">
                <div className="size-12 rounded-xl bg-brand-moss/15 text-brand-moss grid place-items-center"><Truck className="size-5" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{t.distance_km ?? 0}km · {t.pickup_district} → {t.drop_district}</p>
                  <p className="text-xs text-muted-foreground capitalize">{t.status.replaceAll("_", " ")}</p>
                </div>
                <p className="font-bold text-sm text-rupee">{rupees(Number(t.fare_paise))}</p>
                <NextActionButton tripId={t.id} status={t.status} onUpdate={(s) => updateStatus.mutate({ id: t.id, status: s })} pending={updateStatus.isPending} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-card ring-1 ring-border p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-moss">Verification</p>
        <p className="mt-1 font-semibold">{profile.total_trips > 0 ? "All documents verified" : "Pending verification"}</p>
        <p className="text-xs text-muted-foreground mt-1">Vehicle: {profile.vehicle_type} · {profile.vehicle_number ?? "—"}</p>
        <Link to="/partner/register" className="mt-3 inline-block text-xs font-bold text-brand-clay">Update documents →</Link>
      </section>

      <Dialog open={!!activeOfferTrip} onOpenChange={(o) => !o && setActiveOffer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New booking request</DialogTitle>
            <DialogDescription>
              {activeOfferTrip && `$${activeOfferTrip.distance_km ?? 0}km trip`}
            </DialogDescription>
          </DialogHeader>
          {activeOfferTrip && (
            <div className="space-y-3 text-sm">
              <Row icon={MapPin} label="Pickup" value={activeOfferTrip.pickup_district} />
              <Row icon={MapPin} label="Delivery" value={activeOfferTrip.drop_district} />
              <div className="rounded-xl bg-brand-cream p-3 flex justify-between">
                <span className="text-xs text-muted-foreground">Estimated fare</span>
                <span className="font-bold text-rupee">{rupees(Number(activeOfferTrip.fare_paise))}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveOffer(null)} className="flex-1">Skip</Button>
            <Button
              onClick={() => activeOfferTrip && accept(activeOfferTrip.id)}
              disabled={acceptTrip.isPending}
              className="flex-1 bg-brand-green text-brand-cream"
            >
              <Check className="size-4 mr-1.5" /> {acceptTrip.isPending ? "Accepting…" : "Accept trip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NextActionButton({ status, onUpdate, pending }: { tripId: string; status: string; onUpdate: (s: any) => void; pending: boolean }) {
  if (status === "accepted") return <Button size="sm" disabled={pending} onClick={() => onUpdate("picked_up")} className="bg-brand-clay text-white">Mark picked up</Button>;
  if (status === "picked_up") return <Button size="sm" disabled={pending} onClick={() => onUpdate("in_transit")} className="bg-brand-clay text-white">Start trip</Button>;
  if (status === "in_transit") return <Button size="sm" disabled={pending} onClick={() => onUpdate("delivered")} className="bg-brand-green text-brand-cream">Mark delivered</Button>;
  return null;
}

function Stat({ icon: Icon, label, value }: { icon: typeof Truck; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card ring-1 ring-border p-5">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <Icon className="size-3.5 text-brand-clay" /> {label}
      </div>
      <p className="mt-2 text-2xl font-bold text-rupee">{value}</p>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="size-4 text-brand-moss mt-0.5" />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}
