import React from "react";
import { Sparkles, ShieldCheck, Star, ThumbsUp, TrendingUp } from "lucide-react";
import { getReputationBadge, formatReputationScore } from "../utils/reputationHelpers";

const ICON_MAP = {
  "sparkles": Sparkles,
  "shield-check": ShieldCheck,
  "star": Star,
  "thumbs-up": ThumbsUp,
  "trending-up": TrendingUp,
};

export default function ReputationBadge({ score, ratingCount = 0, showScore = true, size = "sm", className = "" }) {
  const badge = getReputationBadge(score, ratingCount);
  const formattedScore = formatReputationScore(score, ratingCount);
  const IconComp = ICON_MAP[badge.iconName] || Sparkles;
  const iconSize = size === "lg" ? 16 : 13;

  return (
    <span
      className={`rep-badge rep-badge-${size} ${className}`}
      style={{
        background: badge.bg,
        color: badge.color,
        border: `1px solid ${badge.color}33`,
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: size === "lg" ? "4px 10px" : "2px 8px",
        borderRadius: "100px",
        fontSize: size === "lg" ? "0.85rem" : "0.75rem",
        fontWeight: 700,
        letterSpacing: "0.2px",
      }}
    >
      <IconComp size={iconSize} strokeWidth={2.5} />
      <span>{badge.label}</span>
      {showScore && formattedScore !== "New" && (
        <span style={{ opacity: 0.85, fontWeight: 800 }}>({formattedScore})</span>
      )}
    </span>
  );
}
