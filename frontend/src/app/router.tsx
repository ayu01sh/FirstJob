import { Navigate, createBrowserRouter } from "react-router-dom";
import AppLayout from "./AppLayout";
import LoginPage from "../features/auth/LoginPage";
import RegisterPage from "../features/auth/RegisterPage";
import ProfilePage from "../features/auth/ProfilePage";
import DashboardPage from "./DashboardPage";
import ResumePage from "../features/resume/ResumePage";
import JobsPage from "../features/jobs/JobsPage";
import MatchesPage from "../features/jobs/MatchesPage";
import NotesPage from "../features/notes/NotesPage";
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
      { path: "notes", element: <NotesPage /> },
    ],
  },
]);
