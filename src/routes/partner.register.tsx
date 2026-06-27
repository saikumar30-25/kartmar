import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useRegisterPartner, useMyPartnerProfile, useRequireAuth } from "@/lib/queries";

export const Route = createFileRoute("/partner/register")({
  head: () => ({ meta: [{ title: "Driver registration — AgriConnect" }] }),
  component: () => (
    <AppShell>
      <Reg />
    </AppShell>
  ),
});

function Reg() {
  const navigate = useNavigate();
  const { user } = useRequireAuth();
  const { data: existing } = useMyPartnerProfile();
  const register = useRegisterPartner();

  const [vehicleType, setVehicleType] = useState(existing?.vehicle_type ?? "Small pickup (≤1000kg)");
  const [vehicleNumber, setVehicleNumber] = useState(existing?.vehicle_number ?? "");
  const [capacity, setCapacity] = useState(String(existing?.capacity_kg ?? ""));
  const [license, setLicense] = useState(existing?.license_number ?? "");
  const [districts, setDistricts] = useState((existing?.service_districts ?? []).join(", "));
  const [upi, setUpi] = useState(existing?.upi_id ?? "");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await register.mutateAsync({
        id: user.id,
        vehicle_type: vehicleType,
        vehicle_number: vehicleNumber,
        capacity_kg: Number(capacity),
        license_number: license,
        service_districts: districts.split(",").map((s) => s.trim()).filter(Boolean),
        upi_id: upi,
      });
      toast.success("Submitted. We'll verify within 24 hours.");
      navigate({ to: "/partner" });
    } catch (err: any) {
      toast.error(err.message || "Failed to register");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-serif italic text-4xl text-brand-green">Driver registration</h1>
      <p className="text-sm text-muted-foreground mt-1">Verified in 24 hours. Documents stay private.</p>

      <form className="mt-8 space-y-5" onSubmit={onSubmit}>
        <Section title="Vehicle">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Vehicle type">
              <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm">
                <option>Two-wheeler (bike, ≤30kg)</option>
                <option>Three-wheeler / auto (≤300kg)</option>
                <option>Small pickup (≤1000kg)</option>
                <option>Medium truck (≤3000kg)</option>
                <option>Large truck (3000kg+)</option>
              </select>
            </Field>
            <Field label="Registration number"><Input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} placeholder="TS 09 AB 1234" className="bg-card" required /></Field>
            <Field label="Capacity (kg)"><Input value={capacity} onChange={(e) => setCapacity(e.target.value)} type="number" placeholder="1000" className="bg-card" required /></Field>
            <Field label="Driving license number"><Input value={license} onChange={(e) => setLicense(e.target.value)} placeholder="DLAP012345" className="bg-card" required /></Field>
          </div>
          <Field label="Service districts (comma separated)">
            <Input value={districts} onChange={(e) => setDistricts(e.target.value)} placeholder="Warangal, Hyderabad, Karimnagar" className="bg-card" required />
          </Field>
        </Section>

        <Section title="Documents">
          <div className="grid grid-cols-2 gap-3">
            {["Driving license", "Vehicle RC", "Vehicle photo", "Aadhaar card"].map((doc) => (
              <button key={doc} type="button" className="aspect-[4/3] rounded-xl border-2 border-dashed border-border bg-brand-cream grid place-items-center text-center p-3 hover:border-brand-clay hover:text-brand-clay text-muted-foreground">
                <div>
                  <Upload className="size-5 mx-auto mb-2" />
                  <p className="text-xs font-semibold">{doc}</p>
                  <p className="text-[10px]">Tap to upload</p>
                </div>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Payout">
          <Field label="UPI ID"><Input value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="yourname@upi" className="bg-card" required /></Field>
        </Section>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/partner" })} className="flex-1">Cancel</Button>
          <Button type="submit" disabled={register.isPending} className="flex-1 bg-brand-green text-brand-cream h-11 font-bold">
            {register.isPending ? "Saving…" : "Submit for verification"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card ring-1 ring-border p-5 space-y-4">
      <h2 className="font-semibold text-sm">{title}</h2>
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
