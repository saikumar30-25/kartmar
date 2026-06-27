import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Bell, Home, Search, MessageCircle, User, LogOut, Sprout, ShoppingBasket, Truck, Shield } from "lucide-react";
import { useAuth, type Role } from "@/lib/auth";
import { useState, type ReactNode } from "react";
const notifications: Array<{ id: string; message: string; read: boolean }> = [];
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const roleLabels: Record<Role, { label: string; icon: typeof Sprout }> = {
  farmer: { label: "Farmer", icon: Sprout },
  owner: { label: "Buyer", icon: ShoppingBasket },
  partner: { label: "Driver", icon: Truck },
  admin: { label: "Admin", icon: Shield },
};

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut, setRole } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [openNotif, setOpenNotif] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center bg-brand-cream">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please sign in to continue</p>
          <Link to="/login" className="rounded-lg bg-brand-green text-brand-cream px-4 py-2 text-sm font-semibold">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const RoleIcon = roleLabels[user.role].icon;
  const unread = notifications.filter((n) => !n.read).length;

  const tabs = [
    { to: "/home", label: "Home", icon: Home },
    { to: "/browse", label: "Browse", icon: Search },
    { to: "/deals", label: "Deals", icon: MessageCircle },
    { to: "/profile", label: "Profile", icon: User },
  ] as const;

  return (
    <div className="min-h-screen bg-brand-cream text-foreground pb-24 lg:pb-8">
      <header className="sticky top-0 z-40 border-b border-border bg-brand-cream/85 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <Link to="/home" className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-brand-green text-brand-cream grid place-items-center font-serif text-xl italic">
                A
              </div>
              <div className="leading-tight">
                <p className="font-serif italic text-xl text-brand-green">AgriConnect</p>
                <p className="text-[10px] uppercase tracking-widest text-brand-moss font-semibold">
                  {user.district} · {user.state}
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger className="hidden sm:flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-xs font-semibold ring-1 ring-border hover:ring-brand-moss/40">
                  <RoleIcon className="size-3.5 text-brand-clay" />
                  {roleLabels[user.role].label}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="text-xs">Switch role (demo)</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(Object.keys(roleLabels) as Role[]).map((r) => {
                    const Icon = roleLabels[r].icon;
                    return (
                      <DropdownMenuItem
                        key={r}
                        onClick={() => {
                          setRole(r);
                          if (r === "partner") navigate({ to: "/partner" });
                          else if (r === "admin") navigate({ to: "/admin" });
                          else navigate({ to: "/home" });
                        }}
                      >
                        <Icon className="size-3.5 mr-2 text-brand-clay" />
                        {roleLabels[r].label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu open={openNotif} onOpenChange={setOpenNotif}>
                <DropdownMenuTrigger className="relative size-9 grid place-items-center rounded-full bg-card ring-1 ring-border hover:ring-brand-moss/40">
                  <Bell className="size-4" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-brand-clay text-[9px] font-bold text-white grid place-items-center">
                      {unread}
                    </span>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.map((n) => (
                    <DropdownMenuItem key={n.id} className="flex items-start gap-2 py-2">
                      <span className={`mt-1 size-1.5 rounded-full ${n.read ? "bg-muted-foreground/30" : "bg-brand-clay"}`} />
                      <span className="text-xs leading-snug whitespace-normal">{n.message}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger className="size-9 rounded-full bg-brand-moss/15 text-brand-green text-xs font-bold grid place-items-center ring-1 ring-border">
                  {user.name.slice(0, 2).toUpperCase()}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-[10px] font-normal text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                    <User className="size-3.5 mr-2" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/advisor" })}>
                    <MessageCircle className="size-3.5 mr-2" /> AgriAdvisor
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      signOut();
                      navigate({ to: "/" });
                    }}
                  >
                    <LogOut className="size-3.5 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6">{children}</main>

      <nav className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border lg:hidden">
        <div className="grid grid-cols-4">
          {tabs.map((t) => {
            const active = pathname === t.to;
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`flex flex-col items-center gap-1 py-3 text-[10px] font-semibold uppercase tracking-wider transition ${
                  active ? "text-brand-clay" : "text-muted-foreground"
                }`}
              >
                <Icon className="size-5" />
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
