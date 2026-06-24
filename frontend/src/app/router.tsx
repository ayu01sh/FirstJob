import { Navigate, createBrowserRouter } from "react-router-dom";
import AppLayout from "./AppLayout";
import LoginPage from "../features/auth/LoginPage";
import RegisterPage from "../features/auth/RegisterPage";
import ProfilePage from "../features/auth/ProfilePage";
import DashboardPage from "./DashboardPage";
import ResumePage from "../features/resume/ResumePage";
import JobsPage from "../features/jobs/JobsPage";
import MatchesPage from "../features/jobs/MatchesPage";
import PrepPage from "../features/prep/PrepPage";
import ApplicationsPage from "../features/applications/ApplicationsPage";
import RecruiterDashboard from "../features/recruiter/RecruiterDashboard";
import AdminDashboard from "../features/admin/AdminDashboard";
import { getToken } from "../features/auth/auth";

function isAuthed() {
  return !!getToken();
}

function Protected({ children }: { children: JSX.Element }) {
  return isAuthed() ? children : <Navigate to="/login" replace />;
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    path: "/",
    element: (
      <Protected>
        <AppLayout />
      </Protected>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "resume", element: <ResumePage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "jobs", element: <JobsPage /> },
      { path: "matches", element: <MatchesPage /> },
      { path: "prep", element: <PrepPage /> },
      { path: "applications", element: <ApplicationsPage /> },
      { path: "recruiter/dashboard", element: <RecruiterDashboard /> },
      { path: "admin/dashboard", element: <AdminDashboard /> },
    ],
  },
]);
