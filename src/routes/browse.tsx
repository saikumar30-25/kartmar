import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ProductCard } from "@/components/ProductCard";
import { listings } from "@/lib/mock-data";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Map as MapIcon, List, SlidersHorizontal, Search } from "lucide-react";

export const Route = createFileRoute("/browse")({
  head: () => ({ meta: [{ title: "Browse listings — AgriConnect" }] }),
  component: () => (
    <AppShell>
      <Browse />
    </AppShell>
  ),
});

function Browse() {
  const [view, setView] = useState<"list" | "map">("list");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");

  const filtered = listings.filter(
    (l) =>
      (cat === "all" || l.category === cat) &&
      (!q || l.productName.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif italic text-4xl text-brand-green">Browse harvests</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} listings within 100km</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("list")}
            className={view === "list" ? "bg-brand-green text-brand-cream" : ""}
          >
            <List className="size-4 mr-1" /> List
          </Button>
          <Button
            variant={view === "map" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("map")}
            className={view === "map" ? "bg-brand-green text-brand-cream" : ""}
          >
            <MapIcon className="size-4 mr-1" /> Map
          </Button>
        </div>
      </header>

      <div className="rounded-2xl bg-card ring-1 ring-border p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search produce…" className="pl-9 bg-brand-cream" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["all", "vegetables", "fruits", "grains", "spices"].map((c) => (
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

      {view === "list" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((l) => (
            <ProductCard key={l.id} listing={l} />
          ))}
        </div>
      ) : (
        <div className="relative rounded-3xl overflow-hidden ring-1 ring-border bg-brand-moss/10 h-[520px]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, rgba(64,145,108,0.18) 0, transparent 40%), radial-gradient(circle at 70% 60%, rgba(180,83,9,0.15) 0, transparent 35%), linear-gradient(135deg, #e7efe6 0%, #d4e0d2 100%)",
            }}
          />
          {filtered.map((l, i) => (
            <div
              key={l.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${20 + i * 14}%`, top: `${30 + (i % 3) * 18}%` }}
            >
              <div className="rounded-full bg-brand-green text-brand-cream px-3 py-1.5 text-xs font-bold shadow-lg ring-2 ring-white whitespace-nowrap">
                {l.productName.split(" ")[0]} · ₹{Math.round(l.displayPrice / 100)}
              </div>
            </div>
          ))}
          <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-card/95 backdrop-blur p-3 text-xs text-muted-foreground">
            Static map preview — Google Maps integration ships in Phase 2.
          </div>
        </div>
      )}
    </div>
  );
}
