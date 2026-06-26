import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

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
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-serif italic text-4xl text-brand-green">What do you need?</h1>
      <p className="text-sm text-muted-foreground mt-1">Nearby farmers will see this immediately.</p>

      <form
        className="mt-8 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Requirement posted. We'll alert matching farmers.");
          navigate({ to: "/home" });
        }}
      >
        <div className="rounded-2xl bg-card ring-1 ring-border p-5 space-y-4">
          <Field label="Product needed"><Input placeholder="e.g. Sona Masuri Rice" className="bg-card" required /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity"><Input type="number" placeholder="500" className="bg-card" required /></Field>
            <Field label="Unit">
              <select className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm">
                <option>kg</option><option>quintal</option><option>ton</option>
              </select>
            </Field>
          </div>
          <Field label="Required by"><Input type="date" className="bg-card" required /></Field>
          <Field label="Notes / special requirements">
            <Textarea rows={3} placeholder="e.g. Grade A only, no pesticides" className="bg-card" />
          </Field>
        </div>

        <div className="rounded-2xl bg-card ring-1 ring-border p-5 space-y-4">
          <h2 className="font-semibold text-sm">AI Bargaining offer</h2>
          <Field label="Offer price (farmers see this)"><Input type="number" placeholder="42" className="bg-card" required /></Field>
          <Field label="I can pay up to"><Input type="number" placeholder="46" className="bg-card" required /></Field>
          <Field label="My ceiling (AI never goes above)"><Input type="number" placeholder="50" className="bg-card" required /></Field>
          <p className="text-[11px] text-muted-foreground">Only the offer price is visible to farmers.</p>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/home" })} className="flex-1">Cancel</Button>
          <Button type="submit" className="flex-1 bg-brand-green text-brand-cream font-bold h-11">Post requirement</Button>
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
