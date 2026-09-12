import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  HelpCircle,
  CheckCircle2,
  HandHelping,
  Share2,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { uploadPostImages } from "../lib/postHelpers";
import {
  LOSTFOUND_CATEGORIES,
  EXCHANGE_CATEGORIES,
  DURATION_OPTIONS,
  POST_TYPE_CONFIG,
} from "../constants/categories";
import ImageUpload from "../components/ImageUpload";
import "../styles/posts.css";

const TYPE_CARDS = {
  "lost-found": [
    {
      type: "lost",
      Icon: HelpCircle,
      label: "I Lost Something",
      desc: "Post what you lost, when, and where on campus",
      color: "#ef4444",
      bg: "#fee2e2",
    },
    {
      type: "found",
      Icon: CheckCircle2,
      label: "I Found Something",
      desc: "Help return a found item back to its rightful owner",
      color: "#16a34a",
      bg: "#dcfce7",
    },
  ],
  exchange: [
    {
      type: "request",
      Icon: HandHelping,
      label: "I Need to Borrow",
      desc: "Request an item, calculator, or textbook from peers",
      color: "#7c3aed",
      bg: "#ede9fe",
    },
    {
      type: "offer",
      Icon: Share2,
      label: "I Can Lend",
      desc: "Offer a spare item or cycle to help a fellow student",
      color: "#d97706",
      bg: "#fef3c7",
    },
  ],
};

export default function CreatePost() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id: editId } = useParams();
  const { user } = useAuth();

  const mode = searchParams.get("mode") || "lost-found";
  const preType = searchParams.get("type") || "";
  const isEdit = !!editId;
  const isExchange = mode === "exchange";
  const categories = isExchange ? EXCHANGE_CATEGORIES : LOSTFOUND_CATEGORIES;

  // Step state — skip step 1 if type pre-selected or edit mode
  const [postType, setPostType] = useState(preType || (isEdit ? "lost" : ""));
  const [step, setStep] = useState(preType || isEdit ? 2 : 1);

  // Form fields
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [reason, setReason] = useState("");
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
    if (!postType) errs.postType = "Please select a type first.";
    if (isExchange && !durationDays) errs.durationDays = "Please select a duration.";
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
        type: postType,
        category,
        title: title.trim(),
        description: description.trim(),
        location: location.trim() || null,
        status: "active",
        images: [],
        ...(isExchange && durationDays && { duration_days: parseInt(durationDays) }),
        ...(isExchange && reason.trim() && { reason: reason.trim() }),
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
        console.error("Upload error:", uploadErr);
        setError("Post created but image upload failed: " + uploadErr.message);
        setSubmitting(false);
        setUploadProgress(0);
        navigate(isExchange ? `/exchange/${newPost.id}` : `/posts/${newPost.id}`);
        return;
      }
    }

    setUploadProgress(100);
    navigate(isExchange ? `/exchange/${newPost.id}` : `/posts/${newPost.id}`);
  }

  const typeCfg = POST_TYPE_CONFIG[postType];

  return (
    <main className="create-post-page" id="create-post-page">
      <div className="create-post-card">

        {/* Step 1 — Type selection */}
        {step === 1 && (
          <>
            <p className="step-label">Step 1 of 2 &middot; {isExchange ? "Peer Exchange" : "Lost & Found"}</p>
            <h1 className="create-post-title">{isExchange ? "What would you like to do?" : "What happened?"}</h1>
            <div className="type-cards">
              {(TYPE_CARDS[mode] ?? TYPE_CARDS["lost-found"]).map(({ type, Icon: IconComp, label, desc, color, bg }) => (
                <button
                  key={type}
                  type="button"
                  className={`type-card ${postType === type ? "selected" : ""}`}
                  onClick={() => handleTypeSelect(type)}
                  id={`type-${type}-btn`}
                >
                  <div className="type-card-icon-wrap" style={{ background: bg, color }}>
                    <IconComp size={28} strokeWidth={2.2} />
                  </div>
                  <span className="type-card-label">{label}</span>
                  <span className="type-card-desc">{desc}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 2 — Details form */}
        {step === 2 && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              {!preType && !isEdit && (
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ fontSize: "0.82rem", padding: "5px 12px", display: "inline-flex", alignItems: "center", gap: 5 }}
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft size={14} /> Back
                </button>
              )}
              {typeCfg && (
                <span className="step-label" style={{ margin: 0 }}>
                  {isEdit ? "Edit Post" : "Step 2 of 2"} &middot;{" "}
                  <span style={{ color: typeCfg.color, fontWeight: 800 }}>{typeCfg.label}</span>
                </span>
              )}
            </div>

            <h1 className="create-post-title">
              {isEdit ? "Edit Post" : isExchange ? "Post an Exchange" : "Describe the item"}
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
                    setFieldErrors((p) => ({ ...p, category: undefined }));
                  }}
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {fieldErrors.category && <p className="field-error field-error-inline">{fieldErrors.category}</p>}
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
                  placeholder={isExchange ? "e.g. Scientific Calculator (Casio FX-991EX)" : "e.g. Blue SNU ID Card with lanyard"}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setFieldErrors((p) => ({ ...p, title: undefined }));
                  }}
                  maxLength={100}
                />
                {fieldErrors.title && <p className="field-error field-error-inline">{fieldErrors.title}</p>}
              </div>

              {/* Description */}
              <div className="form-group">
                <label htmlFor="post-desc" className="form-label">
                  Description <span className="required-star">*</span>
                </label>
                <textarea
                  id="post-desc"
                  className={`form-input ${fieldErrors.description ? "input-invalid" : ""}`}
                  style={{ resize: "vertical", minHeight: 90, fontFamily: "var(--font)" }}
                  placeholder={
                    isExchange
                      ? "Describe the item — brand, model, condition, specifications..."
                      : "Color, brand, identifying marks, location details..."
                  }
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setFieldErrors((p) => ({ ...p, description: undefined }));
                  }}
                />
                {fieldErrors.description && <p className="field-error field-error-inline">{fieldErrors.description}</p>}
              </div>

              {/* Duration (exchange only — required) */}
              {isExchange && (
                <div className="form-group">
                  <label htmlFor="post-duration" className="form-label">
                    Duration <span className="required-star">*</span>
                  </label>
                  <select
                    id="post-duration"
                    className={`form-input form-select ${fieldErrors.durationDays ? "input-invalid" : ""}`}
                    value={durationDays}
                    onChange={(e) => {
                      setDurationDays(e.target.value);
                      setFieldErrors((p) => ({ ...p, durationDays: undefined }));
                    }}
                  >
                    <option value="">How long do you need or offer this for?</option>
                    {DURATION_OPTIONS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                  {fieldErrors.durationDays && <p className="field-error field-error-inline">{fieldErrors.durationDays}</p>}
                </div>
              )}

              {/* Reason (exchange only — optional) */}
              {isExchange && (
                <div className="form-group">
                  <label htmlFor="post-reason" className="form-label">
                    {postType === "request" ? "Why do you need this?" : "Any conditions for lending?"}
                    <span className="optional-label"> (optional)</span>
                  </label>
                  <textarea
                    id="post-reason"
                    className="form-input"
                    style={{ resize: "vertical", minHeight: 70, fontFamily: "var(--font)" }}
                    placeholder={
                      postType === "request"
                        ? "e.g. Mid-sem exam on Friday, needed for 2 days..."
                        : "e.g. Please return in same condition, handle with care..."
                    }
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              )}

              {/* Location (optional) */}
              <div className="form-group">
                <label htmlFor="post-location" className="form-label">
                  Location <span className="optional-label">(optional)</span>
                </label>
                <input
                  id="post-location"
                  type="text"
                  className="form-input"
                  placeholder={isExchange ? "Where on campus can you meet? e.g. Central Library" : "Where was it lost or found?"}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              {/* Images */}
              <div className="form-group">
                <label className="form-label">
                  Photos <span className="optional-label">(optional, up to 4 photos)</span>
                </label>
                <ImageUpload images={images} onChange={setImages} maxImages={4} maxSizeMB={5} />
              </div>

              {submitting && uploadProgress > 0 && (
                <div className="upload-progress-bar" style={{ marginBottom: 12 }}>
                  <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}

              {error && <div className="form-error" role="alert">{error}</div>}

              <button
                id="submit-post-btn"
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={submitting}
                style={{
                  marginTop: 12,
                  padding: "14px",
                  fontSize: "1rem",
                  ...(typeCfg && { background: typeCfg.color, borderColor: typeCfg.color }),
                }}
              >
                {submitting
                  ? images.length > 0 ? `Uploading... ${uploadProgress}%` : "Publishing..."
                  : isEdit ? "Save Changes" : isExchange ? "Publish Exchange Post" : "Publish Post"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
