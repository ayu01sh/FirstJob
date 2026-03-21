import { Link, Outlet, useNavigate } from "react-router-dom";

export default function AppLayout() {
  const navigate = useNavigate();
  const userRaw = localStorage.getItem("firstjob_user");
  const user = userRaw ? JSON.parse(userRaw) : null;

  const logout = () => {
    localStorage.removeItem("firstjob_token");
    localStorage.removeItem("firstjob_user");
    navigate("/login");
  };

  return (
    <div className="container">
      <header className="header">
        <h2>FirstJob MVP</h2>
        <div>
          <span>{user?.email}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>
      <nav className="nav">
        <Link to="/">Dashboard</Link>
        <Link to="/resume">Resume</Link>
        <Link to="/jobs">Jobs</Link>
        <Link to="/matches">Top Matches</Link>
        <Link to="/notes">Notes</Link>
      </nav>
      <main className="card">
        <Outlet />
      </main>
    </div>
  );
}
