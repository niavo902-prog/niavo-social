import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../supabaseClient';
import type { UserProfile } from '../types';

export default function CreatePost() {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user?.id) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id)
        .single();
      if (data) setProfile(data);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!content.trim()) {
      setError('Écris quelque chose avant de publier.');
      return;
    }

    setLoading(true);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user?.id) {
        throw userError || new Error('Utilisateur non authentifié');
      }

      // S'assurer que le profil utilisateur existe
      await supabase.from('profiles').upsert({
        id: userData.user.id,
        full_name: profile?.full_name || '',
        avatar_url: profile?.avatar_url || '',
      });

      const { error: insertError } = await supabase.from('posts').insert([
        {
          content: content.trim(),
          image_url: imageUrl || null,
          user_id: userData.user.id,
        },
      ]);

      if (insertError) throw insertError;

      setContent('');
      setImageUrl('');
    } catch (err) {
      console.error('Erreur lors de la publication :', err);
      setError('Impossible de publier le post. Réessaie plus tard.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <img
            src={profile?.avatar_url || 'https://via.placeholder.com/40'}
            alt="Avatar"
            className="w-10 h-10 rounded-full object-cover"
          />
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="flex-1 min-h-[40px] bg-slate-100 rounded-full px-4 py-2 text-[17px] text-slate-900 placeholder-slate-500 hover:bg-slate-200 transition-colors focus:outline-none resize-none"
            placeholder={`Quoi de neuf, ${profile?.full_name?.split(' ')[0] || ''} ?`}
          />
        </div>

        {/* Preview and Input for Image URL */}
        {(imageUrl || content.length > 50) && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <input
              type="url"
              placeholder="URL de l'image (optionnel)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
            />
            {imageUrl && (
              <div className="relative group">
                <img src={imageUrl} alt="Preview" className="w-full rounded-lg max-h-64 object-cover border border-slate-200" />
                <button 
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}

        {error && <p className="text-xs text-red-500 px-2">{error}</p>}

        <div className="flex border-t border-slate-100 pt-3">
          <button type="button" className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-slate-50 rounded-lg transition-colors">
            <span className="text-xl">📹</span>
            <span className="font-semibold text-slate-600 text-sm">Vidéo en direct</span>
          </button>
          <button type="button" className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-slate-50 rounded-lg transition-colors">
            <span className="text-xl">🖼️</span>
            <span className="font-semibold text-slate-600 text-sm">Photo/vidéo</span>
          </button>
          <button type="button" className="hidden sm:flex flex-1 items-center justify-center gap-2 py-2 hover:bg-slate-50 rounded-lg transition-colors">
            <span className="text-xl">😊</span>
            <span className="font-semibold text-slate-600 text-sm">Humeur/activité</span>
          </button>
        </div>

        {content.trim() && (
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300 mt-2"
          >
            {loading ? 'Publication...' : 'Publier'}
          </button>
        )}
      </form>
    </section>
  );
}