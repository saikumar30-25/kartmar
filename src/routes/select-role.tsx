import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth, type Role } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Sprout, ShoppingBasket, Truck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/select-role")({
  head: () => ({ meta: [{ title: "Pick your role — AgriConnect" }] }),
  component: SelectRole,
});

const ROLES: { id: Role; label: string; desc: string; icon: typeof Sprout }[] = [
  { id: "farmer", label: "I'm a farmer", desc: "List my produce and sell to nearby buyers.", icon: Sprout },
  { id: "owner", label: "I'm a market owner", desc: "Buy fresh produce for my shop or restaurant.", icon: ShoppingBasket },
  { id: "partner", label: "I'm a delivery partner", desc: "Use my vehicle to earn from transport trips.", icon: Truck },
];

function SelectRole() {
  const { user, loading, refresh, signOut } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<Role | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
    else if (user.role) navigate({ to: "/home" });
  }, [user, loading, navigate]);

  const pick = async (role: Role) => {
    if (!user || busy) return;
    setBusy(role);

    // Check if this user already has a role (prevent duplicate role for same Google account)
    const { data: existing } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      setBusy(null);
      toast.error(
        `Your Google account is already registered as ${existing.role}. One email can hold only one role — please sign in with a different Google account to use AgriConnect as a ${role}.`,
        { duration: 7000 },
      );
      return;
    }

    const { error } = await supabase.from("user_roles").insert({ user_id: user.id, role });
    if (error) {
      setBusy(null);
      // unique_violation = code 23505 → role already assigned
      if (error.code === "23505") {
        toast.error("This Google account already has a role assigned. Sign in with a different email to choose another role.");
      } else {
        toast.error(error.message);
      }
      return;
    }

    await refresh();
    toast.success(`You're set up as a ${role}.`);
    navigate({ to: role === "partner" ? "/partner/register" : "/home" });
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center bg-brand-cream">
        <Loader2 className="size-6 animate-spin text-brand-green" />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center bg-brand-cream p-6">
      <div className="w-full max-w-2xl">
        <p className="text-center text-xs uppercase tracking-widest text-brand-moss">Welcome, {user.name}</p>
        <h1 className="mt-2 font-serif italic text-4xl text-brand-green text-center">What brings you here?</h1>
        <p className="text-center text-sm text-muted-foreground mt-2">
          Pick one — this choice is locked to your Google account.
        </p>

        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          {ROLES.map((r) => {
            const Icon = r.icon;
            const isBusy = busy === r.id;
            return (
              <button
                key={r.id}
                onClick={() => pick(r.id)}
                disabled={!!busy}
                className="text-left rounded-2xl bg-card p-6 ring-1 ring-border transition hover:-translate-y-0.5 hover:ring-brand-clay disabled:opacity-50 disabled:hover:translate-y-0"
              >
                <div className="size-10 rounded-xl bg-brand-green/10 text-brand-green grid place-items-center">
                  {isBusy ? <Loader2 className="size-5 animate-spin" /> : <Icon className="size-5" />}
                </div>
                <h3 className="mt-4 font-semibold">{r.label}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{r.desc}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Button variant="ghost" onClick={() => { void signOut(); navigate({ to: "/auth" }); }} className="text-xs text-muted-foreground">
            Use a different Google account
          </Button>
        </div>
      </div>
    </div>
  );
}
