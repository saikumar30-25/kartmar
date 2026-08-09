import { describe, expect, it } from "vitest";
import { clampToListing, validateDealDraft, type ListingRef, type RequirementRef } from "./deal-validation";

const FARMER = "11111111-1111-1111-1111-111111111111";
const BUYER = "22222222-2222-2222-2222-222222222222";
const STRANGER = "33333333-3333-3333-3333-333333333333";

const listing: ListingRef = {
  id: "listing-1",
  farmer_id: FARMER,
  price_paise: 5000, // ₹50 / unit
  min_price_paise: 4000, // ₹40 / unit
  quantity: 100,
};

const requirement: RequirementRef = {
  id: "req-1",
  buyer_id: BUYER,
  quantity: 50,
  target_price_paise: 6000,
};

const draft = (over: Partial<Parameters<typeof validateDealDraft>[0]> = {}) => ({
  listing_id: listing.id,
  farmer_id: FARMER,
  buyer_id: BUYER,
  quantity: 10,
  agreed_price_paise: 5000,
  total_paise: 50000,
  ...over,
});

describe("validateDealDraft — listing deals", () => {
  it("accepts a buyer-created deal at the listed price", () => {
    expect(validateDealDraft(draft(), { actorId: BUYER, listing })).toEqual({ ok: true });
  });

  it("accepts a negotiated price inside the seller's range", () => {
    const d = draft({ agreed_price_paise: 4200, total_paise: 42000 });
    expect(validateDealDraft(d, { actorId: BUYER, listing }).ok).toBe(true);
  });

  it("rejects a price above the listed price", () => {
    const d = draft({ agreed_price_paise: 5001, total_paise: 50010 });
    expect(validateDealDraft(d, { actorId: BUYER, listing }).ok).toBe(false);
  });

  it("rejects a price below the seller's minimum", () => {
    const d = draft({ agreed_price_paise: 100, total_paise: 1000 });
    expect(validateDealDraft(d, { actorId: BUYER, listing }).ok).toBe(false);
  });

  it("uses half the listed price as the floor when no minimum is set", () => {
    const noMin = { ...listing, min_price_paise: null };
    expect(validateDealDraft(draft({ agreed_price_paise: 2500, total_paise: 25000 }), { actorId: BUYER, listing: noMin }).ok).toBe(true);
    expect(validateDealDraft(draft({ agreed_price_paise: 2499, total_paise: 24990 }), { actorId: BUYER, listing: noMin }).ok).toBe(false);
  });

  it("rejects zero or negative pricing and quantities", () => {
    expect(validateDealDraft(draft({ agreed_price_paise: 0, total_paise: 0 }), { actorId: BUYER, listing }).ok).toBe(false);
    expect(validateDealDraft(draft({ quantity: 0, total_paise: 0 }), { actorId: BUYER, listing }).ok).toBe(false);
    expect(validateDealDraft(draft({ quantity: -5, total_paise: -25000 }), { actorId: BUYER, listing }).ok).toBe(false);
  });

  it("rejects a total that does not equal price × quantity", () => {
    expect(validateDealDraft(draft({ total_paise: 1 }), { actorId: BUYER, listing }).ok).toBe(false);
  });

  it("rejects a quantity larger than available stock", () => {
    const d = draft({ quantity: 101, total_paise: 5000 * 101 });
    expect(validateDealDraft(d, { actorId: BUYER, listing }).ok).toBe(false);
  });

  it("rejects a fabricated seller identity", () => {
    const d = draft({ farmer_id: STRANGER });
    expect(validateDealDraft(d, { actorId: BUYER, listing }).ok).toBe(false);
  });

  it("rejects a stranger creating a deal between two other people", () => {
    expect(validateDealDraft(draft(), { actorId: STRANGER, listing }).ok).toBe(false);
  });

  it("rejects buyer and seller being the same account", () => {
    const d = draft({ buyer_id: FARMER });
    expect(validateDealDraft(d, { actorId: FARMER, listing }).ok).toBe(false);
  });

  it("rejects a missing or mismatched listing", () => {
    expect(validateDealDraft(draft(), { actorId: BUYER, listing: null }).ok).toBe(false);
    expect(validateDealDraft(draft(), { actorId: BUYER, listing: { ...listing, id: "other" } }).ok).toBe(false);
  });

  it("lets the seller create the deal only after accepting the interest", () => {
    expect(validateDealDraft(draft(), { actorId: FARMER, listing }).ok).toBe(false);
    expect(validateDealDraft(draft(), { actorId: FARMER, listing, hasAcceptedInterest: true }).ok).toBe(true);
  });
});

describe("validateDealDraft — requirement deals", () => {
  const rDraft = (over = {}) => ({
    listing_id: null,
    requirement_id: requirement.id,
    farmer_id: FARMER,
    buyer_id: BUYER,
    quantity: 20,
    agreed_price_paise: 5000,
    total_paise: 100000,
    ...over,
  });

  it("accepts the requirement owner creating the deal", () => {
    expect(validateDealDraft(rDraft(), { actorId: BUYER, requirement }).ok).toBe(true);
  });

  it("rejects someone else's requirement", () => {
    expect(validateDealDraft(rDraft({ buyer_id: STRANGER }), { actorId: STRANGER, requirement }).ok).toBe(false);
  });

  it("rejects a price above the buyer's target price", () => {
    expect(validateDealDraft(rDraft({ agreed_price_paise: 6001, total_paise: 6001 * 20 }), { actorId: BUYER, requirement }).ok).toBe(false);
  });

  it("rejects a quantity above what was requested", () => {
    expect(validateDealDraft(rDraft({ quantity: 51, total_paise: 5000 * 51 }), { actorId: BUYER, requirement }).ok).toBe(false);
  });

  it("rejects a deal with neither listing nor requirement", () => {
    expect(validateDealDraft(rDraft({ requirement_id: null }), { actorId: BUYER }).ok).toBe(false);
  });
});

describe("clampToListing", () => {
  it("clamps price into range and quantity to stock, keeping totals consistent", () => {
    expect(clampToListing(listing, 9999, 500)).toEqual({ price: 5000, quantity: 100, total: 500000 });
    expect(clampToListing(listing, 10, 5)).toEqual({ price: 4000, quantity: 5, total: 20000 });
  });

  it("produces a draft the validator always accepts", () => {
    const c = clampToListing(listing, 99999, 9999);
    const res = validateDealDraft(
      {
        listing_id: listing.id,
        farmer_id: FARMER,
        buyer_id: BUYER,
        quantity: c.quantity,
        agreed_price_paise: c.price,
        total_paise: c.total,
      },
      { actorId: BUYER, listing },
    );
    expect(res).toEqual({ ok: true });
  });
});
