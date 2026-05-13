import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import Navbar from './components/Navbar';
import Feed from './components/Feed';
import CreatePost from './components/CreatePost';
import SidebarLeft from './components/SidebarLeft';
import SidebarRight from './components/SidebarRight';
import UserProfile from './components/UserProfile';
import Chat from './components/Chat';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<'home' | 'profile' | 'messages' | 'video'>('home');

  useEffect(() => {
    // Vérifie la session au chargement du composant
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Écoute les changements d'état (connexion/déconnexion)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Si l'utilisateur n'est pas connecté, on affiche la page de Login
  if (!session) {
    return <Auth />;
  }

  // Si connecté, on affiche l'interface complète en 3 colonnes
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar 
        userEmail={session.user.email} 
        onProfileClick={() => setView('profile')} 
        onHomeClick={() => setView('home')} 
        onMessagesClick={() => setView('messages')}
        onVideoClick={() => setView('video')}
        activeView={view}
      />
      
      <main className="flex-1 flex justify-center w-full max-w-[1600px] mx-auto">
        {/* Colonne Gauche - Navigation & Raccourcis */}
        <SidebarLeft 
          onProfileClick={() => setView('profile')} 
          onHomeClick={() => setView('home')} 
          onVideoClick={() => setView('video')}
          onMessagesClick={() => setView('messages')}
          activeView={view} 
        />

        {/* Colonne Centre - Contenu principal */}
        <div className={`flex-1 w-full px-4 py-6 space-y-6 ${view === 'messages' ? 'max-w-4xl' : 'max-w-[680px]'}`}>
          {view === 'home' && (
            <>
              <CreatePost />
              <Feed />
            </>
          )}
          {view === 'profile' && <UserProfile />}
          {view === 'messages' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-[600px]">
              <Chat />
            </div>
          )}
          {view === 'video' && (
            <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-slate-200">
              <span className="text-6xl mb-4 block">📺</span>
              <h2 className="text-2xl font-bold text-slate-800">Vidéos Niavo Watch</h2>
              <p className="text-slate-500">Bientôt disponible !</p>
            </div>
          )}
        </div>

        {/* Colonne Droite - Contacts & Chat */}
        <SidebarRight onMessagesClick={() => setView('messages')} />
      </main>
    </div>
  );
}