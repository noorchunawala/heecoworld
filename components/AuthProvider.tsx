"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
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

type SchoolAccessItem = {
  role?: string | null;
  status?: string | null;
};

type SchoolPortalResponse = {
  schools?: SchoolAccessItem[];
  memberships?: SchoolAccessItem[];
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

  const refresh = useCallback(async () => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      setUser(null);
      setProfile(null);
      setStatus("guest");
      return;
    }

    setUser(currentUser);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;

    /*
      First: check whether this user is an active teacher or school admin.

      A teacher/school admin does not need a learner profile, so they must
      become "authenticated" even when user_profiles is missing or incomplete.
    */
    if (accessToken) {
      try {
        const response = await fetch("/api/school-portal/me", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        });

        const result =
          (await response.json().catch(() => null)) as SchoolPortalResponse | null;

        const schoolAccess = result?.schools ?? result?.memberships ?? [];

        const hasActiveSchoolRole =
          response.ok &&
          schoolAccess.some(
            (item) =>
              (item.role === "teacher" || item.role === "school_admin") &&
              (!item.status || item.status === "active")
          );

        if (hasActiveSchoolRole) {
          const { data: schoolUserProfile } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("id", currentUser.id)
            .maybeSingle();

          setProfile(schoolUserProfile);
          setStatus("authenticated");
          return;
        }
      } catch {
        // If school access cannot be checked, continue with the normal
        // parent/student profile logic below.
      }
    }

    /*
      Parent/student flow:
      no profile, or incomplete profile = profile_incomplete.
      The existing global ProfileCompletionGuard will handle the redirect.
    */
    const { data: learnerProfile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();

    setProfile(learnerProfile);

    if (!learnerProfile) {
  const { data: insertedProfile } = await supabase
    .from("user_profiles")
    .insert({
      id: currentUser.id,
      email: currentUser.email ?? "",
      full_name: "",
      user_type: "parent",
      mobile: null,
      country_code: "+971",
      is_profile_complete: false,
    })
    .select("*")
    .single();

  setProfile(insertedProfile ?? null);
  setStatus("profile_incomplete");
  return;
}

if (!learnerProfile.is_profile_complete) {
  setStatus("profile_incomplete");
  return;
}

    setStatus("authenticated");
  }, []);

  useEffect(() => {
    void refresh();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });

    return () => subscription.unsubscribe();
  }, [refresh]);

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