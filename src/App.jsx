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
import Exchange from "./pages/Exchange";
import CreatePost from "./pages/CreatePost";
import PostDetail from "./pages/PostDetail";
import ExchangeDetail from "./pages/ExchangeDetail";
import MyPosts from "./pages/MyPosts";
import UserProfile from './pages/UserProfile';
import Messages from "./pages/Messages";
import Chat from "./pages/Chat";
import LoadingSpinner from "./components/LoadingSpinner";

function RootRedirect() {
  const { session, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  return <Navigate to={session ? "/dashboard" : "/login"} replace />;
}

function AppRoutes() {
  const PR = ({ children, noProfile = false }) => (
    <ProtectedRoute requireProfileComplete={!noProfile}>{children}</ProtectedRoute>
  );

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
        <Route path="/users/:username"         element={<PR><UserProfile /></PR>} />
        <Route path="/messages/:conversationId" element={<PR><Chat /></PR>} />

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

