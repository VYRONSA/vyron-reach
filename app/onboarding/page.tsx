'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getSupabaseUserId } from '@/lib/vyronStore/supabaseSync';

type Mode = 'create' | 'join';

export default function OnboardingPage() {
  const [mode, setMode] = useState<Mode>('create');
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const userId = await getSupabaseUserId();
      if (!userId) window.location.href = '/login';
    })();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData.session?.user?.email ?? '';
      const { error: rpcError } = await supabase.rpc('vyron_reach_create_company', {
        p_company_name: companyName,
        p_contact_email: email,
      });
      if (rpcError) throw new Error(rpcError.message);
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create workspace.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData.session?.user?.email ?? '';
      const { error: rpcError } = await supabase.rpc('vyron_reach_join_company_by_code', {
        p_invite_code: inviteCode.trim(),
        p_email: email,
      });
      if (rpcError) throw new Error(rpcError.message);
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join workspace. Check the invite code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#050D1A] flex items-center justify-center p-6 z-[200]">
      <div className="w-full max-w-md bg-white rounded-[40px] p-12 shadow-2xl animate-in fade-in zoom-in duration-500">
        <div className="mb-10 text-center">
          <div className="w-12 h-12 bg-[#2563EB] rounded-2xl flex items-center justify-center font-black text-white text-xs mx-auto mb-4">V</div>
          <h2 className="text-3xl font-black text-[#050D1A] tracking-tighter uppercase">Set Up <span className="text-[#2563EB]">Workspace</span></h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">One more step before you start</p>
        </div>

        <div className="flex gap-2 mb-8 bg-slate-50 rounded-2xl p-1.5">
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition ${mode === 'create' ? 'bg-white shadow text-[#050D1A]' : 'text-slate-400'}`}
          >
            Create Workspace
          </button>
          <button
            onClick={() => setMode('join')}
            className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition ${mode === 'join' ? 'bg-white shadow text-[#050D1A]' : 'text-slate-400'}`}
          >
            Join Workspace
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 text-red-600 text-xs font-bold">{error}</div>
        )}

        {mode === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-2 block">Company Name</label>
              <input
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Growth Co"
                className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-[#2563EB] transition-all"
              />
            </div>
            <button disabled={loading} className="w-full py-5 bg-[#2563EB] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all">
              {loading ? 'Creating...' : 'Create Workspace'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-2 block">Invite Code</label>
              <input
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="e.g. 8f3a1c2d"
                className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-[#2563EB] transition-all"
              />
            </div>
            <button disabled={loading} className="w-full py-5 bg-[#2563EB] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all">
              {loading ? 'Joining...' : 'Join Workspace'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
