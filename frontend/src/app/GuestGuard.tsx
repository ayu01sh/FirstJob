import { useEffect } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";

/**
 * GuestGuard wraps protected routes. If the user is not authenticated,
 * it redirects to "/" and opens the auth modal (instead of a hard redirect
 * to a separate login page).
 */
export function GuestGuard({ children }: { children: JSX.Element }) {
  const { isAuthenticated, showAuthModal, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Open the auth modal with the intended path so after login we navigate there
      showAuthModal(location.pathname, "login");
    }
  }, [loading, isAuthenticated, location.pathname, showAuthModal]);

  // While auth is still loading, show nothing (avoids flash)
  if (loading) return null;

  // Not authenticated → redirect to overview (the modal will be open)
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Authenticated → render the protected content
  return children;
}
