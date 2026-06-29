import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Check, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { useRef, useState } from "react";
import { useRegisterPartner, useMyPartnerProfile, useRequireAuth } from "@/lib/queries";
import { uploadAndSign } from "@/lib/storage";

type VehicleType = "bike" | "tempo" | "pickup" | "mini_truck" | "tractor";

const VEHICLE_LABELS: Record<VehicleType, string> = {
  bike: "Two-wheeler (≤30kg)",
  tempo: "Three-wheeler / auto (≤300kg)",
  pickup: "Small pickup (≤1000kg)",
  mini_truck: "Mini truck (≤3000kg)",
  tractor: "Tractor / large (3000kg+)",
};

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

  const [vehicleType, setVehicleType] = useState<VehicleType>((existing?.vehicle_type as VehicleType) ?? "pickup");
  const [vehicleNumber, setVehicleNumber] = useState(existing?.vehicle_number ?? "");
  const [capacity, setCapacity] = useState(String(existing?.capacity_kg ?? ""));
  const [district, setDistrict] = useState(existing?.district ?? "");
  const [state, setState] = useState(existing?.state ?? "");
  const [licenseUrl, setLicenseUrl] = useState<string | null>(existing?.license_photo_url ?? null);
  const [vehicleUrl, setVehicleUrl] = useState<string | null>(existing?.vehicle_photo_url ?? null);
  const [uploadingKind, setUploadingKind] = useState<"license" | "vehicle" | null>(null);

  const licenseRef = useRef<HTMLInputElement>(null);
  const vehicleRef = useRef<HTMLInputElement>(null);

  const uploadDoc = async (kind: "license" | "vehicle", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 8 * 1024 * 1024) return toast.error("File must be under 8MB");
    setUploadingKind(kind);
    try {
      const url = await uploadAndSign("partner-docs", user.id, file, kind);
      if (kind === "license") setLicenseUrl(url); else setVehicleUrl(url);
      toast.success(`${kind === "license" ? "Licence" : "Vehicle photo"} uploaded`);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploadingKind(null);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!licenseUrl) return toast.error("Driving licence photo is required.");
    if (!vehicleUrl) return toast.error("Vehicle photo is required.");
    try {
      await register.mutateAsync({
        id: user.id,
        vehicle_type: vehicleType,
        vehicle_number: vehicleNumber,
        capacity_kg: Number(capacity),
        district: district || null,
        state: state || null,
        license_photo_url: licenseUrl,
        vehicle_photo_url: vehicleUrl,
        verification_status: "pending",
      });
      toast.success("Submitted! Admin will review within 24 hours.");
      navigate({ to: "/partner" });
    } catch (err: any) {
      toast.error(err.message || "Failed to register");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <header className="rounded-3xl gradient-hero text-brand-cream p-6 mb-6">
        <p className="text-xs font-bold uppercase tracking-widest opacity-80">Delivery partner</p>
        <h1 className="text-3xl font-extrabold mt-1">Register your vehicle</h1>
        <p className="text-sm opacity-90 mt-1">Verified within 24 hours. Documents are private.</p>
      </header>

      <form className="space-y-5" onSubmit={onSubmit}>
        <Section title="Vehicle">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Vehicle type">
              <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value as VehicleType)} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm">
                {(Object.keys(VEHICLE_LABELS) as VehicleType[]).map((v) => (
                  <option key={v} value={v}>{VEHICLE_LABELS[v]}</option>
                ))}
              </select>
            </Field>
            <Field label="Registration number"><Input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} placeholder="TS 09 AB 1234" maxLength={20} required /></Field>
            <Field label="Capacity (kg)"><Input value={capacity} onChange={(e) => setCapacity(e.target.value)} type="number" placeholder="1000" required /></Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Base district"><Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Warangal" /></Field>
            <Field label="State"><Input value={state} onChange={(e) => setState(e.target.value)} placeholder="Telangana" /></Field>
          </div>
        </Section>

        <Section title="Required documents">
          <input ref={licenseRef} type="file" accept="image/*" className="hidden" onChange={(e) => uploadDoc("license", e)} />
          <input ref={vehicleRef} type="file" accept="image/*" className="hidden" onChange={(e) => uploadDoc("vehicle", e)} />
          <div className="grid grid-cols-2 gap-3">
            <DocTile
              label="Driving licence"
              url={licenseUrl}
              uploading={uploadingKind === "license"}
              onPick={() => licenseRef.current?.click()}
            />
            <DocTile
              label="Vehicle photo"
              url={vehicleUrl}
              uploading={uploadingKind === "vehicle"}
              onPick={() => vehicleRef.current?.click()}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">Only you and platform admins can view these documents.</p>
        </Section>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/partner" })} className="flex-1">Cancel</Button>
          <Button type="submit" disabled={register.isPending} className="flex-1 gradient-accent text-white h-11 font-extrabold shadow-bold">
            {register.isPending ? "Saving…" : "Submit for verification"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function DocTile({ label, url, uploading, onPick }: { label: string; url: string | null; uploading: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={uploading}
      className="relative aspect-[4/3] rounded-xl ring-1 ring-border bg-brand-cream overflow-hidden grid place-items-center text-center text-muted-foreground hover:ring-brand-clay/60 transition"
    >
      {url ? (
        <>
          <img src={url} alt={label} className="size-full object-cover" />
          <div className="absolute top-1.5 right-1.5 size-6 rounded-full bg-brand-green text-white grid place-items-center">
            <Check className="size-3.5" />
          </div>
          <div className="absolute bottom-0 inset-x-0 bg-black/55 text-white text-[11px] font-bold py-1">{label} · tap to replace</div>
        </>
      ) : uploading ? (
        <Loader2 className="size-6 animate-spin text-brand-clay" />
      ) : (
        <div className="p-3">
          {label.includes("Vehicle") ? <ImagePlus className="size-5 mx-auto mb-2" /> : <Upload className="size-5 mx-auto mb-2" />}
          <p className="text-xs font-bold">{label}</p>
          <p className="text-[10px]">Tap to upload</p>
        </div>
      )}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card ring-1 ring-border p-5 space-y-4">
      <h2 className="font-extrabold text-sm">{title}</h2>
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
