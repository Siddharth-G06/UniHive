import { useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { detectCollege, validateUsername, validatePhone, formatFileSize } from "../utils/collegeDetect";
import { useUsernameCheck } from "../hooks/useUsernameCheck";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/profile.css";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export default function CompleteProfile() {
  const { session, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [username, setUsername] = useState("");
  const [college, setCollege] = useState(() => detectCollege(session?.user?.email) || "");
  const [phone, setPhone] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarError, setAvatarError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { available: usernameAvailable, checking: usernameChecking } = useUsernameCheck(username, "");

  const usernameValidation = validateUsername(username);
  const phoneValidation = validatePhone(phone);

  // If already complete, redirect to dashboard
  if (!loading && profile?.profile_complete) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) return <LoadingSpinner fullScreen />;

  function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError("");

    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select an image file.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setAvatarError(`Image must be under 2MB (selected: ${formatFileSize(file.size)})`);
      setAvatarFile(null);
      setAvatarPreview(null);
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  const initials = (session?.user?.email?.[0] || "U").toUpperCase();

  const canSubmit =
    !submitting &&
    usernameValidation.valid &&
    usernameAvailable === true &&
    !usernameChecking &&
    college !== "" &&
    phoneValidation.valid &&
    !avatarError;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setSubmitting(true);

    let avatarUrl = null;

    // 1. Upload avatar if selected
    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop();
      const path = `${session.user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, avatarFile, { upsert: true });

      if (uploadError) {
        setError("Avatar upload failed: " + uploadError.message);
        setSubmitting(false);
        return;
      }

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      avatarUrl = urlData.publicUrl;
    }

    // 2. Update profile row
    const updates = {
      username,
      college,
      phone: phone.trim() || null,
      profile_complete: true,
      ...(avatarUrl && { avatar_url: avatarUrl }),
    };

    const { error: updateError } = await supabase
      .from("users")
      .update(updates)
      .eq("id", session.user.id);

    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }

    // 3. Refresh context profile then navigate
    refreshProfile();
    navigate("/dashboard");
  }

  return (
    <main className="profile-page" id="complete-profile-page">
      <div className="profile-card">
        <div className="profile-card-header">
          <h1 className="profile-title">Complete Your Profile</h1>
          <p className="profile-subtitle">You&apos;re almost ready to use UniHive 🐝</p>
          <div className="profile-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: canSubmit ? "100%" : "40%" }}
              />
            </div>
            <span className="progress-label">{canSubmit ? "Ready!" : "Fill in the details below"}</span>
          </div>
        </div>

        <form id="complete-profile-form" onSubmit={handleSubmit} noValidate>
          {/* Avatar */}
          <div className="avatar-section">
            <button
              type="button"
              className="avatar-upload-btn"
              onClick={handleAvatarClick}
              aria-label="Upload profile picture"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="avatar-img" />
              ) : (
                <span className="avatar-initials">{initials}</span>
              )}
              <span className="avatar-overlay" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="13" r="4" stroke="white" strokeWidth="2"/>
                </svg>
                <span>Change</span>
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="avatar-file-input"
              onChange={handleFileChange}
              tabIndex={-1}
              aria-hidden="true"
            />
            {avatarFile && !avatarError && (
              <p className="avatar-file-info">
                {avatarFile.name} · {formatFileSize(avatarFile.size)}
              </p>
            )}
            {avatarError && (
              <p className="avatar-file-error" role="alert">{avatarError}</p>
            )}
          </div>

          {/* Username */}
          <div className="form-group">
            <label htmlFor="cp-username" className="form-label">Username</label>
            <div className="input-with-status">
              <input
                id="cp-username"
                type="text"
                className={`form-input ${username.length >= 3 ? (usernameAvailable === true ? "input-valid" : usernameAvailable === false ? "input-invalid" : "") : ""}`}
                placeholder="e.g. siddharth_dev"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                maxLength={20}
                required
                autoComplete="username"
              />
              <span className="username-status" aria-live="polite">
                {usernameChecking && <span className="status-checking">⏳</span>}
                {!usernameChecking && username.length >= 3 && usernameAvailable === true && (
                  <span className="status-available">✓ Available</span>
                )}
                {!usernameChecking && username.length >= 3 && usernameAvailable === false && (
                  <span className="status-taken">✗ Already taken</span>
                )}
              </span>
            </div>
            {username.length > 0 && !usernameValidation.valid && (
              <p className="field-error" role="alert">{usernameValidation.error}</p>
            )}
            <p className="field-hint">3–20 characters, lowercase letters, numbers, underscores only</p>
          </div>

          {/* College */}
          <div className="form-group">
            <label htmlFor="cp-college" className="form-label">College <span className="required-star">*</span></label>
            <select
              id="cp-college"
              className="form-input form-select"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              required
            >
              <option value="">Select your college</option>
              <option value="SSN">SSN College of Engineering</option>
              <option value="SNUC">Shiv Nadar University Chennai</option>
            </select>
          </div>

          {/* Phone */}
          <div className="form-group">
            <label htmlFor="cp-phone" className="form-label">
              Phone Number <span className="optional-label">(optional)</span>
            </label>
            <input
              id="cp-phone"
              type="tel"
              className="form-input"
              placeholder="10-digit number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              autoComplete="tel"
            />
            {phone.length > 0 && !phoneValidation.valid && (
              <p className="field-error" role="alert">{phoneValidation.error}</p>
            )}
            <p className="field-hint">Shared only when you start a conversation</p>
          </div>

          {error && (
            <div className="form-error" role="alert" id="cp-error">{error}</div>
          )}

          <button
            id="complete-profile-submit"
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={!canSubmit}
          >
            {submitting ? (
              <><span className="btn-spinner" />Setting up...</>
            ) : (
              "Complete Setup →"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
