import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth, type Role } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sprout, ShoppingBasket, Truck } from "lucide-react";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your AgriConnect account" },
      { name: "description", content: "Join AgriConnect as a farmer, market owner, or delivery partner." },
    ],
  }),
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  const { signIn, setRole } = useAuth();
  const [step, setStep] = useState<"form" | "role">("form");
  const [email, setEmail] = useState("");

  if (step === "form") {
    return (
      <div className="min-h-screen grid place-items-center bg-brand-cream p-6">
        <div className="w-full max-w-sm">
          <Link to="/" className="font-serif italic text-2xl text-brand-green">AgriConnect</Link>
          <h1 className="mt-6 font-serif italic text-4xl text-brand-green">Create account</h1>
          <p className="mt-2 text-sm text-muted-foreground">Demo signup — any email accepted.</p>
          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              signIn(email || "new@agriconnect.in");
              setStep("role");
            }}
          >
            <div>
              <Label className="text-xs uppercase tracking-wider">Full name</Label>
              <Input placeholder="Your name" className="mt-1 bg-card" required />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@farm.in" className="mt-1 bg-card" required />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Password</Label>
              <Input type="password" placeholder="any password" className="mt-1 bg-card" required />
            </div>
            <Button type="submit" className="w-full bg-brand-green text-brand-cream h-11 font-bold">
              Continue
            </Button>
          </form>
          <p className="mt-6 text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-brand-clay">Sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  const roles: { id: Role; label: string; desc: string; icon: typeof Sprout }[] = [
    { id: "farmer", label: "I'm a farmer", desc: "List my produce and sell to nearby buyers.", icon: Sprout },
    { id: "owner", label: "I'm a market owner", desc: "Buy fresh produce for my shop or restaurant.", icon: ShoppingBasket },
    { id: "partner", label: "I'm a delivery partner", desc: "Use my vehicle to earn from transport trips.", icon: Truck },
  ];

  return (
    <div className="min-h-screen grid place-items-center bg-brand-cream p-6">
      <div className="w-full max-w-2xl">
        <h1 className="font-serif italic text-4xl text-brand-green text-center">What brings you to AgriConnect?</h1>
        <p className="text-center text-sm text-muted-foreground mt-2">Pick a role to customize your dashboard.</p>
        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          {roles.map((r) => {
            const Icon = r.icon;
            return (
              <button
                key={r.id}
                onClick={() => {
                  setRole(r.id);
                  navigate({ to: r.id === "partner" ? "/partner" : "/home" });
                }}
                className="text-left rounded-2xl bg-card p-6 ring-1 ring-border hover:ring-brand-clay/50 hover:-translate-y-0.5 transition"
              >
                <div className="size-10 rounded-xl bg-brand-green/10 text-brand-green grid place-items-center">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 font-semibold">{r.label}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{r.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
