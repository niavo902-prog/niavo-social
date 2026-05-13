import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { UserProfile } from '../types';

export default function SidebarLeft({ 
  onProfileClick, 
  onHomeClick, 
  onVideoClick,
  onMessagesClick,
  activeView 
}: { 
  onProfileClick: () => void;
  onHomeClick: () => void;
  onVideoClick: () => void;
  onMessagesClick: () => void;
  activeView: string;
}) {
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

  return (
    <aside className="hidden lg:flex flex-col w-64 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto p-2 space-y-1">
      {/* Home Shortcut */}
      <button 
        onClick={onHomeClick}
        className={`flex items-center gap-3 p-2 rounded-xl transition-colors w-full text-left ${activeView === 'home' ? 'bg-slate-200' : 'hover:bg-slate-200'}`}
      >
        <span className="text-2xl w-9 h-9 flex items-center justify-center">🏠</span>
        <span className="font-semibold text-[15px]">Fil d'actualité</span>
      </button>

      {/* User Profile Shortcut */}
      <button 
        onClick={onProfileClick}
        className={`flex items-center gap-3 p-2 rounded-xl transition-colors w-full text-left ${activeView === 'profile' ? 'bg-slate-200' : 'hover:bg-slate-200'}`}
      >
        <img
          src={profile?.avatar_url || 'https://via.placeholder.com/36'}
          alt="Avatar"
          className="w-9 h-9 rounded-full object-cover"
        />
        <span className="font-semibold text-[15px]">{profile?.full_name || 'Votre profil'}</span>
      </button>

      {/* Navigation items */}
      <button 
        onClick={onMessagesClick}
        className={`flex items-center gap-3 p-2 rounded-xl transition-colors w-full text-left ${activeView === 'messages' ? 'bg-slate-200' : 'hover:bg-slate-200'}`}
      >
        <span className="text-2xl text-blue-500 w-9 h-9 flex items-center justify-center">💬</span>
        <span className="font-semibold text-[15px]">Messages</span>
      </button>

      <button 
        onClick={onVideoClick}
        className={`flex items-center gap-3 p-2 rounded-xl transition-colors w-full text-left ${activeView === 'video' ? 'bg-slate-200' : 'hover:bg-slate-200'}`}
      >
        <span className="text-2xl text-blue-400 w-9 h-9 flex items-center justify-center">📺</span>
        <span className="font-semibold text-[15px]">Vidéo</span>
      </button>

      <button className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-200 transition-colors w-full text-left">
        <span className="text-2xl text-blue-500 w-9 h-9 flex items-center justify-center">👥</span>
        <span className="font-semibold text-[15px]">Amis</span>
      </button>

      <button className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-200 transition-colors w-full text-left">
        <span className="text-2xl text-blue-400 w-9 h-9 flex items-center justify-center">🕒</span>
        <span className="font-semibold text-[15px]">Souvenirs</span>
      </button>

      <button className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-200 transition-colors w-full text-left">
        <span className="text-2xl text-purple-500 w-9 h-9 flex items-center justify-center">🔖</span>
        <span className="font-semibold text-[15px]">Enregistrements</span>
      </button>

      <div className="border-t border-slate-200 my-2 pt-2">
        <h3 className="px-2 text-slate-500 font-semibold text-sm mb-1">Vos raccourcis</h3>
        <p className="px-2 text-xs text-slate-400 italic">Aucun raccourci pour le moment</p>
      </div>
      
      <footer className="mt-auto p-2 text-[12px] text-slate-500">
        <p>Confidentialité · Conditions · Publicité · Cookies · Niavo Social © 2026</p>
      </footer>
    </aside>
  );
}
