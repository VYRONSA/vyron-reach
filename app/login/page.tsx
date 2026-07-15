'use client';
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { VYRON_STORAGE_KEY } from '@/lib/vyronStore/storage';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(`Access Denied: ${error.message}`);
      setLoading(false);
    } else {
      // Reset local app state on login, but preserve owner data and the
      // Supabase session token itself (supabase-js persists it under a
      // 'sb-...-auth-token' key) — clearing it here would log the user
      // straight back out on the next page load.
      const preserveExact = new Set([VYRON_STORAGE_KEY, 'vyron-reach-owner-meta-v2']);
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || preserveExact.has(key) || key.startsWith('sb-')) continue;
        keysToRemove.push(key);
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  return (
    <div className="fixed inset-0 bg-[#050D1A] flex items-center justify-center p-6 z-[200]">
      <div className="w-full max-w-md bg-white rounded-[40px] p-12 shadow-2xl animate-in fade-in zoom-in duration-500">
        <div className="mb-10 text-center">
          <div className="w-12 h-12 bg-[#2563EB] rounded-2xl flex items-center justify-center font-black text-white text-xs mx-auto mb-4">V</div>
          <h2 className="text-3xl font-black text-[#050D1A] tracking-tighter uppercase">Vyron <span className="text-[#2563EB]">Access</span></h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Secure Node Authentication</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-2 block">Admin Email</label>
            <input type="email" placeholder="erkie@example.com" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-[#2563EB] transition-all" onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-2 block">Security Key</label>
            <input type="password" placeholder="••••••••" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-[#2563EB] transition-all" onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button disabled={loading} className="w-full py-5 bg-[#2563EB] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all">
            {loading ? 'Authenticating...' : 'Sign In to Reach'}
          </button>
        </form>
      </div>
    </div>
  );
}