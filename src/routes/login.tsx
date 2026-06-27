import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail } from "lucide-react";
import { toast } from "sonner";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/home" });
  };

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

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <div>
              <Label htmlFor="email" className="text-xs uppercase tracking-wider">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@farm.in" className="mt-1 bg-card" required />
            </div>
            <div>
              <Label htmlFor="pw" className="text-xs uppercase tracking-wider">Password</Label>
              <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 bg-card" required minLength={6} />
            </div>
            <Button type="submit" disabled={busy} className="w-full bg-brand-green hover:bg-brand-green/90 text-brand-cream h-11 font-bold">
              <Mail className="size-4 mr-2" /> {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>

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
