import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { advisorSeed } from "@/lib/mock-data";
import { useState } from "react";
import { Sparkles, Send } from "lucide-react";

export const Route = createFileRoute("/advisor")({
  head: () => ({ meta: [{ title: "AgriAdvisor — AgriConnect" }] }),
  component: () => (
    <AppShell>
      <Advisor />
    </AppShell>
  ),
});

type Msg = { from: "user" | "ai"; text: string };

const cannedReplies: Record<string, string> = {
  harvest: advisorSeed[0].a,
  onion: advisorSeed[1].a,
  price: advisorSeed[1].a,
  store: "For potatoes: dark, dry, ventilated space at 7–10°C. Avoid sunlight (turns them green). Keep away from onions — they spoil each other.",
};

function getReply(q: string) {
  const lower = q.toLowerCase();
  for (const k in cannedReplies) if (lower.includes(k)) return cannedReplies[k];
  return "Based on current trends in your district, hold for 3–5 days for better realisation. Want me to alert you when prices move?";
}

function Advisor() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "ai", text: "Hello! I'm AgriAdvisor. Ask me about prices, harvest timing, storage, or market trends." },
  ]);
  const [input, setInput] = useState("");

  const send = (text?: string) => {
    const q = (text ?? input).trim();
    if (!q) return;
    setMsgs((m) => [...m, { from: "user", text: q }]);
    setInput("");
    setTimeout(() => setMsgs((m) => [...m, { from: "ai", text: getReply(q) }]), 600);
  };

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
      <header className="mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-clay flex items-center gap-1.5">
          <Sparkles className="size-3" /> AI assistant
        </p>
        <h1 className="font-serif italic text-3xl text-brand-green mt-1">AgriAdvisor</h1>
      </header>

      <div className="flex-1 rounded-2xl bg-card ring-1 ring-border p-4 overflow-y-auto space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-snug ${
                m.from === "user" ? "bg-brand-green text-brand-cream" : "bg-stone-100 ring-1 ring-border"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {advisorSeed.map((s) => (
          <button
            key={s.q}
            onClick={() => send(s.q)}
            className="rounded-full bg-card ring-1 ring-border px-3 py-1.5 text-xs hover:ring-brand-clay/40"
          >
            {s.q}
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask about prices, harvest, storage…"
          className="bg-card"
        />
        <Button onClick={() => send()} className="bg-brand-clay text-white"><Send className="size-4" /></Button>
      </div>
    </div>
  );
}
