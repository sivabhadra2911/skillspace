import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { request, type ApiUser } from "@/lib/api";

type AuthContextValue = {
  user: ApiUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    data: { full_name: string; user_type: string },
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | null>(null);
function normalizeUser(user: any): ApiUser {
  return {
    ...user,
    user_metadata: { full_name: user.full_name, user_type: user.user_type },
  };
}
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!localStorage.getItem("skillspace_token")) {
      setLoading(false);
      return;
    }
    request("/api/auth/me")
      .then(({ user }) => setUser(normalizeUser(user)))
      .catch(() => localStorage.removeItem("skillspace_token"))
      .finally(() => setLoading(false));
  }, []);
  const signIn = async (email: string, password: string) => {
    try {
      const result = await request("/api/auth/signin", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("skillspace_token", result.token);
      setUser(normalizeUser(result.user));
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };
  const signUp = async (
    email: string,
    password: string,
    data: { full_name: string; user_type: string },
  ) => {
    try {
      const result = await request("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          name: data.full_name,
          role: data.user_type,
        }),
      });
      localStorage.setItem("skillspace_token", result.token);
      setUser(normalizeUser(result.user));
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };
  const signOut = async () => {
    localStorage.removeItem("skillspace_token");
    setUser(null);
  };
  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
