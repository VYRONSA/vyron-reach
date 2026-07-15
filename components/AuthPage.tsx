"use client";

import { useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

function VyronReachLogo() {
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-500 shadow-xl shadow-fuchsia-500/30">
        <div className="absolute left-[15px] top-[11px] h-9 w-3 rotate-[-28deg] rounded-sm bg-white" />
        <div className="absolute right-[15px] top-[11px] h-9 w-3 rotate-[28deg] rounded-sm bg-slate-950/80" />
      </div>

      <div>
        <div className="text-2xl font-black tracking-[0.34em] text-white">
          VYRON
        </div>
        <div className="mt-[-2px] text-xs font-semibold tracking-[0.55em] text-fuchsia-300">
          REACH
        </div>
      </div>
    </div>
  );
}

export function AuthPage() {
  const [email, setEmail] = useState("precisionaccounting@gmail.com");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);

  async function handleAuth() {
    if (!supabase || !isSupabaseConfigured) {
      alert("Supabase is not configured. Check your .env.local file.");
      return;
    }

    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
      else alert("Signup successful. Check your email.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#eef1f7] p-3 text-slate-950 md:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-48px)] max-w-7xl overflow-hidden rounded-[34px] bg-white shadow-2xl md:grid-cols-[0.9fr_1.1fr]">
        <section className="relative bg-gradient-to-br from-[#050b18] via-[#071326] to-[#111033] p-8 text-white md:p-12">
          <VyronReachLogo />

          <div className="mt-16 text-xs font-black uppercase tracking-[0.55em] text-fuchsia-300">
            Secure Access
          </div>

          <h1 className="mt-7 max-w-xl text-5xl font-black leading-[0.95] tracking-tight md:text-6xl">
            Sign in to
            <br />
            VYRON REACH
          </h1>

          <p className="mt-8 max-w-xl text-base leading-8 text-purple-100">
            Marketing control, campaigns, leads, outreach, content planning and ROI visibility in one controlled system.
          </p>

          <div className="mt-14 space-y-4">
            <div className="rounded-2xl bg-white/10 px-5 py-4 text-sm text-purple-50">
              Role-based access for Owner, Marketing Manager, Sales User and Viewer roles.
            </div>

            <div className="rounded-2xl bg-white/10 px-5 py-4 text-sm text-purple-50">
              Company users are matched by logged-in email address.
            </div>

            <div className="rounded-2xl bg-white/10 px-5 py-4 text-sm text-purple-50">
              Campaigns, leads and reports stay protected behind login.
            </div>
          </div>
        </section>

        <section className="flex items-center p-8 md:p-12">
          <div className="w-full max-w-2xl">
            <div className="text-xs font-black uppercase tracking-[0.45em] text-fuchsia-600">
              VYRON REACH
            </div>

            <h2 className="mt-5 text-3xl font-black">
              {mode === "login" ? "Login" : "Create Account"}
            </h2>

            <p className="mt-4 text-sm leading-6 text-slate-500">
              Use the email that was added under Settings / Roles → Company Users.
            </p>

            {!isSupabaseConfigured && (
              <div className="mt-6 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700">
                Supabase is not configured. Add your project URL and anon key to `.env.local`, then restart the app.
              </div>
            )}

            <div className="mt-10">
              <label className="text-sm font-black">Email address</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-[#eaf1ff] px-5 py-4 text-sm font-black outline-none focus:border-fuchsia-400"
              />
            </div>

            <div className="mt-5">
              <label className="text-sm font-black">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                type="password"
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-[#eaf1ff] px-5 py-4 text-sm font-black outline-none focus:border-fuchsia-400"
              />
            </div>

            <button
              onClick={handleAuth}
              disabled={loading || !isSupabaseConfigured}
              className="mt-8 w-full rounded-2xl bg-[#030719] py-5 text-sm font-black text-white shadow-xl disabled:opacity-50"
            >
              {loading ? "Loading..." : mode === "login" ? "Login" : "Create Account"}
            </button>

            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="mt-5 w-full rounded-2xl bg-slate-100 py-5 text-sm font-black text-slate-900"
            >
              {mode === "login" ? "Need an account? Create one" : "Already have an account? Login"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}