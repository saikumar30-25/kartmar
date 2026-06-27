import { Link } from "@tanstack/react-router";
import { rupees } from "@/lib/format";
import { GradeBadge } from "./FreshnessBadge";
import type { ListingRow } from "@/lib/queries";
import placeholder from "@/assets/tomatoes.jpg";

type FarmerLite = { name: string | null; district: string | null; rating: number | null } | null;
type ListingCardRow = ListingRow & { farmer?: FarmerLite };

export function ProductCard({ listing }: { listing: ListingCardRow }) {
  const photo = listing.photo_url ?? placeholder;
  const farmerName = listing.farmer?.name ?? "Farmer";
  const rating = listing.farmer?.rating ?? 5;

  return (
    <Link
      to="/listings/$id"
      params={{ id: listing.id }}
      className="group block overflow-hidden rounded-2xl bg-card ring-1 ring-border transition hover:ring-brand-moss/40 hover:shadow-lg hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
        <img src={photo} alt={listing.product_name} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute top-3 left-3 flex gap-2">
          <GradeBadge grade={listing.quality_grade} />
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <h4 className="font-semibold text-base leading-tight truncate">{listing.product_name}</h4>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {farmerName} · {listing.district} · ★ {Number(rating).toFixed(1)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-bold text-brand-green text-rupee">{rupees(Number(listing.price_paise))}</p>
            <p className="text-[10px] text-muted-foreground">per {listing.unit}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{Number(listing.quantity)}{listing.unit} available</span>
          <span className="font-semibold text-brand-clay">View & bargain →</span>
        </div>
      </div>
    </Link>
  );
}
