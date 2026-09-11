import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

const PAGE_SIZE = 10;

/**
 * Fetches posts with optional filters + realtime subscription.
 * @param {object} options
 * @param {string[]} [options.types]       - e.g. ["lost","found"]
 * @param {string}   [options.status]      - "active" | "claimed" | "resolved"
 * @param {string}   [options.category]    - exact category name or ""
 * @param {string}   [options.search]      - ilike search on title
 * @param {string}   [options.userId]      - filter to a specific user
 */
export function usePosts({ types, status, category, search, userId } = {}) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const offsetRef = useRef(0);
  const channelRef = useRef(null);

  const buildQuery = useCallback((from = 0) => {
    let q = supabase
      .from("posts")
      .select(`
        *,
        users:user_id (
          username,
          avatar_url,
          reputation_score,
          college
        )
      `)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (types && types.length > 0) q = q.in("type", types);
    if (status) q = q.eq("status", status);
    if (category) q = q.eq("category", category);
    if (search) q = q.ilike("title", `%${search}%`);
    if (userId) q = q.eq("user_id", userId);

    return q;
  }, [types?.join(","), status, category, search, userId]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    offsetRef.current = 0;

    const { data, error: fetchError } = await buildQuery(0);
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setPosts(data ?? []);
      setHasMore((data ?? []).length === PAGE_SIZE);
    }
    setLoading(false);
  }, [buildQuery]);

  const loadMore = useCallback(async () => {
    const nextOffset = offsetRef.current + PAGE_SIZE;
    offsetRef.current = nextOffset;
    const { data, error: fetchError } = await buildQuery(nextOffset);
    if (!fetchError && data) {
      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newPosts = data.filter((p) => !existingIds.has(p.id));
        return [...prev, ...newPosts];
      });
      setHasMore(data.length === PAGE_SIZE);
    }
  }, [buildQuery]);

  // Subscribe to realtime INSERT events
  useEffect(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`posts-realtime-${Math.random()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        async (payload) => {
          const newPost = payload.new;
          // Only add if matches type filter
          if (types && types.length > 0 && !types.includes(newPost.type)) return;
          if (userId && newPost.user_id !== userId) return;

          // Fetch full post with joined user
          const { data } = await supabase
            .from("posts")
            .select(`*, users:user_id (username, avatar_url, reputation_score, college)`)
            .eq("id", newPost.id)
            .single();

          if (data) {
            setPosts((prev) => {
              if (prev.some((p) => p.id === data.id)) return prev;
              return [data, ...prev];
            });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [types?.join(","), userId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, loading, error, hasMore, loadMore, refetch: fetchPosts };
}
