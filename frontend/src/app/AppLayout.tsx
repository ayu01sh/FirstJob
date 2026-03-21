import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { clearSession, getAuthEventName, getStoredUser, syncCurrentUser, type AuthUser } from "../features/auth/auth";

export default function AppLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [loading, setLoading] = useState(true);

  const logout = () => {
    clearSession();
    navigate("/login");
  };

  useEffect(() => {
    let mounted = true;

    const refreshUser = async () => {
      try {
        const nextUser = await syncCurrentUser();
        if (mounted) {
          setUser(nextUser);
        }
      } catch {
        if (mounted) {
          setUser(getStoredUser());
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const handleAuthChanged = () => {
      setUser(getStoredUser());
    };

    window.addEventListener(getAuthEventName(), handleAuthChanged);
    refreshUser();

    return () => {
      mounted = false;
      window.removeEventListener(getAuthEventName(), handleAuthChanged);
    };
  }, []);

  const navClassName = ({ isActive }: { isActive: boolean }) =>
    isActive ? "nav-link nav-link-active" : "nav-link";

  return (
    <div className="container shell">
      <header className="header shell-card">
        <div className="brand-lockup">
          <img className="brand-mark" src="/firstjob-mark.svg" alt="FirstJob logo" />
          <h2 className="shell-title">FirstJob</h2>
        </div>
        <div className="header-actions">
          <div className="user-meta">
            <span className="user-name">
              {loading ? "Loading..." : user?.name?.trim() ? `What's your dream, ${user.name.trim()}?` : "What's your dream?"}
            </span>
            <span className="user-role">{loading ? "Syncing profile..." : user?.target_role || "Target Role Pending"}</span>
          </div>
          <button className="button" onClick={logout}>Logout</button>
        </div>
      </header>
      <nav className="nav shell-card">
        <NavLink to="/" end className={navClassName}>Overview</NavLink>
        <NavLink to="/resume" className={navClassName}>Resume</NavLink>
        <NavLink to="/matches" className={navClassName}>Top Matches</NavLink>
        <NavLink to="/jobs" className={navClassName}>Jobs</NavLink>
        <NavLink to="/notes" className={navClassName}>Notes</NavLink>
        <NavLink to="/profile" className={navClassName}>Profile</NavLink>
      </nav>
      <main className="card shell-card">
        <Outlet />
      </main>
    </div>
  );
}
