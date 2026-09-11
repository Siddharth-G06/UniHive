import "../styles/auth.css";

export default function CompleteProfile() {
  return (
    <main className="auth-page" id="complete-profile-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo-icon" aria-hidden="true">📋</span>
          <h1 className="auth-title">Complete Your Profile</h1>
          <p className="auth-subtitle">
            This section is coming in Module 2. Stay tuned!
          </p>
        </div>
        <div className="placeholder-notice">
          Profile completion form will be built in the next module.
        </div>
      </div>
    </main>
  );
}
