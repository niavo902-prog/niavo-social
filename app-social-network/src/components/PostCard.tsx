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

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: 'Voir ce post',
        text: post.content.substring(0, 100),
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Lien copié !');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <img
          src={author?.avatar_url || 'https://via.placeholder.com/40'}
          alt="Avatar"
          className="w-10 h-10 rounded-full object-cover cursor-pointer"
        />
        <div className="flex-1">
          <p className="font-bold text-[15px] text-slate-900 hover:underline cursor-pointer">
            {author?.full_name || 'Utilisateur'}
          </p>
          <div className="flex items-center gap-1 text-slate-500 text-xs">
            <span>{new Date(post.created_at).toLocaleDateString()}</span>
            <span>·</span>
            <span>🌍</span>
          </div>
        </div>
        <button className="text-slate-500 hover:bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center">
          ...
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-[15px] text-slate-900 whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Media */}
      {post.image_url && (
        <div className="border-y border-slate-100 bg-slate-50">
          <img src={post.image_url} alt="Post" className="w-full max-h-[500px] object-contain mx-auto" />
        </div>
      )}

      {/* Stats */}
      {(likesCount > 0 || post.comments_count > 0) && (
        <div className="px-4 py-2 flex items-center justify-between text-slate-500 text-[14px]">
          <div className="flex items-center gap-1">
            <span className="bg-blue-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px]">👍</span>
            <span>{likesCount}</span>
          </div>
          <div className="flex gap-3">
            {post.comments_count > 0 && <span>{post.comments_count} commentaires</span>}
            <span>{Math.floor(Math.random() * 10)} partages</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-1 flex gap-1 border-t border-slate-100 mx-3">
        <button
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-2 hover:bg-slate-100 rounded-lg transition-colors ${
            isLiked ? 'text-blue-600' : 'text-slate-600'
          }`}
        >
          <span className="text-xl">{isLiked ? '👍' : '🩶'}</span>
          <span className="font-semibold text-sm">J'aime</span>
        </button>

        <button
          onClick={() => {
            setShowComments(!showComments);
            if (!showComments) fetchComments();
          }}
          className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
        >
          <span className="text-xl">💬</span>
          <span className="font-semibold text-sm">Commenter</span>
        </button>

        <button 
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
        >
          <span className="text-xl">📤</span>
          <span className="font-semibold text-sm">Partager</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-100 mt-1 pt-3">
          <div className="space-y-3">
            {comments.map((cmt) => (
              <div key={cmt.id} className="flex gap-2">
                <img
                  src={cmt.profiles?.avatar_url || 'https://via.placeholder.com/32'}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
                <div className="bg-slate-100 px-3 py-2 rounded-2xl max-w-[90%]">
                  <p className="font-bold text-xs text-slate-900">{cmt.profiles?.full_name || 'Anonyme'}</p>
                  <p className="text-sm text-slate-800">{cmt.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Add Comment */}
          <div className="flex gap-2 items-center">
            <img
              src={author?.avatar_url || 'https://via.placeholder.com/32'}
              alt="My Avatar"
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Écrivez un commentaire..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                className="w-full px-3 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-0 focus:outline-none"
              />
              <div className="absolute right-3 top-2 flex gap-2 text-slate-400">
                <span>😊</span>
                <span>📷</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
