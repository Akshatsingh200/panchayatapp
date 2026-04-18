/**
 * App.jsx — Root component with React Router configuration.
 *
 * Route guards:
 *  PrivateRoute    — requires login
 *  SocietyRoute    — requires login + society membership
 *  PublicRoute     — redirects to dashboard if already logged in
 */

import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Pages
import Login             from "./pages/Login";
import Signup            from "./pages/Signup";
import CreateJoinSociety from "./pages/CreateJoinSociety";
import Dashboard         from "./pages/Dashboard";
import PostDetail        from "./pages/PostDetail";
import Chat              from "./pages/Chat";
import Members           from "./pages/Members";
import Profile           from "./pages/Profile";

// Layout
import Navbar from "./components/Navbar";

// ── Spinner shown while auth is loading ───────────────────────
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-saffron-50">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-saffron-200 border-t-saffron-500 rounded-full animate-spin mx-auto mb-4" />
      <p className="text-soil-500 font-body text-sm">Loading Society Connect…</p>
    </div>
  </div>
);

// ── Guard: must be logged in ───────────────────────────────────
const PrivateRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

// ── Guard: must be logged in AND have a society ────────────────
const SocietyRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.societyId) return <Navigate to="/society-setup" replace />;
  return <Outlet />;
};

// ── Guard: redirect logged-in users away from auth pages ──────
const PublicRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

// ── Layout wrapper with Navbar ─────────────────────────────────
const AppLayout = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
  </div>
);

export default function App() {
  return (
    <Routes>
      {/* ── Public routes (redirect if logged in) ─────────── */}
      <Route element={<PublicRoute />}>
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>

      {/* ── Logged-in but no society yet ──────────────────── */}
      <Route element={<PrivateRoute />}>
        <Route path="/society-setup" element={<CreateJoinSociety />} />
      </Route>

      {/* ── Full app (logged in + society) ────────────────── */}
      <Route element={<SocietyRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard"    element={<Dashboard />} />
          <Route path="/posts/:id"    element={<PostDetail />} />
          <Route path="/chat"         element={<Chat />} />
          <Route path="/members"      element={<Members />} />
          <Route path="/profile"      element={<Profile />} />
        </Route>
      </Route>

      {/* ── Default redirect ───────────────────────────────── */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
