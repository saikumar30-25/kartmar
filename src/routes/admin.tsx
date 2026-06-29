import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Check, X, AlertTriangle, Users, IndianRupee, Shield, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAllPartners, useReviewPartner } from "@/lib/queries";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — AgriConnect" }] }),
  component: () => (
    <AppShell>
      <Admin />
    </AppShell>
  ),
});

function Admin() {
  const { user } = useAuth();
  const { data: partners = [], isLoading } = useAllPartners();
  const review = useReviewPartner();

  if (user && user.role !== "admin") {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <Shield className="size-10 mx-auto text-brand-clay" />
        <h1 className="text-3xl font-extrabold mt-3">Admin only</h1>
        <p className="text-sm text-muted-foreground mt-2">You need admin access to view this page.</p>
      </div>
    );
  }

  const pending = partners.filter((p) => p.verification_status === "pending");
  const approved = partners.filter((p) => p.verification_status === "approved");
  const rejected = partners.filter((p) => p.verification_status === "rejected");

  const act = async (id: string, status: "approved" | "rejected") => {
    const reason = status === "rejected" ? window.prompt("Reason for rejection (optional):") || undefined : undefined;
    try {
      await review.mutateAsync({ id, status, reason });
      toast.success(status === "approved" ? "Partner approved" : "Partner rejected");
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  };

  return (
    <div className="space-y-8">
      <header className="rounded-3xl gradient-hero text-brand-cream p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-widest opacity-80 flex items-center gap-1.5">
          <Shield className="size-3" /> Admin console
        </p>
        <h1 className="text-4xl font-extrabold mt-1">Platform overview</h1>
      </header>

      <section className="grid sm:grid-cols-4 gap-3">
        <Stat icon={Users} label="Partners" value={`${partners.length}`} />
        <Stat icon={Check} label="Approved" value={`${approved.length}`} />
        <Stat icon={AlertTriangle} label="Pending review" value={`${pending.length}`} />
        <Stat icon={IndianRupee} label="Rejected" value={`${rejected.length}`} />
      </section>

      <section>
        <h2 className="text-2xl font-extrabold mb-4">Pending driver verifications</h2>
        {isLoading ? (
          <div className="py-10 grid place-items-center"><Loader2 className="size-5 animate-spin" /></div>
        ) : pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">No partners awaiting review.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((p) => (
              <PartnerCard key={p.id} p={p} onApprove={() => act(p.id, "approved")} onReject={() => act(p.id, "rejected")} pending={review.isPending} />
            ))}
          </div>
        )}
      </section>

      {approved.length > 0 && (
        <section>
          <h2 className="text-2xl font-extrabold mb-4">Approved partners</h2>
          <div className="rounded-2xl bg-card ring-1 ring-border divide-y divide-border overflow-hidden">
            {approved.map((p) => (
              <div key={p.id} className="p-4 flex items-center gap-4">
                <div className="size-10 rounded-full bg-brand-green/15 text-brand-green font-extrabold grid place-items-center text-sm">
                  {(p.profile?.name ?? "?").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{p.profile?.name ?? "Unknown"}</p>
                  <p className="text-xs text-muted-foreground capitalize">{p.vehicle_type} · {p.vehicle_number} · {p.district ?? "—"}</p>
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-green">Approved</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <Link to="/home" className="text-xs font-extrabold text-brand-clay">← Back to app</Link>
    </div>
  );
}

function PartnerCard({ p, onApprove, onReject, pending }: { p: any; onApprove: () => void; onReject: () => void; pending: boolean }) {
  return (
    <div className="rounded-2xl bg-card ring-1 ring-border p-5">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="size-12 rounded-full bg-brand-clay/15 text-brand-clay font-extrabold grid place-items-center">
          {(p.profile?.name ?? "?").slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-[200px]">
          <p className="font-bold">{p.profile?.name ?? "Unknown"}</p>
          <p className="text-xs text-muted-foreground">{p.profile?.phone ?? "No phone"} · {p.district ?? "—"}, {p.state ?? "—"}</p>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">{p.vehicle_type} · {p.vehicle_number} · {p.capacity_kg}kg</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onReject} disabled={pending}><X className="size-3.5 mr-1" /> Reject</Button>
          <Button size="sm" onClick={onApprove} disabled={pending} className="gradient-accent text-white font-extrabold">
            <Check className="size-3.5 mr-1" /> Approve
          </Button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <DocLink label="Driving licence" url={p.license_photo_url} />
        <DocLink label="Vehicle photo" url={p.vehicle_photo_url} />
      </div>
    </div>
  );
}

function DocLink({ label, url }: { label: string; url: string | null }) {
  if (!url) return <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">{label}: missing</div>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block rounded-lg ring-1 ring-border overflow-hidden hover:ring-brand-clay transition">
      <div className="aspect-[4/3] bg-stone-100">
        <img src={url} alt={label} className="size-full object-cover" />
      </div>
      <div className="p-2 text-xs font-bold flex items-center justify-between">
        {label} <ExternalLink className="size-3" />
      </div>
    </a>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card ring-1 ring-border p-5">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <Icon className="size-3.5 text-brand-clay" /> {label}
      </div>
      <p className="mt-2 text-2xl font-extrabold text-rupee">{value}</p>
    </div>
  );
}
