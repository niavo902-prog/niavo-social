import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import Navbar from './components/Navbar';
import Feed from './components/Feed';
import CreatePost from './components/CreatePost';
import UserProfile from './components/UserProfile';
import Chat from './components/Chat';
import NotificationCenter from './components/NotificationCenter';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'chat' | 'profile'>('feed');

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

  // Si connecté, on affiche l'interface complète
  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">Niavo Social</h1>
          <div className="flex items-center gap-4">
            <NotificationCenter />
            <Navbar userEmail={session.user.email} />
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="flex gap-4 mb-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('feed')}
            className={`pb-3 px-4 font-semibold border-b-2 transition ${
              activeTab === 'feed'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            Fil d'actualité
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`pb-3 px-4 font-semibold border-b-2 transition ${
              activeTab === 'chat'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            Messages
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-4 font-semibold border-b-2 transition ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            Profil
          </button>
        </div>

        <div className="mb-6">
          {activeTab === 'feed' && (
            <div className="flex justify-center">
              <div className="w-full max-w-2xl space-y-6">
                <CreatePost />
                <Feed />
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="h-screen">
              <Chat />
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="flex justify-center">
              <div className="w-full max-w-2xl">
                <UserProfile />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}