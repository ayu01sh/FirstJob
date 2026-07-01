import { Navigate, createBrowserRouter } from "react-router-dom";
import AppLayout from "./AppLayout";
import DashboardPage from "./DashboardPage";
import ResumePage from "../features/resume/ResumePage";
import JobsPage from "../features/jobs/JobsPage";
import MatchesPage from "../features/jobs/MatchesPage";
import PrepPage from "../features/prep/PrepPage";
import ApplicationsPage from "../features/applications/ApplicationsPage";
import RecruiterDashboard from "../features/recruiter/RecruiterDashboard";
import AdminDashboard from "../features/admin/AdminDashboard";
import ProfilePage from "../features/auth/ProfilePage";
import { GuestGuard } from "./GuestGuard";

export const router = createBrowserRouter([
  /* Redirect old standalone auth pages to overview with modal query */
  { path: "/login", element: <Navigate to="/?auth=login" replace /> },
  { path: "/register", element: <Navigate to="/?auth=register" replace /> },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      /* Overview is always accessible — even for guests */
      { index: true, element: <DashboardPage /> },
      /* All other pages require auth — GuestGuard opens the modal if not logged in */
      { path: "resume", element: <GuestGuard><ResumePage /></GuestGuard> },
      { path: "profile", element: <GuestGuard><ProfilePage /></GuestGuard> },
      { path: "jobs", element: <GuestGuard><JobsPage /></GuestGuard> },
      { path: "matches", element: <GuestGuard><MatchesPage /></GuestGuard> },
      { path: "prep", element: <GuestGuard><PrepPage /></GuestGuard> },
      { path: "applications", element: <GuestGuard><ApplicationsPage /></GuestGuard> },
      { path: "recruiter/dashboard", element: <GuestGuard><RecruiterDashboard /></GuestGuard> },
      { path: "admin/dashboard", element: <GuestGuard><AdminDashboard /></GuestGuard> },
    ],
  },
]);

