import { freshnessTone } from "@/lib/format";

export function FreshnessBadge({ availableUntil }: { availableUntil: Date }) {
  const days = Math.ceil((new Date(availableUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const tone = freshnessTone(days);
  const map = {
    fresh: { bg: "bg-emerald-500/15 text-emerald-700 ring-emerald-600/20", label: "Fresh" },
    soon: { bg: "bg-amber-500/15 text-amber-700 ring-amber-600/20", label: "Sell soon" },
    urgent: { bg: "bg-orange-500/20 text-orange-700 ring-orange-600/30", label: "Urgent" },
  } as const;
  const s = map[tone];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${s.bg}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {s.label} · {days > 0 ? `${days}d` : "today"}
    </span>
  );
}

export function GradeBadge({ grade }: { grade: "A" | "B" | "C" }) {
  const map = {
    A: "bg-brand-green text-brand-cream",
    B: "bg-brand-moss text-brand-cream",
    C: "bg-stone-400 text-white",
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider ${map[grade]}`}>
      GRADE {grade}
    </span>
  );
}
