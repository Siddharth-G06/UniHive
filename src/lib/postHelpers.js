import { supabase } from "./supabase";

// ─── Time formatting ────────────────────────────────────────────
/**
 * Returns a human-friendly relative time string.
 * @param {string|Date} timestamp
 * @returns {string}
 */
export function formatTimeAgo(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const diff = Math.floor((now - then) / 1000); // seconds

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) > 1 ? "s" : ""} ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? "s" : ""} ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)} week${Math.floor(diff / 604800) > 1 ? "s" : ""} ago`;
  return then.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Image upload ────────────────────────────────────────────────
/**
 * Uploads an array of File objects to the post-images bucket.
 * Files are stored at: {userId}/{postId}/{filename}
 * @param {File[]} files
 * @param {string} postId
 * @param {string} userId
 * @returns {Promise<string[]>} Public URLs
 */
export async function uploadPostImages(files, postId, userId) {
  const urls = [];
  for (const file of files) {
    const ext = file.name.split(".").pop();
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `${userId}/${postId}/${filename}`;

    const { error } = await supabase.storage
      .from("post-images")
      .upload(path, file, { upsert: false });

    if (error) throw new Error(`Failed to upload ${file.name}: ${error.message}`);

    const { data } = supabase.storage.from("post-images").getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}

// ─── Interest + Conversation creation ────────────────────────────
/**
 * Expresses interest in a post (Lost/Found) and creates a conversation.
 * - Inserts into interests (idempotent check before calling)
 * - Inserts into conversations
 * - Updates post status to ''claimed''
 * @returns {{ conversationId: string | null, error: string | null }}
 */
export async function createInterestAndConversation(postId, postOwnerId, currentUserId) {
  // Check for existing interest
  const { data: existing } = await supabase
    .from("interests")
    .select("id")
    .eq("post_id", postId)
    .eq("from_user_id", currentUserId)
    .maybeSingle();

  if (existing) return { conversationId: null, error: "already_exists" };

  // Insert interest
  const { error: interestError } = await supabase
    .from("interests")
    .insert({ post_id: postId, from_user_id: currentUserId });

  if (interestError) return { conversationId: null, error: interestError.message };

  // Upsert conversation (post_id, user_a = owner, user_b = claimant)
  const { data: conv, error: convError } = await supabase
    .from("conversations")
    .upsert(
      { post_id: postId, user_a_id: postOwnerId, user_b_id: currentUserId },
      { onConflict: "post_id,user_a_id,user_b_id", ignoreDuplicates: false }
    )
    .select("id")
    .single();

  if (convError) return { conversationId: null, error: convError.message };

  // Update post status → claimed
  await supabase.from("posts").update({ status: "claimed" }).eq("id", postId);

  return { conversationId: conv.id, error: null };
}

// ─── Delete post + images ─────────────────────────────────────────
/**
 * Deletes all storage objects for a post then deletes the post row.
 * @param {string} postId
 * @param {string} userId
 * @param {string[]} imageUrls  existing image public URLs to derive storage paths
 * @returns {{ error: string | null }}
 */
export async function deletePostWithImages(postId, userId, imageUrls = []) {
  // Remove storage files
  if (imageUrls.length > 0) {
    const paths = imageUrls.map((url) => {
      // Extract path after /object/public/post-images/
      const marker = "/object/public/post-images/";
      const idx = url.indexOf(marker);
      return idx !== -1 ? url.slice(idx + marker.length) : null;
    }).filter(Boolean);

    if (paths.length > 0) {
      await supabase.storage.from("post-images").remove(paths);
    }
  }

  const { error } = await supabase.from("posts").delete().eq("id", postId);
  return { error: error?.message ?? null };
}

// ─── Category icons ───────────────────────────────────────────────
export const CATEGORY_ICONS = {
  "ID Card": "🪪",
  "Keys": "🔑",
  "Wallet": "👛",
  "Phone": "📱",
  "Laptop": "💻",
  "Books": "📚",
  "Earphones": "🎧",
  "Water Bottle": "💧",
  "Others": "📦",
};

export const CATEGORIES = Object.keys(CATEGORY_ICONS);
