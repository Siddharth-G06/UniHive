import { Component } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  componentDidUpdate(prevProps) {
    // Reset when location changes (navigation away)
    if (prevProps.location !== this.props.location && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", minHeight: "60vh", padding: "40px 20px", gap: 16,
          textAlign: "center"
        }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: "#fee2e2",
            color: "#ef4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 8,
          }}>
            <AlertTriangle size={36} strokeWidth={2.2} />
          </div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1e293b" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.95rem", maxWidth: 460, lineHeight: 1.6 }}>
            {this.state.error?.message ?? "An unexpected error occurred. Please try refreshing or returning to dashboard."}
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
            <button
              className="btn btn-outline"
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <RefreshCw size={16} /> Try Again
            </button>
            <Link
              to="/dashboard"
              className="btn btn-primary"
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Home size={16} /> Go to Dashboard
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
