'use client';
import React, { useEffect, useState } from 'react';
import { CommandPanel, Card } from '@/components/ui/Cards';
import { supabase } from '@/lib/supabase';
import { resolveCompanyMembership } from '@/lib/companyContext';

export default function SettingsPage() {
  const [autoReach, setAutoReach] = useState(true);
  const [workspace, setWorkspace] = useState<{ companyName: string; inviteCode: string | null; isOwner: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const membership = await resolveCompanyMembership();
        if (!membership) return;

        const { data: company } = await supabase
          .from('vyron_reach_companies')
          .select('company_name, invite_code')
          .eq('id', membership.companyId)
          .maybeSingle();

        if (!company) return;

        setWorkspace({
          companyName: company.company_name,
          inviteCode: company.invite_code,
          isOwner: membership.role === 'Owner',
        });
      } catch {
        // Not signed in / not onboarded yet — no workspace card to show.
      }
    })();
  }, []);

  const handleCopyInviteCode = async () => {
    if (!workspace?.inviteCode) return;
    await navigator.clipboard.writeText(workspace.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <CommandPanel title="System Settings" subtitle="VYRON REACH • Sentry AI Configuration">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2 h-2 bg-[#22D3EE] rounded-full animate-pulse" />
          <p className="text-[10px] font-black text-[#22D3EE] uppercase tracking-widest">Sentry Kernel v3.0.1</p>
        </div>
      </CommandPanel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AUTOMATION CONTROLS */}
        <Card className="p-10">
          <h4 className="text-xl font-black text-[#050D1A] mb-8">Automation Engine</h4>
          <div className="space-y-8">
            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[24px]">
              <div>
                <p className="font-black text-[#0F172A] text-sm uppercase">Smart Outreach Drafts</p>
                <p className="text-[11px] text-slate-400 font-bold mt-1">Allow Sentry to pre-draft follow-ups</p>
              </div>
              <button 
                onClick={() => setAutoReach(!autoReach)}
                className={`w-14 h-8 rounded-full transition-all flex items-center px-1 ${autoReach ? 'bg-[#2563EB]' : 'bg-slate-300'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full transition-all ${autoReach ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[24px]">
              <div>
                <p className="font-black text-[#0F172A] text-sm uppercase">Auto-Tag High Value</p>
                <p className="text-[11px] text-slate-400 font-bold mt-1">Tag leads over R 100,000</p>
              </div>
              <div className="w-14 h-8 bg-[#2563EB] rounded-full flex items-center px-1">
                <div className="w-6 h-6 bg-white rounded-full translate-x-6" />
              </div>
            </div>
          </div>
        </Card>

        {/* SYSTEM STATUS */}
        <div className="bg-[#050D1A] rounded-[34px] p-10 text-white shadow-2xl border border-white/5">
          <h4 className="text-xl font-black mb-8 text-[#22D3EE]">Sentry Health</h4>
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Database Connection</p>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Connected</p>
            </div>
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">API Latency</p>
              <p className="text-[10px] font-black text-[#22D3EE] uppercase tracking-widest">24ms</p>
            </div>
            <div className="flex justify-between items-center pb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Last Sync</p>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Just Now</p>
            </div>
            
            <button className="w-full mt-8 py-5 border border-white/10 rounded-[22px] font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all">
              Restart Sentry Kernel
            </button>
          </div>
        </div>
      </div>

      {workspace?.isOwner && (
        <Card className="p-10 mt-8">
          <h4 className="text-xl font-black text-[#050D1A] mb-2">Workspace Invite</h4>
          <p className="text-[11px] text-slate-400 font-bold mb-6">
            Share this code so a teammate can join {workspace.companyName} from the sign-in screen.
          </p>
          {workspace.inviteCode ? (
            <div className="flex items-center gap-4">
              <code className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-5 font-black text-lg tracking-[0.3em] text-[#0F172A]">
                {workspace.inviteCode}
              </code>
              <button
                onClick={handleCopyInviteCode}
                className="px-8 py-5 bg-[#2563EB] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:scale-105 active:scale-95 transition-all"
              >
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 font-bold">No invite code on this workspace yet.</p>
          )}
        </Card>
      )}
    </div>
  );
}