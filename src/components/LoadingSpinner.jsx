import "../styles/spinner.css";

/**
 * fullScreen - renders a full viewport overlay with centered spinner.
 * Otherwise renders an inline centered spinner.
 */
export default function LoadingSpinner({ fullScreen = false }) {
  if (fullScreen) {
    return (
      <div className="spinner-overlay" aria-label="Loading" role="status">
        <div className="spinner" />
        <span className="spinner-text">Loading...</span>
      </div>
    );
  }

  return (
    <div className="spinner-inline" aria-label="Loading" role="status">
      <div className="spinner" />
    </div>
  );
}
