import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Sparkles, ImagePlus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/post-listing")({
  head: () => ({ meta: [{ title: "Post a product — AgriConnect" }] }),
  component: () => (
    <AppShell>
      <PostListing />
    </AppShell>
  ),
});

function PostListing() {
  const navigate = useNavigate();
  const [simple, setSimple] = useState(true);
  const [floor, setFloor] = useState("");
  const [product, setProduct] = useState("");

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-serif italic text-4xl text-brand-green">List a product</h1>
      <p className="text-sm text-muted-foreground mt-1">Buyers nearby will see this within minutes.</p>

      <form
        className="mt-8 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Listing posted! Buyers in 50km radius are being notified.");
          navigate({ to: "/home" });
        }}
      >
        <Section title="Product">
          <Field label="Product name">
            <Input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="e.g. Hybrid Tomatoes" className="bg-card" required />
          </Field>
          <Field label="Category">
            <select className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm" required>
              <option>Vegetables</option>
              <option>Fruits</option>
              <option>Grains</option>
              <option>Spices</option>
              <option>Dairy</option>
            </select>
          </Field>
          <Field label="Photos">
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <button
                  key={i}
                  type="button"
                  className="aspect-square rounded-lg border-2 border-dashed border-border bg-brand-cream grid place-items-center text-muted-foreground hover:border-brand-clay hover:text-brand-clay"
                >
                  <ImagePlus className="size-5" />
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">2–6 photos. AI will rate freshness automatically.</p>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity">
              <Input type="number" placeholder="200" className="bg-card" required />
            </Field>
            <Field label="Unit">
              <select className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm">
                <option>kg</option><option>quintal</option><option>ton</option>
              </select>
            </Field>
          </div>
          <Field label="Quality grade">
            <div className="flex gap-2">
              {(["A", "B", "C"] as const).map((g) => (
                <label key={g} className="flex-1">
                  <input type="radio" name="grade" defaultChecked={g === "A"} className="peer sr-only" />
                  <div className="rounded-lg ring-1 ring-border bg-card text-center py-2.5 text-sm font-semibold peer-checked:bg-brand-green peer-checked:text-brand-cream cursor-pointer">
                    Grade {g}
                  </div>
                </label>
              ))}
            </div>
          </Field>
        </Section>

        <Section
          title={
            <div className="flex items-center justify-between w-full">
              <span>AI Bargaining pricing</span>
              <label className="flex items-center gap-2 text-xs font-normal">
                <Switch checked={simple} onCheckedChange={setSimple} /> Simple mode
              </label>
            </div>
          }
        >
          {product && (
            <div className="rounded-xl bg-brand-clay/10 ring-1 ring-brand-clay/20 p-3 text-sm flex gap-2">
              <Sparkles className="size-4 text-brand-clay shrink-0 mt-0.5" />
              <p className="text-brand-clay">
                <strong>AI suggestion:</strong> Current market price for {product || "this product"} in your district is approximately
                ₹40–₹70/kg. Set your prices accordingly.
              </p>
            </div>
          )}
          {simple ? (
            <Field label="My minimum price (₹ per kg)">
              <Input value={floor} onChange={(e) => setFloor(e.target.value)} type="number" placeholder="100" className="bg-card" required />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                We'll show buyers ₹{floor ? Math.round(Number(floor) * 1.3) : "—"}/kg and let the AI negotiate down to your minimum.
              </p>
            </Field>
          ) : (
            <div className="space-y-3">
              <Field label="Display price (buyers see this)">
                <Input type="number" placeholder="130" className="bg-card" required />
              </Field>
              <Field label="I can accept (during bargain)">
                <Input type="number" placeholder="110" className="bg-card" required />
              </Field>
              <Field label="My minimum (AI never goes below)">
                <Input type="number" placeholder="100" className="bg-card" required />
              </Field>
              <p className="text-[11px] text-muted-foreground">Only display price is visible to buyers. AI uses the others internally.</p>
            </div>
          )}
        </Section>

        <Section title="Description (optional)">
          <Textarea placeholder="Anything buyers should know?" rows={3} className="bg-card" />
        </Section>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/home" })} className="flex-1">Cancel</Button>
          <Button type="submit" className="flex-1 bg-brand-green text-brand-cream font-bold h-11">Post listing</Button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card ring-1 ring-border p-5 space-y-4">
      <h2 className="font-semibold text-sm flex items-center justify-between">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wider mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}
