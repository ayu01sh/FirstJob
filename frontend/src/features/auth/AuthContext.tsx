import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { getToken, getStoredUser, syncCurrentUser, clearSession, getAuthEventName, type AuthUser } from "./auth";

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  /** Open the auth modal. Pass a redirect path to navigate there after login. */
  showAuthModal: (redirectPath?: string, initialTab?: "login" | "register") => void;
  closeAuthModal: () => void;
  authModalOpen: boolean;
  authModalTab: "login" | "register";
  setAuthModalTab: (tab: "login" | "register") => void;
  pendingRedirect: string | null;
  /** Called after successful login/register inside the modal */
  onAuthSuccess: (user: AuthUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Custom event name for triggering the auth modal from anywhere (e.g. 401 interceptor)
export const AUTH_REQUIRED_EVENT = "firstjob-auth-required";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  const isAuthenticated = !!getToken() && !!user;

  // Sync user on mount
  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      if (!getToken()) {
        if (mounted) setLoading(false);
        return;
      }
      try {
        const u = await syncCurrentUser();
        if (mounted) setUser(u);
      } catch {
        if (mounted) setUser(getStoredUser());
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const handleAuthChanged = () => setUser(getStoredUser());

    window.addEventListener(getAuthEventName(), handleAuthChanged);
    refresh();

    return () => {
      mounted = false;
      window.removeEventListener(getAuthEventName(), handleAuthChanged);
    };
  }, []);

  // Listen for auth-required events (e.g. from 401 interceptor)
  useEffect(() => {
    const handler = () => {
      if (!isAuthenticated) {
        setAuthModalTab("login");
        setAuthModalOpen(true);
      }
    };
    window.addEventListener(AUTH_REQUIRED_EVENT, handler);
    return () => window.removeEventListener(AUTH_REQUIRED_EVENT, handler);
  }, [isAuthenticated]);

  const showAuthModal = useCallback((redirectPath?: string, initialTab?: "login" | "register") => {
    setPendingRedirect(redirectPath || null);
    setAuthModalTab(initialTab || "login");
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
    setPendingRedirect(null);
  }, []);

  const onAuthSuccess = useCallback((u: AuthUser) => {
    setUser(u);
    setAuthModalOpen(false);
    // pendingRedirect is consumed by the caller (AppLayout) after this
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setPendingRedirect(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const u = await syncCurrentUser();
      setUser(u);
    } catch {
      setUser(getStoredUser());
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        showAuthModal,
        closeAuthModal,
        authModalOpen,
        authModalTab,
        setAuthModalTab,
        pendingRedirect,
        onAuthSuccess,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
