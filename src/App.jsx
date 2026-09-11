import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CompleteProfile from "./pages/CompleteProfile";
import Profile from "./pages/Profile";
import LostFound from "./pages/LostFound";
import CreatePost from "./pages/CreatePost";
import PostDetail from "./pages/PostDetail";
import MyPosts from "./pages/MyPosts";
import LoadingSpinner from "./components/LoadingSpinner";

function RootRedirect() {
  const { session, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  return <Navigate to={session ? "/dashboard" : "/login"} replace />;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Root */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Onboarding — no profile_complete check */}
        <Route
          path="/complete-profile"
          element={
            <ProtectedRoute requireProfileComplete={false}>
              <CompleteProfile />
            </ProtectedRoute>
          }
        />

        {/* Protected — requires completed profile */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireProfileComplete={true}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute requireProfileComplete={true}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lost-found"
          element={
            <ProtectedRoute requireProfileComplete={true}>
              <LostFound />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-post"
          element={
            <ProtectedRoute requireProfileComplete={true}>
              <CreatePost />
            </ProtectedRoute>
          }
        />
        <Route
          path="/posts/:id"
          element={
            <ProtectedRoute requireProfileComplete={true}>
              <PostDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-post/:id"
          element={
            <ProtectedRoute requireProfileComplete={true}>
              <CreatePost />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-posts"
          element={
            <ProtectedRoute requireProfileComplete={true}>
              <MyPosts />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
