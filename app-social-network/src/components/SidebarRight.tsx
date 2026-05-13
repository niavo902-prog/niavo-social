import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { UserProfile } from '../types';

export default function SidebarRight({ onMessagesClick }: { onMessagesClick: () => void }) {
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const init = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id) {
        fetchUsers(userData.user.id);
      }
    };
    init();
  }, []);

  const fetchUsers = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .neq('id', userId)
      .limit(10);
    if (data) setAvailableUsers(data);
  };

  return (
    <aside className="hidden xl:flex flex-col w-72 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto p-4 space-y-4">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-500">Contacts</h3>
          <div className="flex gap-4 text-slate-500">
            <button className="hover:bg-slate-200 p-1 rounded-full">🔍</button>
            <button className="hover:bg-slate-200 p-1 rounded-full">...</button>
          </div>
        </div>
        
        <div className="space-y-1">
          {availableUsers.map((user) => (
            <button
              key={user.id}
              onClick={onMessagesClick}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-200 transition-colors w-full text-left relative group"
            >
              <div className="relative">
                <img
                  src={user.avatar_url || 'https://via.placeholder.com/36'}
                  alt="Avatar"
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-100 rounded-full" />
              </div>
              <span className="font-medium text-[15px]">{user.full_name || 'Utilisateur'}</span>
            </button>
          ))}
          
          {availableUsers.length === 0 && (
            <p className="text-sm text-slate-400 italic px-2">Aucun contact en ligne</p>
          )}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <h3 className="font-semibold text-slate-500 mb-4">Conversations de groupe</h3>
        <button className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-200 transition-colors w-full text-left">
          <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center text-xl">
            ➕
          </div>
          <span className="font-medium text-[15px]">Créer un groupe</span>
        </button>
      </div>
    </aside>
  );
}
