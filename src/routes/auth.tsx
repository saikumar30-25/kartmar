import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — AgriConnect" },
      { name: "description", content: "Sign in to AgriConnect with Google." },
    ],
  }),
  component: Auth,
});

function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

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
    // if redirected, browser navigates; otherwise the useEffect picks up the new session
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
          <h1 className="mt-6 lg:mt-0 font-serif italic text-4xl text-brand-green">Welcome</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with Google to continue. We'll ask you to pick a role afterwards.
          </p>

          <Button
            onClick={handleGoogle}
            disabled={busy || loading}
            className="mt-8 w-full h-12 bg-card text-foreground ring-1 ring-border hover:bg-card/90 font-semibold"
          >
            {busy ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <GoogleIcon className="size-5 mr-2" />
            )}
            Continue with Google
          </Button>

          <p className="mt-6 text-xs text-muted-foreground text-center leading-relaxed">
            One Google account = one role. After signing in you'll choose farmer, market owner, or delivery partner — that choice is permanent for this email.
          </p>
        </div>
      </div>
    </div>
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
