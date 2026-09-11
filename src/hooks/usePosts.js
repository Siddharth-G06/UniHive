import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

const PAGE_SIZE = 10;

// Correct PostgREST join syntax: table!fk_column (columns)
const USER_SELECT = "users!user_id ( username, avatar_url, reputation_score, college )";

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
      .select(`*, ${USER_SELECT}`)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (types && types.length > 0) q = q.in("type", types);
    if (status) q = q.eq("status", status);
    if (category) q = q.eq("category", category);
    if (search) q = q.ilike("title", `%${search}%`);
    if (userId) q = q.eq("user_id", userId);

    return q;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [types?.join(","), status, category, search, userId]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    offsetRef.current = 0;

    const { data, error: fetchError } = await buildQuery(0);
    if (fetchError) {
      console.error("usePosts fetch error:", fetchError);
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
        return [...prev, ...data.filter((p) => !existingIds.has(p.id))];
      });
      setHasMore(data.length === PAGE_SIZE);
    }
  }, [buildQuery]);

  // Realtime subscription for live INSERT events
  useEffect(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`posts-rt-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        async (payload) => {
          const newPost = payload.new;
          if (types && types.length > 0 && !types.includes(newPost.type)) return;
          if (userId && newPost.user_id !== userId) return;

          // Fetch full post with correct join syntax
          const { data } = await supabase
            .from("posts")
            .select(`*, ${USER_SELECT}`)
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
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [types?.join(","), userId]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  return { posts, loading, error, hasMore, loadMore, refetch: fetchPosts };
}
