import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { useUpdateProfile, useRequireAuth } from "@/lib/queries";
import { uploadAndSign } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { BadgeCheck, Camera, Loader2, Save } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — AgriConnect" }] }),
  component: () => (
    <AppShell>
      <Profile />
    </AppShell>
  ),
});

function Profile() {
  const { user } = useRequireAuth();
  const { refresh } = useAuth();
  const update = useUpdateProfile();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [district, setDistrict] = useState(user?.district ?? "");
  const [state, setState] = useState(user?.state ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? "");
  const [uploading, setUploading] = useState(false);

  if (!user) return null;

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadAndSign("avatars", user.id, file, "avatar");
      setAvatarUrl(url);
      await update.mutateAsync({ id: user.id, patch: { avatar_url: url } });
      await refresh();
      toast.success("Photo updated");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Name is required");
    try {
      await update.mutateAsync({
        id: user.id,
        patch: { name: name.trim(), phone: phone.trim() || null, district: district.trim() || null, state: state.trim() || null },
      });
      await refresh();
      toast.success("Profile saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header className="rounded-3xl gradient-hero text-brand-cream p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 size-48 bg-brand-clay/40 rounded-full blur-3xl" />
        <div className="relative flex items-center gap-5">
          <div className="relative">
            <Avatar className="size-20 ring-4 ring-white/30">
              <AvatarImage src={avatarUrl || undefined} alt={name} />
              <AvatarFallback className="bg-white text-brand-green text-2xl font-extrabold">
                {name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 size-8 rounded-full bg-brand-clay text-white grid place-items-center ring-2 ring-white shadow-lg hover:scale-105 transition disabled:opacity-60"
              aria-label="Change profile photo"
            >
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatar} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl font-extrabold">{name || "Your name"}</h1>
              {user.is_verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-clay px-2 py-0.5 text-[10px] font-bold uppercase">
                  <BadgeCheck className="size-3" /> Verified
                </span>
              )}
            </div>
            <p className="text-sm opacity-90 mt-1">{user.email}</p>
            <p className="text-xs opacity-80 mt-0.5 capitalize">Role: {user.role ?? "—"} · locked</p>
          </div>
        </div>
      </header>

      <form onSubmit={onSave} className="rounded-2xl bg-card ring-1 ring-border p-6 space-y-4 shadow-bold">
        <h2 className="text-lg font-extrabold">Edit your details</h2>
        <Field label="Full name">
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
        </Field>
        <Field label="Phone number">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" type="tel" maxLength={20} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="District"><Input value={district} onChange={(e) => setDistrict(e.target.value)} maxLength={60} /></Field>
          <Field label="State"><Input value={state} onChange={(e) => setState(e.target.value)} maxLength={60} /></Field>
        </div>
        <Button type="submit" disabled={update.isPending} className="w-full h-11 gradient-accent text-white font-extrabold shadow-bold">
          {update.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
          Save changes
        </Button>
      </form>
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
