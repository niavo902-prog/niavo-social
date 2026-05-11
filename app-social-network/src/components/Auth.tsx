import { useState } from 'react';
import { supabase } from '../supabaseClient'
export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert("Vérifiez vos emails pour confirmer l'inscription !");
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
      <h1 className="text-4xl font-black text-blue-500 mb-8">Niavo Social</h1>
      <form className="bg-slate-800 p-8 rounded-2xl shadow-xl w-96 border border-slate-700">
        <input 
          type="email" placeholder="Email" 
          className="w-full p-3 mb-4 bg-slate-900 rounded-lg border border-slate-600 outline-none focus:border-blue-500"
          onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          type="password" placeholder="Mot de passe" 
          className="w-full p-3 mb-6 bg-slate-900 rounded-lg border border-slate-600 outline-none focus:border-blue-500"
          onChange={(e) => setPassword(e.target.value)} 
        />
        <button onClick={handleLogin} disabled={loading} className="w-full bg-blue-600 py-3 rounded-lg font-bold mb-3 hover:bg-blue-500">
          Se connecter
        </button>
        <button onClick={handleSignUp} disabled={loading} className="w-full text-blue-400 text-sm hover:underline">
          Créer un compte
        </button>
      </form>
    </div>
  );
}