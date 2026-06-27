import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ProductCard } from "@/components/ProductCard";
import { useListings } from "@/lib/queries";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { List, SlidersHorizontal, Search, Loader2, PackageOpen } from "lucide-react";

export const Route = createFileRoute("/browse")({
  head: () => ({ meta: [{ title: "Browse listings — AgriConnect" }] }),
  component: () => (
    <AppShell>
      <Browse />
    </AppShell>
  ),
});

function Browse() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const { data: listings = [], isLoading } = useListings();

  const filtered = listings.filter(
    (l) =>
      (cat === "all" || l.category === cat) &&
      (!q || l.product_name.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif italic text-4xl text-brand-green">Browse harvests</h1>
          <p className="text-sm text-muted-foreground mt-1">{isLoading ? "Loading…" : `${filtered.length} listings`}</p>
        </div>
        <Button variant="outline" size="sm"><List className="size-4 mr-1" /> List view</Button>
      </header>

      <div className="rounded-2xl bg-card ring-1 ring-border p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search produce…" className="pl-9 bg-brand-cream" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["all", "vegetables", "fruits", "grains", "spices", "dairy"].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${
                cat === c ? "bg-brand-green text-brand-cream" : "bg-brand-cream text-foreground ring-1 ring-border"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm">
          <SlidersHorizontal className="size-4 mr-1" /> Filters
        </Button>
      </div>

      {isLoading ? (
        <div className="py-20 grid place-items-center text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <PackageOpen className="size-12 mx-auto opacity-40" />
          <p className="mt-3 font-semibold">No listings yet</p>
          <p className="text-sm">Be the first to post produce from your farm.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((l) => <ProductCard key={l.id} listing={l} />)}
        </div>
      )}
    </div>
  );
}
