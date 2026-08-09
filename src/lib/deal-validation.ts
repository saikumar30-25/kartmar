// Client-side mirror of the database guard `private.deal_insert_valid`.
// Every deal insert must satisfy these rules; the database rejects anything
// that does not, so we validate up front to give a clear message instead of
// an opaque RLS/trigger error.

export type ListingRef = {
  id: string;
  farmer_id: string;
  price_paise: number;
  min_price_paise: number | null;
  quantity: number;
};

export type RequirementRef = {
  id: string;
  buyer_id: string;
  quantity: number;
  target_price_paise: number | null;
};

export type DealDraft = {
  listing_id?: string | null;
  requirement_id?: string | null;
  farmer_id: string;
  buyer_id: string;
  agreed_price_paise: number;
  total_paise: number;
  quantity: number;
};

export type ValidationResult = { ok: true } | { ok: false; reason: string };

const fail = (reason: string): ValidationResult => ({ ok: false, reason });

export function priceFloor(listing: Pick<ListingRef, "price_paise" | "min_price_paise">): number {
  return listing.min_price_paise ?? Math.round(listing.price_paise * 0.5);
}

/** Clamp a proposed price/quantity into the range the listing allows. */
export function clampToListing(
  listing: Pick<ListingRef, "price_paise" | "min_price_paise" | "quantity">,
  price: number,
  quantity: number,
) {
  const clampedPrice = Math.min(Math.max(price, priceFloor(listing)), listing.price_paise);
  const clampedQty = Math.min(quantity, listing.quantity);
  return { price: clampedPrice, quantity: clampedQty, total: clampedPrice * clampedQty };
}

export function validateDealDraft(
  draft: DealDraft,
  ctx: {
    /** id of the signed-in user creating the deal */
    actorId: string;
    listing?: ListingRef | null;
    requirement?: RequirementRef | null;
    /** true when an accepted interest request exists for this listing+buyer */
    hasAcceptedInterest?: boolean;
  },
): ValidationResult {
  const { actorId, listing, requirement } = ctx;

  if (!actorId) return fail("You must be signed in to create a deal.");
  if (!draft.buyer_id || !draft.farmer_id) return fail("Deal is missing the buyer or the seller.");
  if (draft.buyer_id === draft.farmer_id) return fail("Buyer and seller cannot be the same person.");
  if (actorId !== draft.buyer_id && actorId !== draft.farmer_id)
    return fail("Only the buyer or the seller can create this deal.");

  if (!Number.isFinite(draft.agreed_price_paise) || draft.agreed_price_paise <= 0)
    return fail("Agreed price must be a positive amount.");
  if (!Number.isFinite(draft.quantity) || draft.quantity <= 0)
    return fail("Quantity must be greater than zero.");
  if (draft.total_paise !== draft.agreed_price_paise * draft.quantity)
    return fail("Total must equal price × quantity.");

  if (draft.listing_id) {
    if (!listing || listing.id !== draft.listing_id) return fail("Listing not found.");
    if (draft.farmer_id !== listing.farmer_id)
      return fail("Seller does not match the owner of this listing.");
    if (draft.agreed_price_paise > listing.price_paise)
      return fail("Agreed price is above the listed price.");
    if (draft.agreed_price_paise < priceFloor(listing))
      return fail("Agreed price is below the seller's minimum.");
    if (draft.quantity > listing.quantity)
      return fail("Quantity is more than the available stock.");
    if (actorId === draft.farmer_id && !ctx.hasAcceptedInterest)
      return fail("Accept the buyer's interest request before creating the deal.");
    return { ok: true };
  }

  if (draft.requirement_id) {
    if (!requirement || requirement.id !== draft.requirement_id) return fail("Requirement not found.");
    if (requirement.buyer_id !== draft.buyer_id)
      return fail("Buyer does not match the owner of this requirement.");
    if (actorId !== draft.buyer_id)
      return fail("Only the buyer who posted the requirement can create this deal.");
    if (draft.quantity > requirement.quantity)
      return fail("Quantity is more than the buyer requested.");
    if (requirement.target_price_paise !== null && draft.agreed_price_paise > requirement.target_price_paise)
      return fail("Price is above the buyer's target price.");
    return { ok: true };
  }

  return fail("A deal must reference a listing or a requirement.");
}
