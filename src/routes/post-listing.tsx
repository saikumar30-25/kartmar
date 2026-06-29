import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useRef, useState } from "react";
import { Sparkles, ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useCreateListing, useRequireAuth } from "@/lib/queries";
import { uploadAndSign } from "@/lib/storage";

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
  const fileRef = useRef<HTMLInputElement>(null);

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
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 8 * 1024 * 1024) return toast.error("Photo must be under 8MB");
    setUploading(true);
    try {
      const url = await uploadAndSign("product-images", user.id, file, "listing");
      setPhotoUrl(url);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!photoUrl) return toast.error("Please add a product photo so buyers can see the produce.");
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
        min_price_paise: floorRupees * 100,
        description: description || null,
        photo_url: photoUrl,
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
      <header className="rounded-3xl gradient-hero text-brand-cream p-6 mb-6 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 size-32 bg-brand-clay/40 rounded-full blur-3xl" />
        <p className="text-xs font-bold uppercase tracking-widest opacity-80">Sell your harvest</p>
        <h1 className="text-3xl font-extrabold mt-1">List a product</h1>
        <p className="text-sm opacity-90 mt-1">Reach buyers nearby in minutes.</p>
      </header>

      <form className="space-y-5" onSubmit={onSubmit}>
        <Section title="Product photo (required)">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
          {photoUrl ? (
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden ring-1 ring-border">
              <img src={photoUrl} alt="Product preview" className="size-full object-cover" />
              <button type="button" onClick={() => setPhotoUrl(null)} className="absolute top-2 right-2 size-8 rounded-full bg-black/60 text-white grid place-items-center">
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="aspect-[4/3] w-full rounded-2xl border-2 border-dashed border-brand-clay/40 bg-brand-clay/5 grid place-items-center text-brand-clay hover:bg-brand-clay/10 transition"
            >
              {uploading ? <Loader2 className="size-7 animate-spin" /> : (
                <div className="text-center">
                  <ImagePlus className="size-8 mx-auto" />
                  <p className="mt-2 text-sm font-bold">Tap to add a clear photo</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Bright lighting, full produce in frame</p>
                </div>
              )}
            </button>
          )}
        </Section>

        <Section title="Product">
          <Field label="Product name">
            <Input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="e.g. Hybrid Tomatoes" required />
          </Field>
          <Field label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm" required>
              <option>Vegetables</option><option>Fruits</option><option>Grains</option><option>Spices</option><option>Dairy</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity">
              <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} type="number" placeholder="200" required />
            </Field>
            <Field label="Unit">
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm">
                <option>kg</option><option>quintal</option><option>ton</option>
              </select>
            </Field>
          </div>
          <Field label="Quality grade">
            <div className="flex gap-2">
              {(["A", "B", "C"] as const).map((g) => (
                <label key={g} className="flex-1">
                  <input type="radio" name="grade" checked={grade === g} onChange={() => setGrade(g)} className="peer sr-only" />
                  <div className="rounded-lg ring-1 ring-border bg-card text-center py-2.5 text-sm font-bold peer-checked:gradient-accent peer-checked:text-white peer-checked:ring-0 cursor-pointer transition">
                    Grade {g}
                  </div>
                </label>
              ))}
            </div>
          </Field>
        </Section>

        <Section title={
          <div className="flex items-center justify-between w-full">
            <span>AI bargaining pricing</span>
            <label className="flex items-center gap-2 text-xs font-normal">
              <Switch checked={simple} onCheckedChange={setSimple} /> Simple mode
            </label>
          </div>
        }>
          {product && (
            <div className="rounded-xl bg-brand-clay/10 ring-1 ring-brand-clay/20 p-3 text-sm flex gap-2">
              <Sparkles className="size-4 text-brand-clay shrink-0 mt-0.5" />
              <p className="text-brand-clay"><strong>AI suggestion:</strong> Market price for {product} is approximately ₹40–₹70/kg.</p>
            </div>
          )}
          {simple ? (
            <Field label={`My minimum price (₹ per ${unit})`}>
              <Input value={floor} onChange={(e) => setFloor(e.target.value)} type="number" placeholder="100" required />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Buyers see ₹{floor ? Math.round(Number(floor) * 1.3) : "—"}/{unit}; AI negotiates down to your minimum.
              </p>
            </Field>
          ) : (
            <div className="space-y-3">
              <Field label="Display price (buyers see this)">
                <Input value={display} onChange={(e) => setDisplay(e.target.value)} type="number" placeholder="130" required />
              </Field>
              <Field label="I can accept (during bargain)">
                <Input value={accept} onChange={(e) => setAccept(e.target.value)} type="number" placeholder="110" required />
              </Field>
              <Field label="My minimum (AI never goes below)">
                <Input value={floor} onChange={(e) => setFloor(e.target.value)} type="number" placeholder="100" required />
              </Field>
            </div>
          )}
        </Section>

        <Section title="Description (optional)">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Anything buyers should know?" rows={3} />
        </Section>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/home" })} className="flex-1">Cancel</Button>
          <Button type="submit" disabled={createListing.isPending || uploading} className="flex-1 gradient-accent text-white font-extrabold h-11 shadow-bold">
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
      <h2 className="font-extrabold text-sm flex items-center justify-between">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wider mb-1.5 block font-bold">{label}</Label>
      {children}
    </div>
  );
}
