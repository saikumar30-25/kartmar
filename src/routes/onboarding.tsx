import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Loader2, Upload, Check, ImagePlus, Sprout, ShoppingBasket, Truck } from "lucide-react";
import { toast } from "sonner";

import { useAuth, type Role } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { uploadAndSign } from "@/lib/storage";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Complete your profile — AgriConnect" }] }),
  component: Onboarding,
});

// ---------- Schemas ----------
const phoneSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");
const pinSchema = z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code");

const commonSchema = z.object({
  name: z.string().trim().min(2, "Full name is required").max(80),
  phone: phoneSchema,
  address: z.string().trim().min(8, "Address must be at least 8 characters").max(240),
  district: z.string().trim().min(2, "District is required").max(60),
  state: z.string().trim().min(2, "State is required").max(60),
  pincode: pinSchema,
});

const VEHICLE_LABELS = {
  bike: "Two-wheeler (≤30kg)",
  tempo: "Three-wheeler / auto (≤300kg)",
  pickup: "Small pickup (≤1000kg)",
  mini_truck: "Mini truck (≤3000kg)",
  tractor: "Tractor / large (3000kg+)",
} as const;
type VehicleType = keyof typeof VEHICLE_LABELS;

const partnerSchema = z.object({
  vehicle_type: z.enum(["bike", "tempo", "pickup", "mini_truck", "tractor"] as const),
  vehicle_number: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}[ -]?\d{1,2}[ -]?[A-Z]{0,3}[ -]?\d{1,4}$/, "Enter a valid Indian vehicle number (e.g. TS 09 AB 1234)")
    .max(20),
  capacity_kg: z.coerce.number().int().positive("Capacity must be greater than 0").max(50000),
  aadhaar_last4: z.string().trim().regex(/^\d{4}$/, "Enter the last 4 digits of your Aadhaar"),
});

function Onboarding() {
  const navigate = useNavigate();
  const { user, loading, refresh } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
    else if (!user.role) navigate({ to: "/select-role" });
    else if (user.details_completed) navigate({ to: "/home" });
  }, [user, loading, navigate]);

  if (loading || !user || !user.role) {
    return (
      <div className="min-h-screen grid place-items-center bg-brand-cream">
        <Loader2 className="size-6 animate-spin text-brand-green" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Header role={user.role} />
        <OnboardingForm role={user.role} onDone={async () => { await refresh(); }} />
      </div>
    </div>
  );
}

function Header({ role }: { role: Role }) {
  const map: Record<Role, { icon: typeof Sprout; title: string; sub: string }> = {
    farmer: { icon: Sprout, title: "Farmer onboarding", sub: "We use this so buyers can find and contact you." },
    owner: { icon: ShoppingBasket, title: "Buyer onboarding", sub: "Farmers will see this when you express interest in their produce." },
    partner: { icon: Truck, title: "Delivery partner onboarding", sub: "Strict checks — our team reviews every detail within 24 hours." },
    admin: { icon: Sprout, title: "Admin onboarding", sub: "Complete your profile." },
  };
  const m = map[role];
  const Icon = m.icon;
  return (
    <header className="rounded-3xl bg-card ring-1 ring-border p-6 mb-6 flex items-start gap-4">
      <div className="size-12 rounded-2xl bg-brand-green/10 text-brand-green grid place-items-center shrink-0">
        <Icon className="size-6" />
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-moss">Step 2 of 2</p>
        <h1 className="text-2xl font-extrabold mt-0.5">{m.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{m.sub}</p>
      </div>
    </header>
  );
}

function OnboardingForm({ role, onDone }: { role: Role; onDone: () => Promise<void> }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // common
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [district, setDistrict] = useState(user?.district ?? "");
  const [state, setState] = useState(user?.state ?? "");
  const [pincode, setPincode] = useState(user?.pincode ?? "");

  // partner
  const [vehicleType, setVehicleType] = useState<VehicleType>("pickup");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [licenseUrl, setLicenseUrl] = useState<string | null>(null);
  const [vehicleUrl, setVehicleUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"license" | "vehicle" | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const licenseRef = useRef<HTMLInputElement>(null);
  const vehicleRef = useRef<HTMLInputElement>(null);

  const upload = async (kind: "license" | "vehicle", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 8 * 1024 * 1024) return toast.error("File must be under 8MB");
    setUploading(kind);
    try {
      const url = await uploadAndSign("partner-docs", user.id, file, kind);
      if (kind === "license") setLicenseUrl(url); else setVehicleUrl(url);
      toast.success(`${kind === "license" ? "Licence" : "Vehicle photo"} uploaded`);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || submitting) return;

    const commonParsed = commonSchema.safeParse({ name, phone, address, district, state, pincode });
    if (!commonParsed.success) {
      return toast.error(commonParsed.error.issues[0]?.message ?? "Please fix the form");
    }

    if (role === "partner") {
      const partnerParsed = partnerSchema.safeParse({
        vehicle_type: vehicleType,
        vehicle_number: vehicleNumber,
        capacity_kg: capacity,
        aadhaar_last4: aadhaar,
      });
      if (!partnerParsed.success) {
        return toast.error(partnerParsed.error.issues[0]?.message ?? "Please fix the partner form");
      }
      if (!licenseUrl) return toast.error("Driving licence photo is required.");
      if (!vehicleUrl) return toast.error("Vehicle photo is required.");
    }

    setSubmitting(true);
    try {
      // 1. Update profile
      const { error: profErr } = await supabase
        .from("profiles")
        .update({
          name: commonParsed.data.name,
          phone: commonParsed.data.phone,
          address: commonParsed.data.address,
          district: commonParsed.data.district,
          state: commonParsed.data.state,
          pincode: commonParsed.data.pincode,
          aadhaar_last4: role === "partner" ? aadhaar : null,
          details_completed: true,
        })
        .eq("id", user.id);
      if (profErr) throw profErr;

      // 2. Partner-only insert/update
      if (role === "partner") {
        const { error: partnerErr } = await supabase.from("partner_profiles").upsert(
          {
            id: user.id,
            vehicle_type: vehicleType,
            vehicle_number: vehicleNumber.toUpperCase(),
            capacity_kg: Number(capacity),
            district: commonParsed.data.district,
            state: commonParsed.data.state,
            license_photo_url: licenseUrl,
            vehicle_photo_url: vehicleUrl,
            details_completed: true,
            verification_status: "pending",
          },
          { onConflict: "id" },
        );
        if (partnerErr) throw partnerErr;
      }

      await onDone();
      toast.success("Profile saved! Welcome to AgriConnect.");
      navigate({ to: role === "partner" ? "/partner" : "/home" });
    } catch (err: any) {
      toast.error(err.message || "Could not save your details");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={submit}>
      <Section title="Personal details">
        <Field label="Full name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ramesh Kumar" maxLength={80} required />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Mobile number">
            <Input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="9XXXXXXXXX" inputMode="numeric" required />
          </Field>
          <Field label="PIN code">
            <Input value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="500001" inputMode="numeric" required />
          </Field>
        </div>
        <Field label={role === "owner" ? "Shop / market address" : "Address"}>
          <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="Door #, street, area" required />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="District"><Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Warangal" required /></Field>
          <Field label="State"><Input value={state} onChange={(e) => setState(e.target.value)} placeholder="Telangana" required /></Field>
        </div>
      </Section>

      {role === "partner" && (
        <>
          <Section title="Vehicle details">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Vehicle type">
                <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value as VehicleType)} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm">
                  {(Object.keys(VEHICLE_LABELS) as VehicleType[]).map((v) => (
                    <option key={v} value={v}>{VEHICLE_LABELS[v]}</option>
                  ))}
                </select>
              </Field>
              <Field label="Registration number">
                <Input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())} placeholder="TS 09 AB 1234" maxLength={20} required />
              </Field>
              <Field label="Capacity (kg)">
                <Input value={capacity} onChange={(e) => setCapacity(e.target.value.replace(/\D/g, ""))} type="number" placeholder="1000" required />
              </Field>
              <Field label="Aadhaar (last 4 digits)">
                <Input value={aadhaar} onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="1234" inputMode="numeric" required />
              </Field>
            </div>
          </Section>

          <Section title="Required documents">
            <input ref={licenseRef} type="file" accept="image/*" className="hidden" onChange={(e) => upload("license", e)} />
            <input ref={vehicleRef} type="file" accept="image/*" className="hidden" onChange={(e) => upload("vehicle", e)} />
            <div className="grid grid-cols-2 gap-3">
              <DocTile label="Driving licence" url={licenseUrl} uploading={uploading === "license"} onPick={() => licenseRef.current?.click()} />
              <DocTile label="Vehicle photo" url={vehicleUrl} uploading={uploading === "vehicle"} onPick={() => vehicleRef.current?.click()} />
            </div>
            <p className="text-[11px] text-muted-foreground">Only you and platform admins can view these documents. Your account stays in <b>pending</b> until an admin approves it.</p>
          </Section>
        </>
      )}

      <Button type="submit" disabled={submitting} className="w-full h-12 gradient-accent text-white font-extrabold shadow-bold">
        {submitting ? <Loader2 className="size-4 animate-spin" /> : role === "partner" ? "Submit for verification" : "Finish & enter AgriConnect"}
      </Button>
    </form>
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
