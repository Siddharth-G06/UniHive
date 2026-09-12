import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./components/ToastProvider";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingSpinner from "./components/LoadingSpinner";

// Lazy-loaded pages
const Login          = lazy(() => import("./pages/Login"));
const Register       = lazy(() => import("./pages/Register"));
const Dashboard      = lazy(() => import("./pages/Dashboard"));
const CompleteProfile = lazy(() => import("./pages/CompleteProfile"));
const Profile        = lazy(() => import("./pages/Profile"));
const LostFound      = lazy(() => import("./pages/LostFound"));
const Exchange       = lazy(() => import("./pages/Exchange"));
const CreatePost     = lazy(() => import("./pages/CreatePost"));
const PostDetail     = lazy(() => import("./pages/PostDetail"));
const ExchangeDetail = lazy(() => import("./pages/ExchangeDetail"));
const MyPosts        = lazy(() => import("./pages/MyPosts"));
const Messages       = lazy(() => import("./pages/Messages"));
const Chat           = lazy(() => import("./pages/Chat"));
const UserProfile    = lazy(() => import("./pages/UserProfile"));

function RootRedirect() {
  const { session, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  return <Navigate to={session ? "/dashboard" : "/login"} replace />;
}

// ErrorBoundary needs location to reset on navigation
function BoundedRoute({ children }) {
  const location = useLocation();
  return (
    <ErrorBoundary location={location}>
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

function PR({ children, noProfile = false }) {
  return (
    <ProtectedRoute requireProfileComplete={!noProfile}>
      <BoundedRoute>{children}</BoundedRoute>
    </ProtectedRoute>
  );
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<RootRedirect />} />

        <Route path="/login"    element={<BoundedRoute><Login /></BoundedRoute>} />
        <Route path="/register" element={<BoundedRoute><Register /></BoundedRoute>} />
        <Route path="/complete-profile" element={<PR noProfile><CompleteProfile /></PR>} />

        <Route path="/dashboard"            element={<PR><Dashboard /></PR>} />
        <Route path="/profile"              element={<PR><Profile /></PR>} />
        <Route path="/lost-found"           element={<PR><LostFound /></PR>} />
        <Route path="/exchange"             element={<PR><Exchange /></PR>} />
        <Route path="/create-post"          element={<PR><CreatePost /></PR>} />
        <Route path="/posts/:id"            element={<PR><PostDetail /></PR>} />
        <Route path="/exchange/:id"         element={<PR><ExchangeDetail /></PR>} />
        <Route path="/edit-post/:id"        element={<PR><CreatePost /></PR>} />
        <Route path="/my-posts"             element={<PR><MyPosts /></PR>} />
        <Route path="/messages"             element={<PR><Messages /></PR>} />
        <Route path="/messages/:conversationId" element={<PR><Chat /></PR>} />
        <Route path="/users/:username"      element={<PR><UserProfile /></PR>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
