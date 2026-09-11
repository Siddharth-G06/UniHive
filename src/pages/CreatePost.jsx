import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { uploadPostImages, CATEGORIES } from "../lib/postHelpers";
import ImageUpload from "../components/ImageUpload";
import "../styles/posts.css";

export default function CreatePost() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id: editId } = useParams();
  const { user } = useAuth();
  const mode = searchParams.get("mode") || "lost-found";
  const isEdit = !!editId;
  const isLostFound = mode === "lost-found";

  // Step 1
  const [postType, setPostType] = useState(isEdit ? "lost" : "");
  const [step, setStep] = useState(isEdit || mode === "exchange" ? 2 : 1);

  // Step 2 fields
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [images, setImages] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  function handleTypeSelect(type) {
    setPostType(type);
    setStep(2);
  }

  function validate() {
    const errs = {};
    if (!category) errs.category = "Please select a category.";
    if (!title.trim()) errs.title = "Title is required.";
    if (!description.trim()) errs.description = "Description is required.";
    if (isLostFound && !postType) errs.postType = "Please select Lost or Found first.";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    setUploadProgress(10);

    const { data: newPost, error: insertError } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        type: postType || "offer",
        category,
        title: title.trim(),
        description: description.trim(),
        location: location.trim() || null,
        status: "active",
        images: [],
      })
      .select()
      .single();

    if (insertError) {
      console.error("Post insert error:", insertError);
      setError(insertError.message);
      setSubmitting(false);
      setUploadProgress(0);
      return;
    }

    setUploadProgress(40);

    if (images.length > 0) {
      try {
        const imageUrls = await uploadPostImages(images, newPost.id, user.id);
        setUploadProgress(85);
        await supabase.from("posts").update({ images: imageUrls }).eq("id", newPost.id);
      } catch (uploadErr) {
        console.error("Image upload error:", uploadErr);
        setError("Post created but image upload failed: " + uploadErr.message);
        setSubmitting(false);
        setUploadProgress(0);
        navigate(`/posts/${newPost.id}`);
        return;
      }
    }

    setUploadProgress(100);
    navigate(`/posts/${newPost.id}`);
  }

  return (
    <main className="create-post-page" id="create-post-page">
      <div className="create-post-card">

        {/* ── Step 1: Type selection ── */}
        {step === 1 && isLostFound && (
          <>
            <p className="step-label">Step 1 of 2</p>
            <h1 className="create-post-title">What happened?</h1>
            <div className="type-cards">
              <button
                type="button"
                className={`type-card ${postType === "lost" ? "selected" : ""}`}
                onClick={() => handleTypeSelect("lost")}
                id="type-lost-btn"
              >
                <span className="type-card-icon">😔</span>
                <span className="type-card-label">I Lost Something</span>
                <span className="type-card-desc">Post what you lost and where</span>
              </button>
              <button
                type="button"
                className={`type-card ${postType === "found" ? "selected" : ""}`}
                onClick={() => handleTypeSelect("found")}
                id="type-found-btn"
              >
                <span className="type-card-icon">🎉</span>
                <span className="type-card-label">I Found Something</span>
                <span className="type-card-desc">Help return it to its owner</span>
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Details form ── */}
        {step === 2 && (
          <>
            {isLostFound && (
              <>
                <p className="step-label">
                  Step 2 of 2 &nbsp;·&nbsp;
                  <span className={`type-badge ${postType === "lost" ? "badge-lost" : "badge-found"}`}
                    style={{ position: "static", fontSize: "0.72rem", padding: "2px 8px" }}>
                    {postType === "lost" ? "LOST" : "FOUND"}
                  </span>
                </p>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ marginBottom: 16, fontSize: "0.82rem", padding: "5px 12px" }}
                  onClick={() => setStep(1)}
                >
                  ← Back
                </button>
              </>
            )}
            <h1 className="create-post-title">
              {isEdit ? "Edit Post" : isLostFound ? "Describe the item" : "Create a Post"}
            </h1>

            <form id="create-post-form" onSubmit={handleSubmit} noValidate>

              {/* Category */}
              <div className="form-group">
                <label htmlFor="post-category" className="form-label">
                  Category <span className="required-star">*</span>
                </label>
                <select
                  id="post-category"
                  className={`form-input form-select ${fieldErrors.category ? "input-invalid" : ""}`}
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    if (e.target.value) setFieldErrors((prev) => ({ ...prev, category: undefined }));
                  }}
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {fieldErrors.category && (
                  <p className="field-error field-error-inline" role="alert">{fieldErrors.category}</p>
                )}
              </div>

              {/* Title */}
              <div className="form-group">
                <label htmlFor="post-title" className="form-label">
                  Title <span className="required-star">*</span>
                </label>
                <input
                  id="post-title"
                  type="text"
                  className={`form-input ${fieldErrors.title ? "input-invalid" : ""}`}
                  placeholder="e.g. Blue SNU ID Card"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (e.target.value.trim()) setFieldErrors((prev) => ({ ...prev, title: undefined }));
                  }}
                  maxLength={100}
                />
                {fieldErrors.title && (
                  <p className="field-error field-error-inline" role="alert">{fieldErrors.title}</p>
                )}
              </div>

              {/* Description */}
              <div className="form-group">
                <label htmlFor="post-desc" className="form-label">
                  Description <span className="required-star">*</span>
                </label>
                <textarea
                  id="post-desc"
                  className={`form-input ${fieldErrors.description ? "input-invalid" : ""}`}
                  style={{ resize: "vertical", minHeight: 100, fontFamily: "var(--font)" }}
                  placeholder="Describe the item in detail — color, brand, any identifying marks..."
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (e.target.value.trim()) setFieldErrors((prev) => ({ ...prev, description: undefined }));
                  }}
                />
                {fieldErrors.description && (
                  <p className="field-error field-error-inline" role="alert">{fieldErrors.description}</p>
                )}
              </div>

              {/* Location (optional) */}
              <div className="form-group">
                <label htmlFor="post-location" className="form-label">
                  Location <span className="optional-label">(optional)</span>
                </label>
                <input
                  id="post-location"
                  type="text"
                  className="form-input"
                  placeholder="Where did you lose/find it? e.g. Near the Library"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              {/* Images (optional) */}
              <div className="form-group">
                <label className="form-label">
                  Images <span className="optional-label">(optional, max 4)</span>
                </label>
                <ImageUpload images={images} onChange={setImages} maxImages={4} maxSizeMB={5} />
              </div>

              {/* Upload progress */}
              {submitting && uploadProgress > 0 && (
                <div className="upload-progress-bar" style={{ marginBottom: 12 }}>
                  <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}

              {/* Supabase / general error */}
              {error && (
                <div className="form-error" role="alert" id="post-submit-error">{error}</div>
              )}

              <button
                id="submit-post-btn"
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={submitting}
                style={{ marginTop: 8 }}
              >
                {submitting
                  ? images.length > 0
                    ? `Uploading... ${uploadProgress}%`
                    : "Posting..."
                  : isEdit ? "Save Changes" : "Post Item →"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
