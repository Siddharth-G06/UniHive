import { useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { useProfile } from "../hooks/useProfile";
import { useUsernameCheck } from "../hooks/useUsernameCheck";
import { validateUsername, validatePhone, formatFileSize } from "../utils/collegeDetect";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/profile.css";

const MAX_SIZE = 2 * 1024 * 1024;

function CollegeBadge({ college }) {
  if (!college) return null;
  return (
    <span className={`college-badge badge-${college.toLowerCase()}`}>
      {college === "SSN" ? "SSN College of Engineering" : "Shiv Nadar University Chennai"}
    </span>
  );
}

function Toast({ message, onDone }) {
  return (
    <div className="toast toast-success" role="status" aria-live="polite">
      <span>✓</span> {message}
    </div>
  );
}

export default function Profile() {
  const { user, refreshProfile } = useAuth();
  const { profile, loading, updateProfile } = useProfile();
  const fileInputRef = useRef(null);

  // Edit state — mirrors profile fields
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarError, setAvatarError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [toast, setToast] = useState(false);
  const [editInit, setEditInit] = useState(false);

  // Populate edit fields once profile loads
  if (profile && !editInit) {
    setUsername(profile.username || "");
    setPhone(profile.phone || "");
    setEditInit(true);
  }

  const { available: usernameAvailable, checking: usernameChecking } =
    useUsernameCheck(username, profile?.username || "");

  const usernameValidation = validateUsername(username);
  const phoneValidation = validatePhone(phone);

  if (loading) return <LoadingSpinner fullScreen />;

  const displayName = profile?.username || user?.email?.split("@")[0] || "User";
  const initials = displayName.charAt(0).toUpperCase();
  const avatarUrl = avatarPreview || profile?.avatar_url;
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "—";

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

  const canSave =
    !saving &&
    usernameValidation.valid &&
    (usernameAvailable === true || username === profile?.username) &&
    !usernameChecking &&
    phoneValidation.valid &&
    !avatarError;

  async function handleSave(e) {
    e.preventDefault();
    if (!canSave) return;
    setSaveError("");
    setSaving(true);

    let newAvatarUrl = profile?.avatar_url || null;

    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, avatarFile, { upsert: true });
      if (uploadError) {
        setSaveError("Avatar upload failed: " + uploadError.message);
        setSaving(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      newAvatarUrl = urlData.publicUrl;
    }

    const { error } = await updateProfile({
      username,
      phone: phone.trim() || null,
      ...(newAvatarUrl !== profile?.avatar_url && { avatar_url: newAvatarUrl }),
    });

    setSaving(false);

    if (error) {
      setSaveError(error);
    } else {
      refreshProfile();
      setToast(true);
      setAvatarFile(null);
      setTimeout(() => setToast(false), 3000);
    }
  }

  return (
    <main className="profile-page profile-view-page" id="profile-page">
      <div className="profile-view-grid">

        {/* ── Section 1: Profile Card (read-only) ── */}
        <aside className="profile-info-card">
          <div className="profile-avatar-lg">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={displayName} className="avatar-img-lg" />
            ) : (
              <span className="avatar-initials-lg">{initials}</span>
            )}
          </div>

          <h1 className="profile-info-name">@{profile?.username || "—"}</h1>
          <p className="profile-info-email">{user?.email}</p>

          <CollegeBadge college={profile?.college} />

          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-icon">⭐</span>
              <span className="stat-value">{profile?.reputation_score ?? 0}</span>
              <span className="stat-label">Reputation</span>
            </div>
          </div>

          <p className="profile-member-since">
            <span className="info-label">Member since</span>
            <span className="info-value">{memberSince}</span>
          </p>
        </aside>

        {/* ── Section 2: Edit Form ── */}
        <section className="profile-edit-card">
          <h2 className="profile-edit-title">Edit Profile</h2>

          <form id="profile-edit-form" onSubmit={handleSave} noValidate>
            {/* Avatar upload */}
            <div className="avatar-section avatar-section-sm">
              <button
                type="button"
                className="avatar-upload-btn avatar-upload-sm"
                onClick={handleAvatarClick}
                aria-label="Change profile picture"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="avatar-img" />
                ) : (
                  <span className="avatar-initials">{initials}</span>
                )}
                <span className="avatar-overlay" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="13" r="4" stroke="white" strokeWidth="2"/>
                  </svg>
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
              {avatarError && <p className="avatar-file-error" role="alert">{avatarError}</p>}
            </div>

            {/* Username */}
            <div className="form-group">
              <label htmlFor="edit-username" className="form-label">Username</label>
              <div className="input-with-status">
                <input
                  id="edit-username"
                  type="text"
                  className={`form-input ${
                    username.length >= 3
                      ? username === profile?.username
                        ? ""
                        : usernameAvailable === true
                          ? "input-valid"
                          : usernameAvailable === false
                            ? "input-invalid"
                            : ""
                      : ""
                  }`}
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  maxLength={20}
                  autoComplete="username"
                />
                <span className="username-status" aria-live="polite">
                  {usernameChecking && <span className="status-checking">⏳</span>}
                  {!usernameChecking && username.length >= 3 && username !== profile?.username && usernameAvailable === true && (
                    <span className="status-available">✓ Available</span>
                  )}
                  {!usernameChecking && username.length >= 3 && username !== profile?.username && usernameAvailable === false && (
                    <span className="status-taken">✗ Already taken</span>
                  )}
                </span>
              </div>
              {username.length > 0 && !usernameValidation.valid && (
                <p className="field-error">{usernameValidation.error}</p>
              )}
            </div>

            {/* Phone */}
            <div className="form-group">
              <label htmlFor="edit-phone" className="form-label">
                Phone Number <span className="optional-label">(optional)</span>
              </label>
              <input
                id="edit-phone"
                type="tel"
                className="form-input"
                placeholder="10-digit number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              />
              {phone.length > 0 && !phoneValidation.valid && (
                <p className="field-error">{phoneValidation.error}</p>
              )}
              <p className="field-hint">Shared only when you start a conversation</p>
            </div>

            {saveError && (
              <div className="form-error" role="alert">{saveError}</div>
            )}

            <button
              id="save-profile-btn"
              type="submit"
              className="btn btn-primary btn-full"
              disabled={!canSave}
            >
              {saving ? <><span className="btn-spinner" />Saving...</> : "Save Changes"}
            </button>
          </form>
        </section>
      </div>

      {toast && <Toast message="Profile updated!" />}
    </main>
  );
}
