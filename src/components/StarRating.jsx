import { useState } from "react";
import "../styles/ratings.css";

const SIZES = { sm: 16, md: 24, lg: 32 };

/**
 * Star rating input or display.
 * @param {{ value, onChange, readonly, size }} props
 */
export default function StarRating({ value = 0, onChange, readonly = false, size = "md" }) {
  const [hovered, setHovered] = useState(0);
  const px = SIZES[size] ?? 24;
  const display = readonly ? value : (hovered || value);

  return (
    <div
      className={`star-rating star-rating-${size} ${readonly ? "star-rating-readonly" : "star-rating-interactive"}`}
      role={readonly ? "img" : "radiogroup"}
      aria-label={`Rating: ${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-btn ${star <= display ? "star-filled" : "star-empty"}`}
          style={{ fontSize: px, width: px + 8, height: px + 8 }}
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          tabIndex={readonly ? -1 : 0}
        >
          {star <= display ? "★" : "☆"}
        </button>
      ))}
      {readonly && value > 0 && (
        <span className="star-value-label">
          {Number(value).toFixed(1)}
        </span>
      )}
    </div>
  );
}
