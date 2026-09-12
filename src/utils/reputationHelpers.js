/**
 * Reputation badge config based on score and rating count.
 */
export function getReputationBadge(score, ratingCount = 0) {
  if (!ratingCount || ratingCount < 3) {
    return { label: "New",       color: "#64748b", bg: "#f1f5f9", iconName: "sparkles" };
  }
  if (score >= 4.7) return { label: "Trusted",    color: "#15803d", bg: "#dcfce7", iconName: "shield-check" };
  if (score >= 4.0) return { label: "Reliable",   color: "#1d4ed8", bg: "#dbeafe", iconName: "star" };
  if (score >= 3.0) return { label: "Good",       color: "#d97706", bg: "#fef3c7", iconName: "thumbs-up" };
  return               { label: "Building",    color: "#dc2626", bg: "#fee2e2", iconName: "trending-up" };
}

/**
 * Format score for display.
 */
export function formatReputationScore(score, ratingCount = 0) {
  if (!ratingCount || ratingCount < 3) return "New";
  return Number(score ?? 0).toFixed(1);
}

/**
 * Count ratings by star value.
 * @returns {{ 1: number, 2: number, 3: number, 4: number, 5: number }}
 */
export function getRatingBreakdown(ratings = []) {
  return ratings.reduce(
    (acc, r) => { acc[r.score] = (acc[r.score] ?? 0) + 1; return acc; },
    { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  );
}

/**
 * Determines if current user can rate the other party on this post.
 */
export function canUserRate(post, currentUserId) {
  if (!post || !currentUserId) return false;
  if (post.status !== "resolved") return false;
  return true;
}
