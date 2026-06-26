import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Phone, Mail } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — AgriConnect" },
      { name: "description", content: "Sign in to your AgriConnect account." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-brand-cream">
      <div className="hidden lg:block bg-brand-green text-brand-cream p-12 relative overflow-hidden">
        <Link to="/" className="font-serif italic text-2xl">AgriConnect</Link>
        <div className="absolute bottom-12 left-12 right-12">
          <p className="font-serif italic text-3xl leading-tight">
            "Sold 200kg of tomatoes at a fair price without leaving my farm."
          </p>
          <p className="mt-4 text-sm opacity-80">— Venkata Reddy, Guntur</p>
        </div>
        <div className="absolute -right-20 -bottom-20 size-80 rounded-full bg-brand-moss/40 blur-3xl" />
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="lg:hidden font-serif italic text-2xl text-brand-green">AgriConnect</Link>
          <h1 className="mt-6 lg:mt-0 font-serif italic text-4xl text-brand-green">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to continue to your dashboard.</p>

          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              signIn(email || "demo@agriconnect.in");
              navigate({ to: "/home" });
            }}
          >
            <div>
              <Label htmlFor="email" className="text-xs uppercase tracking-wider">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@farm.in"
                className="mt-1 bg-card"
                required
              />
            </div>
            <div>
              <Label htmlFor="pw" className="text-xs uppercase tracking-wider">Password</Label>
              <Input id="pw" type="password" placeholder="anything works in demo" className="mt-1 bg-card" required />
            </div>
            <Button type="submit" className="w-full bg-brand-green hover:bg-brand-green/90 text-brand-cream h-11 font-bold">
              <Mail className="size-4 mr-2" /> Continue with email
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>

          <button
            disabled
            className="w-full h-11 rounded-md bg-card ring-1 ring-border text-sm font-semibold inline-flex items-center justify-center gap-2 opacity-60"
          >
            <Phone className="size-4" /> Phone OTP · Coming soon
          </button>

          <p className="mt-8 text-sm text-center text-muted-foreground">
            New here?{" "}
            <Link to="/signup" className="font-semibold text-brand-clay hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
