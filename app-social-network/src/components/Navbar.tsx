import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import NotificationCenter from './NotificationCenter';
import type { UserProfile } from '../types';

export default function Navbar({ 
  userEmail, 
  onProfileClick, 
  onHomeClick,
  onMessagesClick,
  onVideoClick,
  activeView
}: { 
  userEmail: string; 
  onProfileClick: () => void;
  onHomeClick: () => void;
  onMessagesClick: () => void;
  onVideoClick: () => void;
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
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm h-14 flex items-center justify-between px-4">
      {/* Left: Logo and Search */}
      <div className="flex items-center gap-2 flex-1">
        <div 
          onClick={onHomeClick}
          className="text-blue-600 text-4xl font-black tracking-tighter cursor-pointer"
        >
          n
        </div>
        <div className="relative hidden md:block">
          <input
            type="text"
            placeholder="Rechercher sur Niavo Social"
            className="bg-slate-100 h-10 w-60 pl-10 pr-4 rounded-full text-[15px] focus:outline-none"
          />
          <span className="absolute left-3 top-2.5 text-slate-500">🔍</span>
        </div>
      </div>

      {/* Center: Main Navigation Icons */}
      <div className="hidden lg:flex items-center justify-center gap-1 flex-1 h-full">
        <button 
          onClick={onHomeClick}
          className={`h-full px-10 border-b-4 transition-colors ${activeView === 'home' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
        >
          <span className="text-2xl">🏠</span>
        </button>
        <button 
          onClick={onVideoClick}
          className={`h-full px-10 border-b-4 transition-colors ${activeView === 'video' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
        >
          <span className="text-2xl">📺</span>
        </button>
        <button className="h-full px-10 border-b-4 border-transparent text-slate-500 hover:bg-slate-50">
          <span className="text-2xl">🏪</span>
        </button>
        <button className="h-full px-10 border-b-4 border-transparent text-slate-500 hover:bg-slate-50">
          <span className="text-2xl">👨‍👩‍👧‍👦</span>
        </button>
        <button className="h-full px-10 border-b-4 border-transparent text-slate-500 hover:bg-slate-50">
          <span className="text-2xl">🎮</span>
        </button>
      </div>

      {/* Right: User Actions */}
      <div className="flex items-center justify-end gap-2 flex-1">
        <div 
          onClick={onProfileClick}
          className={`flex items-center gap-1 p-1 rounded-full cursor-pointer pr-3 ml-2 ${activeView === 'profile' ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100'}`}
        >
          <img
            src={profile?.avatar_url || 'https://via.placeholder.com/32'}
            alt="Avatar"
            className="w-8 h-8 rounded-full object-cover"
          />
          <span className="text-[15px] font-semibold hidden xl:block ml-1">
            {profile?.full_name?.split(' ')[0] || userEmail.split('@')[0]}
          </span>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={onMessagesClick}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${activeView === 'messages' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 hover:bg-slate-200'}`}
          >
            💬
          </button>
          <div className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center">
            <NotificationCenter />
          </div>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-lg"
            title="Déconnexion"
          >
            ▼
          </button>
        </div>
      </div>
    </nav>
  );
}