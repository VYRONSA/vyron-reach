import { useState } from "react";
import type { AppUser, SessionUser } from "@/lib/types";
import { StatusPill } from "./StatusPill";

export function AuthGate({
  users,
  currentUser,
  onLogin,
  children,
}: {
  users: AppUser[];
  currentUser: SessionUser | null;
  onLogin: (user: SessionUser) => void;
  children: React.ReactNode;
}) {
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");

  if (currentUser) return <>{children}</>;

  function loginAs(user: AppUser) {
    if (user.status === "Disabled") return;

    onLogin({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  }

  function manualLogin() {
    if (!manualName.trim() || !manualEmail.trim()) return;

    onLogin({
      id: Date.now(),
      name: manualName.trim(),
      email: manualEmail.trim(),
      role: "Owner",
    });
  }

  return (
    <main className="min-h-screen bg-[#f7f5fb] p-6 text-slate-950">
      <div className="mx-auto grid min-h-[calc(100vh-48px)] max-w-6xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[40px] bg-gradient-to-br from-[#070717] via-[#1e1b4b] to-[#581c87] p-10 text-white shadow-2xl">
          <div className="text-xs font-black uppercase tracking-[0.55em] text-fuchsia-300">
            VYRON REACH
          </div>

          <h1 className="mt-6 text-5xl font-black tracking-tight">
            Marketing command centre login
          </h1>

          <p className="mt-5 max-w-xl text-sm leading-7 text-purple-100">
            Access campaigns, leads, outreach, content planning, reporting and ROI control from one serious business workspace.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {["Campaigns", "Leads", "ROI"].map((item) => (
              <div key={item} className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <div className="text-lg font-black">{item}</div>
                <div className="mt-2 text-xs font-bold text-purple-200">Controlled workspace</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[40px] border border-purple-100 bg-white p-8 shadow-[0_20px_40px_rgba(88,28,135,0.08)]">
          <h2 className="text-3xl font-black">Choose demo user</h2>
          <p className="mt-2 text-sm text-slate-500">
            This is demo authentication. Real Supabase auth comes in the next block.
          </p>

          <div className="mt-6 space-y-3">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => loginAs(user)}
                disabled={user.status === "Disabled"}
                className="w-full rounded-3xl border border-purple-100 bg-purple-50/60 p-4 text-left transition hover:bg-purple-100 disabled:opacity-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-black">{user.name}</div>
                    <div className="mt-1 text-sm text-slate-500">{user.email}</div>
                  </div>
                  <div className="flex gap-2">
                    <StatusPill value={user.role} />
                    <StatusPill value={user.status} />
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 rounded-3xl border border-purple-100 bg-purple-50/50 p-5">
            <div className="text-sm font-black">Manual demo login</div>
            <div className="mt-4 grid gap-3">
              <input
                value={manualName}
                onChange={(event) => setManualName(event.target.value)}
                placeholder="Your name"
                className="rounded-2xl border border-purple-100 bg-white px-4 py-3 text-sm font-bold outline-none"
              />
              <input
                value={manualEmail}
                onChange={(event) => setManualEmail(event.target.value)}
                placeholder="Email"
                className="rounded-2xl border border-purple-100 bg-white px-4 py-3 text-sm font-bold outline-none"
              />
              <button
                onClick={manualLogin}
                className="rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 py-4 text-sm font-black text-white"
              >
                Continue
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}