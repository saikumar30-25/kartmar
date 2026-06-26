import { Link } from "@tanstack/react-router";
import type { Listing } from "@/lib/mock-data";
import { rupees } from "@/lib/format";
import { FreshnessBadge, GradeBadge } from "./FreshnessBadge";

export function ProductCard({ listing }: { listing: Listing }) {
  return (
    <Link
      to="/listings/$id"
      params={{ id: listing.id }}
      className="group block overflow-hidden rounded-2xl bg-card ring-1 ring-border transition hover:ring-brand-moss/40 hover:shadow-lg hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
        <img
          src={listing.photo}
          alt={listing.productName}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <GradeBadge grade={listing.qualityGrade} />
          <FreshnessBadge availableUntil={listing.availableUntil} />
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <h4 className="font-semibold text-base leading-tight truncate">
              {listing.productName}
              {listing.telugu && <span className="text-muted-foreground text-sm font-normal ml-1.5">{listing.telugu}</span>}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {listing.farmer.name} · {listing.distanceKm}km · ★ {listing.farmer.rating}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-bold text-brand-green text-rupee">{rupees(listing.displayPrice)}</p>
            <p className="text-[10px] text-muted-foreground">per {listing.unit}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Min {Math.min(listing.quantity, 50)}{listing.unit}</span>
          <span className="font-semibold text-brand-clay">Start bargaining →</span>
        </div>
      </div>
    </Link>
  );
}
