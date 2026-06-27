import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";
import { useCreateRequirement, useRequireAuth } from "@/lib/queries";

export const Route = createFileRoute("/post-requirement")({
  head: () => ({ meta: [{ title: "Post a requirement — AgriConnect" }] }),
  component: () => (
    <AppShell>
      <Post />
    </AppShell>
  ),
});

function Post() {
  const navigate = useNavigate();
  const { user } = useRequireAuth();
  const createReq = useCreateRequirement();
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [requiredBy, setRequiredBy] = useState("");
  const [notes, setNotes] = useState("");
  const [offer, setOffer] = useState("");
  const [ceiling, setCeiling] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await createReq.mutateAsync({
        buyer_id: user.id,
        product_name: productName,
        quantity: Number(quantity),
        unit,
        needed_by: requiredBy || null,
        notes: notes || null,
        target_price_paise: offer ? Number(offer) * 100 : null,
        district: user.district ?? "",
        state: user.state ?? "",
        status: "open",
      });
      void ceiling;
      toast.success("Requirement posted. Matching farmers will be alerted.");
      navigate({ to: "/home" });
    } catch (err: any) {
      toast.error(err.message || "Failed to post");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-serif italic text-4xl text-brand-green">What do you need?</h1>
      <p className="text-sm text-muted-foreground mt-1">Nearby farmers will see this immediately.</p>

      <form className="mt-8 space-y-5" onSubmit={onSubmit}>
        <div className="rounded-2xl bg-card ring-1 ring-border p-5 space-y-4">
          <Field label="Product needed">
            <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. Sona Masuri Rice" className="bg-card" required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity">
              <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} type="number" placeholder="500" className="bg-card" required />
            </Field>
            <Field label="Unit">
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm">
                <option>kg</option><option>quintal</option><option>ton</option>
              </select>
            </Field>
          </div>
          <Field label="Required by">
            <Input value={requiredBy} onChange={(e) => setRequiredBy(e.target.value)} type="date" className="bg-card" />
          </Field>
          <Field label="Notes / special requirements">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="e.g. Grade A only, no pesticides" className="bg-card" />
          </Field>
        </div>

        <div className="rounded-2xl bg-card ring-1 ring-border p-5 space-y-4">
          <h2 className="font-semibold text-sm">AI Bargaining offer</h2>
          <Field label={`Offer price (₹ per ${unit})`}>
            <Input value={offer} onChange={(e) => setOffer(e.target.value)} type="number" placeholder="42" className="bg-card" required />
          </Field>
          <Field label={`My ceiling (₹ per ${unit}, AI never goes above)`}>
            <Input value={ceiling} onChange={(e) => setCeiling(e.target.value)} type="number" placeholder="50" className="bg-card" required />
          </Field>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/home" })} className="flex-1">Cancel</Button>
          <Button type="submit" disabled={createReq.isPending} className="flex-1 bg-brand-green text-brand-cream font-bold h-11">
            {createReq.isPending ? "Posting…" : "Post requirement"}
          </Button>
        </div>
      </form>
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
