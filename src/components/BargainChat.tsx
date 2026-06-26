import { useEffect, useState } from "react";
import { rupees } from "@/lib/format";
import type { Listing } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles } from "lucide-react";

type Msg = { from: "buyer" | "ai"; text: string };

export function BargainChat({ listing, onAccept }: { listing: Listing; onAccept: (price: number) => void }) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      from: "ai",
      text: `Hello! ${listing.productName} is ${rupees(listing.displayPrice)}/${listing.unit} for ${listing.quantity}${listing.unit}. Are you interested?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [round, setRound] = useState(0);
  const [closed, setClosed] = useState(false);

  // Simple deterministic negotiation
  const respondToOffer = (offerPaise: number): { text: string; offer?: number; done?: boolean } => {
    const { floorPrice, acceptPrice, displayPrice } = listing;
    if (offerPaise < floorPrice) {
      return {
        text: `I'm sorry, ${rupees(offerPaise)} is below what I can accept. The best I can offer is ${rupees(
          Math.round((displayPrice + acceptPrice) / 2),
        )}/${listing.unit}. Would that work?`,
      };
    }
    if (offerPaise >= acceptPrice) {
      return { text: `Done — ${rupees(offerPaise)}/${listing.unit} works. Confirming the deal now.`, offer: offerPaise, done: true };
    }
    // counter
    const counter = Math.round(acceptPrice + (displayPrice - acceptPrice) * Math.max(0, 0.4 - round * 0.1));
    return {
      text: `That's close, but I'd need at least ${rupees(counter)}/${listing.unit}. Can you meet me there?`,
      offer: counter,
    };
  };

  const send = () => {
    if (!input.trim() || closed) return;
    const parsed = Number(input.replace(/[^0-9.]/g, ""));
    const offerPaise = Math.round((parsed || 0) * 100);
    setMessages((m) => [...m, { from: "buyer", text: input.trim() }]);
    setInput("");
    setTimeout(() => {
      const reply = respondToOffer(offerPaise);
      setMessages((m) => [...m, { from: "ai", text: reply.text }]);
      setRound((r) => r + 1);
      if (reply.done && reply.offer) {
        setClosed(true);
        setTimeout(() => onAccept(reply.offer!), 600);
      }
      if (round >= 4 && !reply.done) {
        setMessages((m) => [
          ...m,
          { from: "ai", text: `That's my final offer at ${rupees(acceptPriceFor(listing))}/${listing.unit}. Tap accept to confirm.` },
        ]);
        setClosed(true);
      }
    }, 700);
  };

  useEffect(() => {
    const el = document.getElementById("bargain-scroll");
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div className="rounded-3xl bg-card ring-1 ring-border overflow-hidden flex flex-col h-[560px]">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <div className="size-9 grid place-items-center rounded-full bg-brand-clay/15 text-brand-clay">
          <Sparkles className="size-4" />
        </div>
        <div className="leading-tight">
          <p className="font-semibold text-sm">AgriBot Negotiator</p>
          <p className="text-[10px] uppercase tracking-wider text-brand-moss">Negotiating on behalf of {listing.farmer.name}</p>
        </div>
      </div>

      <div id="bargain-scroll" className="flex-1 overflow-y-auto p-5 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === "buyer" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-snug ${
                m.from === "buyer"
                  ? "bg-brand-green text-brand-cream rounded-tr-sm"
                  : "bg-stone-100 text-foreground rounded-tl-sm ring-1 ring-border"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border p-3 flex gap-2 bg-brand-cream/40">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={closed ? "Negotiation closed" : `Offer in ₹ per ${listing.unit}…`}
          disabled={closed}
          className="bg-card"
        />
        <Button onClick={send} disabled={closed || !input.trim()} className="bg-brand-clay hover:bg-brand-clay/90 text-white">
          Send
        </Button>
      </div>
    </div>
  );
}

function acceptPriceFor(l: Listing) {
  return l.acceptPrice;
}
