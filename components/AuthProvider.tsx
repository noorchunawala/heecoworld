"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/lib/SupabaseClient";

export type AuthStatus =
  | "loading"
  | "guest"
  | "profile_incomplete"
  | "authenticated";

type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  user_type: string;
  mobile: string | null;
  country_code: string | null;
  is_profile_complete: boolean;
};

type AuthContextType = {
  status: AuthStatus;
  user: any;
  profile: UserProfile | null;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const refresh = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUser(null);
      setProfile(null);
      setStatus("guest");
      return;
    }

    setUser(user);

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || !profile.is_profile_complete) {
      setProfile(profile);
      setStatus("profile_incomplete");
      return;
    }

    setProfile(profile);
    setStatus("authenticated");
  };

  useEffect(() => {
    refresh();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        profile,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}