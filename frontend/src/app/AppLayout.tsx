import { Link, NavLink, Outlet, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { AuthProvider, useAuth } from "../features/auth/AuthContext";
import AuthModal from "../features/auth/AuthModal";
import { Button } from "../components/ui";

const PAGE_TITLES: Record<string, string> = {
  "/": "Overview",
  "/matches": "Opportunities",
  "/jobs": "Jobs",
  "/applications": "Tracker",
  "/prep": "Prep",
  "/resume": "Resume",
  "/profile": "Profile",
  "/recruiter/dashboard": "Recruiter Dashboard",
  "/admin/dashboard": "Admin Dashboard",
};

function getInitials(name: string | undefined): string {
  if (!name?.trim()) return "FJ";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

type Theme = "light" | "dark";

function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem("fj-theme") as Theme | null;
    if (stored === "dark" || stored === "light") return stored;
    // Default to system preference
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
    return "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("fj-theme", theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggle } as const;
}

// ── Sun icon (shown in dark mode → click to go light) ──
function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

// ── Moon icon (shown in light mode → click to go dark) ──
function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

function AppLayoutInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme, toggle: toggleTheme } = useTheme();
  const { user, isAuthenticated, loading, showAuthModal, pendingRedirect, logout: authLogout } = useAuth();

  // Handle ?auth=login or ?auth=register query params (from /login and /register redirects)
  useEffect(() => {
    const authParam = searchParams.get("auth");
    if (authParam === "login" || authParam === "register") {
      showAuthModal(undefined, authParam);
      // Clear the query param so it doesn't re-trigger
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, showAuthModal, setSearchParams]);

  // After auth success, navigate to pending redirect if any
  useEffect(() => {
    if (isAuthenticated && pendingRedirect && pendingRedirect !== "/") {
      navigate(pendingRedirect, { replace: true });
    }
  }, [isAuthenticated, pendingRedirect, navigate]);

  const handleLogout = () => {
    authLogout();
    navigate("/");
  };

  const handleSignIn = () => {
    showAuthModal(undefined, "login");
  };

  const handleNavClick = (e: React.MouseEvent, path: string) => {
    if (!isAuthenticated && path !== "/") {
      e.preventDefault();
      showAuthModal(path, "login");
    }
  };

  const sidebarClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "sidebar-link sidebar-link-active" : "sidebar-link";

  const pageTitle = PAGE_TITLES[location.pathname] || "FirstJob";
  const displayName = user?.name?.trim() || "Student";
  const initials = getInitials(user?.name);

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <Link to="/" className="sidebar-brand">
          <img className="sidebar-brand-logo" src="/firstjob-mark.svg" alt="FirstJob" />
          <span className="sidebar-brand-name">FirstJob</span>
        </Link>

        <nav className="sidebar-nav">
          {(!user || user.role === "student" || !user.role) && (
            <>
              <NavLink to="/" end className={sidebarClass}>
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2.5" y="2.5" width="6" height="6" rx="1.5" />
                  <rect x="11.5" y="2.5" width="6" height="6" rx="1.5" />
                  <rect x="2.5" y="11.5" width="6" height="6" rx="1.5" />
                  <rect x="11.5" y="11.5" width="6" height="6" rx="1.5" />
                </svg>
                <span>Overview</span>
              </NavLink>
              <NavLink to="/matches" className={sidebarClass} onClick={(e) => handleNavClick(e, "/matches")}>
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 2.5l2.3 4.7 5.2.8-3.7 3.6.9 5.2L10 14.3l-4.7 2.5.9-5.2L2.5 8l5.2-.8z" />
                </svg>
                <span>Opportunities</span>
              </NavLink>
              <NavLink to="/jobs" className={sidebarClass} onClick={(e) => handleNavClick(e, "/jobs")}>
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6.5" width="16" height="10.5" rx="2" />
                  <path d="M6.5 6.5V5a2 2 0 012-2h3a2 2 0 012 2v1.5" />
                  <line x1="2" y1="11.5" x2="18" y2="11.5" />
                </svg>
                <span>Jobs</span>
              </NavLink>
              <NavLink to="/applications" className={sidebarClass} onClick={(e) => handleNavClick(e, "/applications")}>
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3.5" y="2" width="13" height="16" rx="2" />
                  <path d="M7.5 2v2h5V2" />
                  <line x1="7" y1="8.5" x2="13" y2="8.5" />
                  <line x1="7" y1="11.5" x2="13" y2="11.5" />
                  <line x1="7" y1="14.5" x2="10" y2="14.5" />
                </svg>
                <span>Tracker</span>
              </NavLink>
              <NavLink to="/prep" className={sidebarClass} onClick={(e) => handleNavClick(e, "/prep")}>
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.5 3.5H8a2 2 0 012 2v12A1.5 1.5 0 008.5 16H2.5V3.5z" />
                  <path d="M17.5 3.5H12a2 2 0 00-2 2v12a1.5 1.5 0 011.5-1.5h6V3.5z" />
                </svg>
                <span>Prep</span>
              </NavLink>
              <NavLink to="/resume" className={sidebarClass} onClick={(e) => handleNavClick(e, "/resume")}>
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 2.5h7l4 4V17a1 1 0 01-1 1H5a1 1 0 01-1-1V3.5A1 1 0 015 2.5z" />
                  <path d="M12 2.5v4h4" />
                  <line x1="7" y1="10" x2="13" y2="10" />
                  <line x1="7" y1="13" x2="13" y2="13" />
                </svg>
                <span>Resume</span>
              </NavLink>
              <NavLink to="/profile" className={sidebarClass} onClick={(e) => handleNavClick(e, "/profile")}>
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="10" cy="7" r="3" />
                  <path d="M4 17.5v-.5a6 6 0 0112 0v.5" />
                </svg>
                <span>Profile</span>
              </NavLink>
            </>
          )}
          {user?.role === "recruiter" && (
            <NavLink to="/recruiter/dashboard" className={sidebarClass}>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2.5" y="2.5" width="6" height="6" rx="1.5" />
                <rect x="11.5" y="2.5" width="6" height="6" rx="1.5" />
                <rect x="2.5" y="11.5" width="6" height="6" rx="1.5" />
                <rect x="11.5" y="11.5" width="6" height="6" rx="1.5" />
              </svg>
              <span>Recruiter Dashboard</span>
            </NavLink>
          )}
          {user?.role === "campus_admin" && (
            <NavLink to="/admin/dashboard" className={sidebarClass}>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2.5" y="2.5" width="6" height="6" rx="1.5" />
                <rect x="11.5" y="2.5" width="6" height="6" rx="1.5" />
                <rect x="2.5" y="11.5" width="6" height="6" rx="1.5" />
                <rect x="11.5" y="11.5" width="6" height="6" rx="1.5" />
              </svg>
              <span>Admin Dashboard</span>
            </NavLink>
          )}
        </nav>

        {/* Sidebar bottom: user info or guest CTA */}
        {isAuthenticated && user ? (
          <Link to="/profile" className="sidebar-user" style={{ textDecoration: "none", color: "inherit", cursor: "pointer", paddingBottom: "1.5rem" }}>
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="avatar-image avatar-md" />
            ) : (
              <div className="avatar-initials">{initials}</div>
            )}
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{loading ? "Loading..." : displayName}</span>
              <span className="sidebar-user-role">
                {loading
                  ? "Syncing..."
                  : user?.role === "student"
                  ? user?.target_role || "Student"
                  : user?.role?.toUpperCase() || "Student"}
              </span>
            </div>
          </Link>
        ) : (
          <div className="sidebar-guest-cta">
            <p className="sidebar-guest-cta-text">Sign in to unlock all features</p>
            <Button variant="primary" size="sm" onClick={handleSignIn} style={{ width: "100%" }}>
              Sign In
            </Button>
          </div>
        )}
      </aside>

      {/* ── Main Area ── */}
      <div className="app-main">
        <header className="topbar">
          <p className="eyebrow" style={{ margin: 0, color: "var(--primary)" }}>{pageTitle}</p>
          <div className="topbar-actions">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
            {isAuthenticated ? (
              <Button variant="secondary" onClick={handleLogout} size="sm">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                  <path d="M7 17H4a1 1 0 01-1-1V4a1 1 0 011-1h3" />
                  <polyline points="11 14 17 10 11 6" />
                  <line x1="17" y1="10" x2="7" y2="10" />
                </svg>
                Logout
              </Button>
            ) : (
              <button className="topbar-signin-btn" onClick={handleSignIn}>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="10" cy="7" r="3" />
                  <path d="M4 17.5v-.5a6 6 0 0112 0v.5" />
                </svg>
                Sign In / Sign Up
              </button>
            )}
          </div>
        </header>
        <main className="main-content">
          <Outlet />
        </main>
      </div>

      {/* ── Auth Modal (rendered via portal) ── */}
      <AuthModal />
    </div>
  );
}

export default function AppLayout() {
  return (
    <AuthProvider>
      <AppLayoutInner />
    </AuthProvider>
  );
}

