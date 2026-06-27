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
import { useCreateListing, useRequireAuth } from "@/lib/queries";

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
  const { user } = useRequireAuth();
  const createListing = useCreateListing();
  const [simple, setSimple] = useState(true);
  const [product, setProduct] = useState("");
  const [category, setCategory] = useState("Vegetables");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [grade, setGrade] = useState<"A" | "B" | "C">("A");
  const [floor, setFloor] = useState("");
  const [display, setDisplay] = useState("");
  const [accept, setAccept] = useState("");
  const [description, setDescription] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const floorRupees = Number(floor);
    const displayRupees = simple ? Math.round(floorRupees * 1.3) : Number(display);
    void accept;
    try {
      await createListing.mutateAsync({
        farmer_id: user.id,
        product_name: product,
        category,
        quantity: Number(quantity),
        unit,
        quality_grade: grade,
        price_paise: displayRupees * 100,
        // accept price not persisted in schema; AI bargain uses display + min
        min_price_paise: floorRupees * 100,
        description: description || null,
        district: user.district ?? "",
        state: user.state ?? "",
        status: "active",
      });
      toast.success("Listing posted! Buyers in your area will see it shortly.");
      navigate({ to: "/browse" });
    } catch (err: any) {
      toast.error(err.message || "Failed to post listing");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-serif italic text-4xl text-brand-green">List a product</h1>
      <p className="text-sm text-muted-foreground mt-1">Buyers nearby will see this within minutes.</p>

      <form className="mt-8 space-y-5" onSubmit={onSubmit}>
        <Section title="Product">
          <Field label="Product name">
            <Input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="e.g. Hybrid Tomatoes" className="bg-card" required />
          </Field>
          <Field label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm" required>
              <option>Vegetables</option><option>Fruits</option><option>Grains</option><option>Spices</option><option>Dairy</option>
            </select>
          </Field>
          <Field label="Photos">
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <button key={i} type="button" className="aspect-square rounded-lg border-2 border-dashed border-border bg-brand-cream grid place-items-center text-muted-foreground hover:border-brand-clay hover:text-brand-clay">
                  <ImagePlus className="size-5" />
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">Photo upload coming soon.</p>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity">
              <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} type="number" placeholder="200" className="bg-card" required />
            </Field>
            <Field label="Unit">
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm">
                <option>kg</option><option>quintal</option><option>ton</option>
              </select>
            </Field>
          </div>
          <Field label="Quality grade">
            <div className="flex gap-2">
              {(["A", "B", "C"] as const).map((g) => (
                <label key={g} className="flex-1">
                  <input type="radio" name="grade" checked={grade === g} onChange={() => setGrade(g)} className="peer sr-only" />
                  <div className="rounded-lg ring-1 ring-border bg-card text-center py-2.5 text-sm font-semibold peer-checked:bg-brand-green peer-checked:text-brand-cream cursor-pointer">
                    Grade {g}
                  </div>
                </label>
              ))}
            </div>
          </Field>
        </Section>

        <Section title={
          <div className="flex items-center justify-between w-full">
            <span>AI Bargaining pricing</span>
            <label className="flex items-center gap-2 text-xs font-normal">
              <Switch checked={simple} onCheckedChange={setSimple} /> Simple mode
            </label>
          </div>
        }>
          {product && (
            <div className="rounded-xl bg-brand-clay/10 ring-1 ring-brand-clay/20 p-3 text-sm flex gap-2">
              <Sparkles className="size-4 text-brand-clay shrink-0 mt-0.5" />
              <p className="text-brand-clay"><strong>AI suggestion:</strong> Market price for {product} in your district is approximately ₹40–₹70/kg.</p>
            </div>
          )}
          {simple ? (
            <Field label={`My minimum price (₹ per ${unit})`}>
              <Input value={floor} onChange={(e) => setFloor(e.target.value)} type="number" placeholder="100" className="bg-card" required />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Buyers see ₹{floor ? Math.round(Number(floor) * 1.3) : "—"}/{unit}; AI negotiates down to your minimum.
              </p>
            </Field>
          ) : (
            <div className="space-y-3">
              <Field label="Display price (buyers see this)">
                <Input value={display} onChange={(e) => setDisplay(e.target.value)} type="number" placeholder="130" className="bg-card" required />
              </Field>
              <Field label="I can accept (during bargain)">
                <Input value={accept} onChange={(e) => setAccept(e.target.value)} type="number" placeholder="110" className="bg-card" required />
              </Field>
              <Field label="My minimum (AI never goes below)">
                <Input value={floor} onChange={(e) => setFloor(e.target.value)} type="number" placeholder="100" className="bg-card" required />
              </Field>
            </div>
          )}
        </Section>

        <Section title="Description (optional)">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Anything buyers should know?" rows={3} className="bg-card" />
        </Section>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/home" })} className="flex-1">Cancel</Button>
          <Button type="submit" disabled={createListing.isPending} className="flex-1 bg-brand-green text-brand-cream font-bold h-11">
            {createListing.isPending ? "Posting…" : "Post listing"}
          </Button>
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
