import { createFileRoute, Link } from "@tanstack/react-router";
import hero from "@/assets/hero.jpg";
import { Sprout, ShoppingBasket, Truck, Sparkles, IndianRupee, Shield } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgriConnect — Connecting Indian farmers and buyers" },
      { name: "description", content: "AI-powered bargaining, integrated transport, and UPI escrow payments for farm produce across India." },
      { property: "og:title", content: "AgriConnect" },
      { property: "og:description", content: "AI-powered bargaining, integrated transport, and UPI escrow payments for farm produce across India." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-brand-cream text-foreground">
      <header className="sticky top-0 z-30 bg-brand-cream/85 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-brand-green text-brand-cream grid place-items-center font-serif text-xl italic">
              A
            </div>
            <span className="font-serif italic text-xl text-brand-green">AgriConnect</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="text-sm font-semibold text-brand-green hover:text-brand-clay">
              Sign in
            </Link>
            <Link
              to="/auth"
              className="rounded-lg bg-brand-green text-brand-cream px-4 py-2 text-sm font-semibold hover:bg-brand-green/90"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 pt-12 pb-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-moss/15 text-brand-green px-3 py-1 text-xs font-semibold tracking-wider uppercase">
              <span className="size-1.5 rounded-full bg-brand-clay" />
              Built for India · ఇండియా · भारत
            </span>
            <h1 className="mt-5 font-serif text-5xl sm:text-6xl italic leading-[1.05] text-balance text-brand-green">
              Fair prices, smart bargaining, real harvests.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl text-pretty">
              AgriConnect connects farmers directly with shops, restaurants, and mandis — with an AI negotiator that
              protects your bottom line and transport that comes to you.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/auth"
                className="rounded-xl bg-brand-clay text-white px-5 py-3 text-sm font-bold shadow-lg shadow-brand-clay/20 hover:bg-brand-clay/90"
              >
                Sell my produce
              </Link>
              <Link
                to="/auth"
                className="rounded-xl bg-card ring-1 ring-border px-5 py-3 text-sm font-bold hover:ring-brand-moss/40"
              >
                Buy from farmers
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Demo: any email + password works. No verification needed.
            </p>
          </div>
          <div className="relative">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden ring-1 ring-border shadow-2xl shadow-brand-green/15">
              <img src={hero} alt="Indian farmer in green fields at sunrise" className="size-full object-cover" />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-card rounded-2xl shadow-xl shadow-brand-green/10 p-4 ring-1 ring-border w-64 hidden sm:block">
              <p className="text-[10px] uppercase tracking-widest text-brand-moss font-bold">Latest deal</p>
              <p className="text-sm font-semibold mt-1">200kg Tomatoes · ₹110/kg</p>
              <p className="text-xs text-muted-foreground mt-0.5">Guntur → Hyderabad · 4h ago</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card/50">
        <div className="mx-auto max-w-6xl px-6 py-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Sparkles, title: "AI bargaining", body: "An AI negotiator works your floor price up — buyers never see your minimum." },
            { icon: Truck, title: "Built-in transport", body: "Verified delivery partners across districts. Fare quoted upfront." },
            { icon: IndianRupee, title: "UPI escrow", body: "Buyers pay into escrow. We release to your UPI after delivery." },
            { icon: Shield, title: "Quality grading", body: "A/B/C grades with AI-checked photos to build buyer trust." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl bg-card p-5 ring-1 ring-border">
              <f.icon className="size-6 text-brand-clay" />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-serif italic text-4xl text-brand-green text-center">Three ways to use AgriConnect</h2>
        <div className="mt-10 grid md:grid-cols-3 gap-5">
          {[
            { icon: Sprout, role: "Farmer", body: "List your harvest. Set a floor price. Let the AI bargain while you work the field." },
            { icon: ShoppingBasket, role: "Market Owner", body: "Post what you need. Browse nearby produce. Pay safely via escrow." },
            { icon: Truck, role: "Delivery Partner", body: "Use your vehicle to earn. Accept trips matched to your area and capacity." },
          ].map((c) => (
            <div key={c.role} className="rounded-3xl bg-card p-6 ring-1 ring-border">
              <div className="size-10 rounded-xl bg-brand-green/10 text-brand-green grid place-items-center">
                <c.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold text-lg">{c.role}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link
            to="/auth"
            className="inline-flex items-center justify-center rounded-xl bg-brand-green text-brand-cream px-6 py-3 text-sm font-bold hover:bg-brand-green/90"
          >
            Create your account
          </Link>
        </div>
      </section>

      <footer className="border-t border-border bg-brand-green/5">
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-wrap justify-between gap-3 text-xs text-muted-foreground">
          <p>© AgriConnect · Built for Indian agriculture</p>
          <p>Demo prototype — not yet processing real payments</p>
        </div>
      </footer>
    </div>
  );
}
