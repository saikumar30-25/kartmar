import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import oxenImg from "@/assets/farmer-oxen.jpg";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Kartmar farmer marketplace" },
      { name: "description", content: "Sign in to Kartmar with Google or an email verification code to buy and sell farm produce directly." },
      { property: "og:title", content: "Sign in — Kartmar" },
      { property: "og:description", content: "Farmers, market owners and delivery partners trade directly on Kartmar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Auth,
});

function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"choose" | "email" | "code">("choose");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (!user.role) navigate({ to: "/select-role" });
    else navigate({ to: "/home" });
  }, [user, loading, navigate]);

  const handleGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth`,
    });
    if (result.error) {
      setBusy(false);
      toast.error(result.error.message || "Could not sign in with Google");
    }
  };

  const sendCode = async () => {
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(clean)) {
      toast.error("Enter a valid email address");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: clean,
      options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/auth` },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message || "Could not send the verification code");
      return;
    }
    setMode("code");
    toast.success("Verification code sent. Check your inbox.");
  };

  const verifyCode = async () => {
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    if (error) {
      toast.error(error.message || "Wrong or expired code");
      return;
    }
    toast.success("Email verified");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-brand-cream">
      <div className="hidden lg:block relative overflow-hidden">
        <img
          src={oxenImg}
          alt="Indian farmer ploughing a field with a pair of oxen at sunrise"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-green via-brand-green/60 to-brand-green/10" />
        <div className="relative h-full p-12 flex flex-col justify-between text-brand-cream">
          <Link to="/" className="font-serif italic text-2xl drop-shadow">Kartmar</Link>
          <div>
            <p className="font-serif italic text-3xl leading-tight drop-shadow">
              "Sold 200kg of tomatoes at a fair price without leaving my farm."
            </p>
            <p className="mt-4 text-sm opacity-90">— Venkata Reddy, Guntur</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="lg:hidden font-serif italic text-2xl text-brand-green">Kartmar</Link>
          <h1 className="mt-6 lg:mt-0 font-serif italic text-4xl text-brand-green">Welcome</h1>

          {mode === "choose" && (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign in to continue. We'll ask you to pick a role afterwards.
              </p>
              <Button
                onClick={handleGoogle}
                disabled={busy || loading}
                className="mt-8 w-full h-12 bg-card text-foreground ring-1 ring-border hover:bg-card/90 font-semibold"
              >
                {busy ? <Loader2 className="size-4 mr-2 animate-spin" /> : <GoogleIcon className="size-5 mr-2" />}
                Continue with Google
              </Button>

              <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
              </div>

              <Button
                variant="outline"
                onClick={() => setMode("email")}
                className="w-full h-12 font-semibold border-brand-moss/40 text-brand-green"
              >
                <Mail className="size-4 mr-2" /> Sign up with email code
              </Button>
            </>
          )}

          {mode === "email" && (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                We'll email you a one-time verification code — no password to remember.
              </p>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-6 h-12"
                autoComplete="email"
              />
              <Button onClick={sendCode} disabled={busy} className="mt-3 w-full h-12 bg-brand-green text-brand-cream font-bold">
                {busy ? "Sending…" : "Send verification code"}
              </Button>
              <BackLink onClick={() => setMode("choose")} />
            </>
          )}

          {mode === "code" && (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter the code we sent to <strong>{email}</strong>. Clicking the link in that email works too.
              </p>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\s/g, "").slice(0, 10))}
                placeholder="Verification code"
                inputMode="numeric"
                className="mt-6 h-14 text-center text-2xl tracking-[0.3em] font-extrabold"
              />
              <Button onClick={verifyCode} disabled={busy || code.length < 6} className="mt-3 w-full h-12 bg-brand-green text-brand-cream font-bold">
                {busy ? "Verifying…" : "Verify & continue"}
              </Button>
              <button onClick={sendCode} disabled={busy} className="mt-3 w-full text-xs text-brand-clay font-semibold">
                Resend code
              </button>
              <BackLink onClick={() => setMode("email")} />
            </>
          )}

          <p className="mt-6 text-xs text-muted-foreground text-center leading-relaxed">
            One account = one role. After signing in you'll choose farmer, market owner, or delivery partner — that choice is permanent for this email.
          </p>
        </div>
      </div>
    </div>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-brand-green">
      <ArrowLeft className="size-3.5" /> Back
    </button>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.95l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
