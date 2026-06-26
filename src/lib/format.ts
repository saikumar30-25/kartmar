// All money stored as paise (integer). Display as ₹X,XXX.XX
export function rupees(paise: number, opts: { decimals?: boolean } = {}) {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: opts.decimals ? 2 : 0,
    minimumFractionDigits: 0,
  }).format(rupees);
}

export function relativeDays(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "Expired";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `${diff} days left`;
}

export function freshnessTone(daysLeft: number): "fresh" | "soon" | "urgent" {
  if (daysLeft > 5) return "fresh";
  if (daysLeft >= 2) return "soon";
  return "urgent";
}
