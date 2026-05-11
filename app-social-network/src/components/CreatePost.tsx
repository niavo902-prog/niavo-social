import { useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../supabaseClient';


export default function CreatePost() {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userData.user.id,
        full_name: '',
        avatar_url: '',
      });

      if (profileError) {
        throw profileError;
      }

      const { error: insertError } = await supabase.from('posts').insert([
        {
          content: content.trim(),
          image_url: imageUrl || null,
          user_id: userData.user.id,
        },
      ]);

      if (insertError) {
        throw insertError;
      }

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
    <section className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-semibold text-slate-800 mb-4">Publier un nouveau post</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="w-full min-h-[110px] rounded-3xl border border-slate-300 bg-slate-50 p-4 text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 outline-none"
          placeholder="Quoi de neuf ?"
        />

        {/* Image & Video URLs */}
        <div className="space-y-2">
          <input
            type="url"
            placeholder="URL de l'image (optionnel)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
        </div>

        {/* Preview */}
        {imageUrl && (
          <img src={imageUrl} alt="Preview" className="w-full rounded-lg max-h-64 object-cover" />
        )}

        {error ? <p className="text-sm text-red-500">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? 'Publication...' : 'Publier'}
        </button>
      </form>
    </section>
  );
}