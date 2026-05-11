import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import PostCard from './PostCard';
import type { Post } from '../types';

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          image_url,
          created_at,
          user_id,
          profiles!user_id (id, full_name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Add counts (we'll fetch these separately or from realtime)
      const enrichedPosts = (data || []).map((post: any) => ({
        ...post,
        profiles: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles,
        likes_count: 0,
        comments_count: 0,
        is_liked: false
      }));
      
      setPosts(enrichedPosts);
    } catch (error) {
      console.error('Erreur de chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();

    // Configuration du Realtime pour voir les messages en direct
    const channel = supabase
      .channel('posts-realtime-' + Math.random().toString(36).substr(2, 9))
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        () => {
          fetchPosts(); // Recharge la liste quand un nouveau post arrive
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) return <p className="text-center text-slate-400">Chargement du flux...</p>;

  return (
    <div className="space-y-4">
      {posts.length === 0 ? (
        <p className="text-center text-slate-500 italic">Aucun message pour le moment.</p>
      ) : (
        posts.map((post) => (
          <PostCard key={post.id} post={post} onPostUpdated={fetchPosts} />
        ))
      )}
    </div>
  );
}