import { useState } from "react";
import { Star } from "lucide-react";
import "../styles/ratings.css";

const SIZES = { sm: 14, md: 20, lg: 28 };

/**
 * Modern Star rating input or display with Lucide vector icons.
 * @param {{ value: number, onChange?: (val: number) => void, readonly?: boolean, size?: 'sm' | 'md' | 'lg' }} props
 */
export default function StarRating({ value = 0, onChange, readonly = false, size = "md" }) {
  const [hovered, setHovered] = useState(0);
  const px = SIZES[size] ?? 20;
  const display = readonly ? value : (hovered || value);

  return (
    <div
      className={`star-rating star-rating-${size} ${readonly ? "star-rating-readonly" : "star-rating-interactive"}`}
      role={readonly ? "img" : "radiogroup"}
      aria-label={`Rating: ${value} out of 5 stars`}
      style={{ display: "inline-flex", alignItems: "center", gap: size === "lg" ? "4px" : "2px" }}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= display;
        return (
          <button
            key={star}
            type="button"
            className={`star-btn ${isFilled ? "star-filled" : "star-empty"}`}
            style={{
              background: "transparent",
              border: "none",
              cursor: readonly ? "default" : "pointer",
              padding: size === "lg" ? "3px" : "1px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: isFilled ? "#f59e0b" : "#cbd5e1",
              transition: "transform 0.15s ease, color 0.15s ease",
            }}
            disabled={readonly}
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            tabIndex={readonly ? -1 : 0}
          >
            <Star
              size={px}
              fill={isFilled ? "#f59e0b" : "none"}
              stroke={isFilled ? "#f59e0b" : "currentColor"}
              strokeWidth={2}
            />
          </button>
        );
      })}
      {readonly && value > 0 && (
        <span className="star-value-label" style={{ marginLeft: "4px", fontSize: size === "sm" ? "0.75rem" : "0.85rem", fontWeight: 700, color: "#d97706" }}>
          {Number(value).toFixed(1)}
        </span>
      )}
    </div>
  );
}
