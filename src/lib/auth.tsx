import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type Role = "farmer" | "owner" | "partner" | "admin";

export type Profile = {
  id: string;
  name: string;
  phone: string | null;
  district: string | null;
  state: string | null;
  avatar_url: string | null;
  rating: number;
  is_verified: boolean;
};

export type AuthUser = Profile & {
  email: string;
  role: Role | null;
};


type AuthCtx = {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  setRole: (role: Role) => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

async function fetchProfile(authUser: User): Promise<AuthUser | null> {
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", authUser.id),
  ]);
  if (!profile) return null;
  const role = (roles?.[0]?.role as Role | undefined) ?? null;

  return {
    id: profile.id,
    name: profile.name,
    phone: profile.phone,
    district: profile.district,
    state: profile.state,
    avatar_url: profile.avatar_url,
    rating: Number(profile.rating ?? 5),
    is_verified: profile.is_verified,
    email: authUser.email ?? "",
    role,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = async (s: Session | null) => {
    setSession(s);
    if (!s?.user) {
      setUser(null);
      setLoading(false);
      return;
    }
    const p = await fetchProfile(s.user);
    setUser(p);
    setLoading(false);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      // Defer fetch to avoid potential deadlocks
      setTimeout(() => void hydrate(s), 0);
    });
    supabase.auth.getSession().then(({ data }) => void hydrate(data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  const refresh = async () => {
    const { data } = await supabase.auth.getSession();
    await hydrate(data.session);
  };

  const setRole = async (role: Role) => {
    if (!user) return;
    await supabase.from("user_roles").delete().eq("user_id", user.id);
    await supabase.from("user_roles").insert({ user_id: user.id, role });
    setUser({ ...user, role });
  };

  return (
    <Ctx.Provider
      value={{
        user,
        session,
        loading,
        signOut: async () => {
          await supabase.auth.signOut();
        },
        setRole,
        refresh,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
