import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { addSkipped } from "../hooks/usePendingRatings";
import StarRating from "./StarRating";
import "../styles/ratings.css";

/**
 * Modal for submitting a rating after a resolved exchange.
 */
export default function RatingModal({
  isOpen, postId, ratedUserId, ratedUsername, postTitle,
  onClose, onSubmitted,
}) {
  const { user } = useAuth();
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const charCount = comment.length;
  const canSubmit = score > 0 && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setSubmitting(true);

    // Check for duplicate
    const { data: existing } = await supabase
      .from("ratings")
      .select("id")
      .eq("post_id", postId)
      .eq("rater_id", user.id)
      .maybeSingle();

    if (existing) {
      setError("You''ve already rated this interaction.");
      setSubmitting(false);
      return;
    }

    const { error: insertErr } = await supabase.from("ratings").insert({
      post_id: postId,
      rater_id: user.id,
      rated_user_id: ratedUserId,
      score,
      comment: comment.trim() || null,
    });

    setSubmitting(false);
    if (insertErr) {
      if (insertErr.code === "23505") {
        setError("You''ve already rated this interaction.");
      } else {
        setError(insertErr.message);
      }
      return;
    }
    onSubmitted?.();
  }

  function handleSkip() {
    addSkipped(postId);
    onClose();
  }

  return (
    <div className="rating-overlay" role="dialog" aria-modal="true" aria-label="Rate your experience">
      <div className="rating-card">
        <div className="rating-card-header">
          <h2 className="rating-title">Rate your experience</h2>
          <p className="rating-subtitle">with <strong>@{ratedUsername}</strong></p>
          {postTitle && (
            <p className="rating-post-context">Re: {postTitle}</p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rating-stars-row">
            <StarRating value={score} onChange={setScore} size="lg" />
            {score === 0 && <p className="rating-stars-hint">Tap to rate</p>}
          </div>

          <div className="form-group" style={{ marginTop: 16 }}>
            <label htmlFor="rating-comment" className="form-label" style={{ fontSize: "0.85rem" }}>
              Share your experience
              <span className="optional-label"> (optional)</span>
            </label>
            <textarea
              id="rating-comment"
              className="form-input"
              style={{ minHeight: 80, resize: "vertical", fontFamily: "var(--font)" }}
              placeholder="How was the interaction? Was the item as described?"
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 300))}
            />
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textAlign: "right" }}>
              {charCount}/300
            </span>
          </div>

          {error && <div className="form-error">{error}</div>}

          <button
            id="submit-rating-btn"
            type="submit"
            className="btn btn-primary btn-full"
            disabled={!canSubmit}
            style={{ marginTop: 8 }}
          >
            {submitting ? "Submitting..." : "Submit Rating ★"}
          </button>
        </form>

        <button
          className="rating-skip-btn"
          type="button"
          onClick={handleSkip}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
