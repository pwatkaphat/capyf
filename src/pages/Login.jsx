import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Sprout } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    let error;
    if (isRegister) {
      const res = await supabase.auth.signUp({ email, password });
      error = res.error;
    } else {
      const res = await supabase.auth.signInWithPassword({ email, password });
      error = res.error;
    }

    if (error) {
      setErrorMsg(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>

      <div className="glass-panel w-full max-w-md p-10 relative z-10">
        <div className="mb-10 text-center flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-xl shadow-emerald-500/30 mb-6">
            <Sprout size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="mt-3 text-slate-500 font-medium">
            {isRegister ? 'Start using your Smart Farm IoT system' : 'Sign in to view the latest sensor feeds'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 rounded-2xl bg-red-50/80 p-4 text-sm font-medium text-red-600 border border-red-100">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-5 py-3.5 text-slate-800 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              placeholder="name@example.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-5 py-3.5 text-slate-800 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-2xl bg-emerald-600 px-5 py-4 text-white font-bold tracking-wide transition-all hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/30 active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? 'Processing...' : (isRegister ? 'Register' : 'Login')}
          </button>
        </form>

        <div className="mt-8 text-center text-sm font-medium text-slate-500">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="ml-2 font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            {isRegister ? 'Login' : 'Register for free'}
          </button>
        </div>
      </div>
    </div>
  );
}
