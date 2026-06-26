import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { listings, partnerStats } from "@/lib/mock-data";
import { rupees } from "@/lib/format";
import { GradeBadge } from "@/components/FreshnessBadge";
import { Button } from "@/components/ui/button";
import { Star, IndianRupee, Package, BadgeCheck } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — AgriConnect" }] }),
  component: () => (
    <AppShell>
      <Profile />
    </AppShell>
  ),
});

function Profile() {
  const { user } = useAuth();
  if (!user) return null;
  const myListings = listings.slice(0, 3);

  return (
    <div className="space-y-8">
      <header className="rounded-3xl bg-brand-green text-brand-cream p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 size-40 bg-brand-moss/40 rounded-full blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-5">
          <div className="size-20 rounded-2xl bg-brand-cream text-brand-green font-bold text-2xl grid place-items-center">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-serif italic text-3xl">{user.name}</h1>
              {user.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-clay px-2 py-0.5 text-[10px] font-bold uppercase">
                  <BadgeCheck className="size-3" /> Verified
                </span>
              )}
            </div>
            <p className="text-sm opacity-80 mt-1">{user.email} · {user.phone}</p>
            <p className="text-sm opacity-80">{user.district}, {user.state}</p>
          </div>
          <Button variant="outline" className="bg-white/10 text-brand-cream border-white/20 hover:bg-white/20">
            Edit profile
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-3">
        <Stat icon={Package} label="Total deals" value="42" />
        <Stat icon={Star} label="Rating" value={`${user.rating}`} />
        <Stat icon={IndianRupee} label="This month" value={rupees(partnerStats.earningsPaise)} />
      </section>

      <section>
        <h2 className="font-serif italic text-2xl text-brand-green mb-4">My active listings</h2>
        <div className="rounded-2xl bg-card ring-1 ring-border divide-y divide-border overflow-hidden">
          {myListings.map((l) => (
            <div key={l.id} className="flex items-center gap-4 p-4">
              <img src={l.photo} alt="" className="size-14 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{l.productName}</p>
                <p className="text-xs text-muted-foreground">{l.quantity}{l.unit} · {rupees(l.displayPrice)}/{l.unit}</p>
              </div>
              <GradeBadge grade={l.qualityGrade} />
              <Button variant="outline" size="sm">Edit</Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Star; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card ring-1 ring-border p-4">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <Icon className="size-3" /> {label}
      </div>
      <p className="mt-1.5 text-xl font-bold text-rupee">{value}</p>
    </div>
  );
}
