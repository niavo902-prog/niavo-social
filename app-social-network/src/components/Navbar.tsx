import { supabase } from '../supabaseClient';

export default function Navbar({ userEmail }: { userEmail: string }) {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-300 shadow-sm h-14 flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <h1 className="text-blue-600 text-3xl font-black tracking-tighter">niavo</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-slate-100 p-1 pr-3 rounded-full">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            {userEmail[0].toUpperCase()}
          </div>
          <span className="text-sm font-semibold hidden md:block">{userEmail.split('@')[0]}</span>
        </div>
        <button 
          onClick={() => supabase.auth.signOut()} 
          className="text-xs font-bold text-slate-500 hover:text-red-500 uppercase tracking-wider"
        >
          Déconnexion
        </button>
      </div>
    </nav>
  );
}