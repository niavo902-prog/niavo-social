import { useState } from 'react';
import { supabase } from '../supabaseClient';

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
    if (error) {
      alert(error.message);
    } else {
      alert("Vérifiez vos emails pour confirmer l'inscription !");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center min-h-screen bg-[#f0f2f5] p-6">
      <div className="lg:w-1/2 max-w-[500px] mb-10 lg:mb-0 lg:pr-10 text-center lg:text-left">
        <h1 className="text-blue-600 text-6xl font-black tracking-tighter mb-4">niavo social</h1>
        <p className="text-2xl text-slate-800 font-medium leading-tight">
          Niavo Social vous permet de rester en contact avec les personnes qui comptent pour vous.
        </p>
      </div>

      <div className="w-full max-w-[400px]">
        <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200">
          <form className="space-y-4">
            <input 
              type="email" 
              placeholder="Adresse e-mail" 
              className="w-full p-4 bg-white rounded-lg border border-slate-300 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[17px]"
              onChange={(e) => setEmail(e.target.value)} 
            />
            <input 
              type="password" 
              placeholder="Mot de passe" 
              className="w-full p-4 bg-white rounded-lg border border-slate-300 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[17px]"
              onChange={(e) => setPassword(e.target.value)} 
            />
            <button 
              onClick={handleLogin} 
              disabled={loading} 
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-xl hover:bg-[#166fe5] transition-colors"
            >
              Se connecter
            </button>
            <div className="text-center py-2">
              <button type="button" className="text-blue-600 text-sm hover:underline font-medium">
                Mot de passe oublié ?
              </button>
            </div>
            <hr className="border-slate-200" />
            <div className="text-center pt-2 pb-1">
              <button 
                onClick={handleSignUp} 
                disabled={loading} 
                className="bg-[#42b72a] hover:bg-[#36a420] text-white font-bold py-3 px-6 rounded-lg text-[17px] transition-colors"
              >
                Créer nouveau compte
              </button>
            </div>
          </form>
        </div>
        <p className="text-center mt-6 text-sm text-slate-600">
          <b>Créer une Page</b> pour une célébrité, une marque ou une entreprise.
        </p>
      </div>
    </div>
  );
}