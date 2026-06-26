import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "farmer" | "owner" | "partner" | "admin";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  district: string;
  state: string;
  avatar?: string;
  rating: number;
  isVerified: boolean;
};

type AuthCtx = {
  user: AuthUser | null;
  signIn: (email: string) => void;
  signOut: () => void;
  setRole: (role: Role) => void;
};

const Ctx = createContext<AuthCtx | null>(null);
const KEY = "agriconnect.user";

const demoUser: AuthUser = {
  id: "u_demo",
  name: "Ravi Kumar",
  email: "ravi@example.com",
  phone: "+91 98765 43210",
  role: "farmer",
  district: "Warangal",
  state: "Telangana",
  rating: 4.8,
  isVerified: true,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const save = (u: AuthUser | null) => {
    setUser(u);
    if (u) localStorage.setItem(KEY, JSON.stringify(u));
    else localStorage.removeItem(KEY);
  };

  return (
    <Ctx.Provider
      value={{
        user,
        signIn: (email) => save({ ...demoUser, email, name: email.split("@")[0] || demoUser.name }),
        signOut: () => save(null),
        setRole: (role) => user && save({ ...user, role }),
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
