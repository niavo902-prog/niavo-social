import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { Post } from '../types';

interface PostCardProps {
  post: Post;
  onPostUpdated?: () => void;
}

export default function PostCard({ post, onPostUpdated }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const author = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user?.id) setCurrentUserId(userData.user.id);
  };

  const handleLike = async () => {
    if (!currentUserId) return;

    try {
      // S'assurer que le profil utilisateur existe
      await supabase.from('profiles').upsert({
        id: currentUserId,
        full_name: '',
        avatar_url: '',
      });

      if (isLiked) {
        await supabase.from('likes').delete().match({ post_id: post.id, user_id: currentUserId });
        setLikesCount(Math.max(0, likesCount - 1));
        setIsLiked(false);
      } else {
        await supabase.from('likes').insert({ post_id: post.id, user_id: currentUserId });
        setLikesCount(likesCount + 1);
        setIsLiked(true);
      }
    } catch (err) {
      console.error('Erreur like:', err);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles!user_id (full_name, avatar_url)
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error('Erreur commentaires:', err);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !currentUserId) return;

    setLoading(true);
    try {
      // S'assurer que le profil utilisateur existe
      await supabase.from('profiles').upsert({
        id: currentUserId,
        full_name: '',
        avatar_url: '',
      });

      const { error } = await supabase.from('comments').insert({
        post_id: post.id,
        user_id: currentUserId,
        content: comment,
      });

      if (error) throw error;

      setComment('');
      await fetchComments();
      onPostUpdated?.();
    } catch (err) {
      console.error('Erreur ajout commentaire:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;
      await fetchComments();
      onPostUpdated?.();
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: 'Voir ce post',
        text: post.content.substring(0, 100),
        url,
      });
    } else {
      alert('Lien copié: ' + url);
      navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <img
          src={author?.avatar_url || 'https://via.placeholder.com/40'}
          alt="Avatar"
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <p className="font-bold text-slate-800">{author?.full_name || 'Anonyme'}</p>
          <p className="text-xs text-slate-500">{new Date(post.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Content */}
      <p className="text-slate-700 mb-3">{post.content}</p>

      {/* Media */}
      {post.image_url && <img src={post.image_url} alt="Post" className="w-full rounded-lg mb-3 max-h-96 object-cover" />}

      {/* Actions */}
      <div className="flex gap-6 py-3 border-t border-slate-200 text-slate-600">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 hover:text-blue-600 ${isLiked ? 'text-blue-600 font-bold' : ''}`}
        >
          <span className="text-xl">{isLiked ? '❤️' : '🤍'}</span>
          {likesCount}
        </button>

        <button
          onClick={() => {
            setShowComments(!showComments);
            if (!showComments) fetchComments();
          }}
          className="flex items-center gap-2 hover:text-blue-600"
        >
          <span className="text-xl">💬</span>
          {post.comments_count || 0}
        </button>

        <button onClick={handleShare} className="flex items-center gap-2 hover:text-blue-600">
          <span className="text-xl">📤</span>
          Partager
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 space-y-4 border-t pt-4">
          <div className="space-y-2">
            {comments.map((cmt) => (
              <div key={cmt.id} className="bg-slate-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <img
                      src={cmt.profiles?.avatar_url || 'https://via.placeholder.com/30'}
                      alt="Avatar"
                      className="w-6 h-6 rounded-full"
                    />
                    <p className="font-bold text-sm text-slate-800">{cmt.profiles?.full_name || 'Anonyme'}</p>
                  </div>
                  {cmt.user_id === currentUserId && (
                    <button
                      onClick={() => handleDeleteComment(cmt.id)}
                      className="text-red-500 text-xs hover:text-red-700"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p className="text-slate-700 text-sm">{cmt.content}</p>
              </div>
            ))}
          </div>

          {/* Add Comment */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ajouter un commentaire..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <button
              onClick={handleAddComment}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-slate-400"
            >
              {loading ? '...' : 'Envoyer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
