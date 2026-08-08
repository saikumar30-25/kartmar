import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useMyListings, useUpdateListing, useDeleteListing, useRequireAuth, useForbidPartner } from "@/lib/queries";
import { rupees } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, Trash2, Check, X, Plus, PackageOpen, MapPin, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/my-listings")({
  head: () => ({ meta: [{ title: "My listings — Kartmar" }] }),
  component: () => (
    <AppShell>
      <MyListings />
    </AppShell>
  ),
});

function MyListings() {
  const { user } = useRequireAuth();
  useForbidPartner();
  const { data: allListings = [], isLoading } = useMyListings();
  // Delivered orders mark the listing sold — it leaves the active board automatically.
  const listings = allListings.filter((l) => l.status !== "sold");
  const soldCount = allListings.length - listings.length;

  if (!user) return null;
  if (isLoading) return <div className="py-20 grid place-items-center"><Loader2 className="size-6 animate-spin" /></div>;


  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-moss">Manage products</p>
          <h1 className="font-serif italic text-4xl text-brand-green mt-1">My listings</h1>
          <p className="text-sm text-muted-foreground mt-1">Update today's price or remove sold-out stock.</p>
        </div>
        <Link
          to="/post-listing"
          className="rounded-xl bg-brand-clay text-white px-4 py-2.5 text-sm font-bold shadow-lg shadow-brand-clay/20 hover:bg-brand-clay/90 inline-flex items-center gap-2"
        >
          <Plus className="size-4" /> Post new product
        </Link>
      </header>

      {listings.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground rounded-2xl bg-card ring-1 ring-border">
          <PackageOpen className="size-12 mx-auto opacity-40" />
          <p className="mt-3 font-semibold">No listings yet</p>
          <p className="text-sm">Post your first harvest to reach buyers.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {listings.map((l) => <ListingCard key={l.id} l={l} />)}
        </div>
      )}
    </div>
  );
}

function ListingCard({ l }: { l: any }) {
  const update = useUpdateListing();
  const del = useDeleteListing();
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(String(Math.round(Number(l.price_paise) / 100)));
  const [floor, setFloor] = useState(String(Math.round(Number(l.min_price_paise ?? l.price_paise * 0.78) / 100)));
  const [qty, setQty] = useState(String(l.quantity));

  const save = async () => {
    const p = Number(price), f = Number(floor), q = Number(qty);
    if (!p || p <= 0) return toast.error("Enter a valid price");
    if (f > p) return toast.error("Floor cannot be higher than display price");
    try {
      await update.mutateAsync({
        id: l.id,
        patch: {
          price_paise: p * 100,
          min_price_paise: f * 100,
          quantity: q,
        },
      });
      toast.success("Updated — buyers will see the new price");
      setEditing(false);
    } catch (e: any) {
      toast.error(e.message ?? "Update failed");
    }
  };

  const remove = async () => {
    try {
      await del.mutateAsync(l.id);
      toast.success("Listing removed");
    } catch (e: any) {
      toast.error(e.message ?? "Delete failed");
    }
  };

  return (
    <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden">
      <div className="flex gap-3 p-3">
        {l.photo_url ? (
          <img src={l.photo_url} alt={l.product_name} className="size-20 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="size-20 rounded-lg bg-brand-moss/15 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-moss">{l.category}</p>
          <p className="font-semibold truncate">{l.product_name}</p>
          <p className="text-xs text-muted-foreground truncate flex items-center gap-1"><MapPin className="size-3" />{l.district}, {l.state}</p>
          <p className="mt-1 text-sm font-bold text-brand-green text-rupee">
            {rupees(Number(l.price_paise))}<span className="text-xs font-normal text-muted-foreground">/{l.unit}</span>
            <span className="ml-2 text-[10px] font-normal text-muted-foreground">Floor {rupees(Number(l.min_price_paise ?? 0))}</span>
          </p>
          <p className="text-xs text-muted-foreground">Stock: {l.quantity} {l.unit}</p>
        </div>
      </div>

      {editing ? (
        <div className="border-t border-border p-3 space-y-2 bg-brand-cream/40">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Today's price ₹/{l.unit}</label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Floor ₹/{l.unit}</label>
              <Input type="number" value={floor} onChange={(e) => setFloor(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Stock ({l.unit})</label>
              <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={update.isPending} className="bg-brand-green text-brand-cream flex-1">
              <Check className="size-3.5 mr-1" /> Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
              <X className="size-3.5 mr-1" /> Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-t border-border p-3 flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="flex-1">
            <TrendingUp className="size-3.5 mr-1" /> Update today's price
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="text-rose-700 hover:text-rose-800 hover:bg-rose-50">
                <Trash2 className="size-3.5 mr-1" /> Remove
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove this listing?</AlertDialogTitle>
                <AlertDialogDescription>
                  Buyers will no longer see <strong>{l.product_name}</strong>. Use this when stock is finished. You can post it again anytime.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={remove} className="bg-rose-600 hover:bg-rose-700">Remove listing</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
      <Pencil className="hidden" />
    </div>
  );
}
