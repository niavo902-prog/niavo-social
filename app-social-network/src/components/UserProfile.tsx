import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { UserProfile } from '../types';

export default function UserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ full_name: '', avatar_url: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) throw new Error('Non authentifié');

      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id)
        .single();

      if (dbError && dbError.code !== 'PGRST116') throw dbError;

      if (data) {
        setProfile(data);
        setFormData({ full_name: data.full_name || '', avatar_url: data.avatar_url || '' });
      }
    } catch (err) {
      console.error('Erreur profil:', err);
      setError('Impossible de charger le profil');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setError('');
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) throw new Error('Non authentifié');

      const { error: dbError } = await supabase.from('profiles').upsert({
        id: userData.user.id,
        full_name: formData.full_name,
        avatar_url: formData.avatar_url,
        updated_at: new Date().toISOString(),
      });

      if (dbError) throw dbError;

      setProfile({ ...formData, id: userData.user.id, created_at: new Date().toISOString() });
      setIsEditing(false);
    } catch (err) {
      console.error('Erreur mise à jour:', err);
      setError('Impossible de mettre à jour le profil');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) return <div className="text-center text-slate-400">Chargement du profil...</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-start gap-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-2">
          <img
            src={formData.avatar_url || 'https://via.placeholder.com/100'}
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover border-2 border-blue-400"
          />
          {isEditing && (
            <input
              type="text"
              placeholder="URL avatar"
              value={formData.avatar_url}
              onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
              className="text-xs w-24 px-2 py-1 border rounded"
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nom complet"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleUpdate}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400"
                >
                  {loading ? 'Sauvegarde...' : 'Enregistrer'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{profile?.full_name || 'Sans nom'}</h2>
              <button
                onClick={() => setIsEditing(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Modifier le profil
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
