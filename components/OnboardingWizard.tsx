"use client";

import { useState } from "react";
import type { AppData, Workspace } from "@/lib/types";
import { TextInput } from "./FormControls";
import { StatusPill } from "./StatusPill";

export function OnboardingWizard({
  appData,
  onComplete,
  onSkip,
}: {
  appData: AppData;
  onComplete: (workspace: Workspace) => void;
  onSkip: () => void;
}) {
  const [step, setStep] = useState(1);
  const [workspace, setWorkspace] = useState<Workspace>({
    ...appData.workspace,
    status: "Market Ready",
  });

  function finish() {
    onComplete({
      ...workspace,
      onboardingComplete: true,
      status: "Market Ready",
    });
  }

  return (
    <main className="min-h-screen bg-[#eef1f7] p-4 md:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl overflow-hidden rounded-[40px] bg-white shadow-2xl lg:grid-cols-[0.85fr_1.15fr]">
        <section className="bg-gradient-to-br from-[#050b18] via-[#071326] to-[#581c87] p-8 text-white md:p-12">
          <div className="text-xs font-black uppercase tracking-[0.55em] text-fuchsia-300">
            VYRON REACH
          </div>

          <h1 className="mt-8 text-5xl font-black leading-[0.95] tracking-tight">
            Set up your
            <br />
            market-ready workspace
          </h1>

          <p className="mt-8 max-w-xl text-sm leading-7 text-purple-100">
            This setup makes the app client-ready by configuring the company profile, ROI target and first workspace identity.
          </p>

          <div className="mt-12 space-y-4">
            <OnboardingStatus label="Company profile" active={step === 1} done={step > 1} />
            <OnboardingStatus label="ROI control" active={step === 2} done={step > 2} />
            <OnboardingStatus label="Launch confirmation" active={step === 3} done={false} />
          </div>
        </section>

        <section className="flex items-center p-8 md:p-12">
          <div className="w-full">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.35em] text-fuchsia-600">
                  Step {step} of 3
                </div>
                <h2 className="mt-3 text-4xl font-black">
                  {step === 1 && "Company details"}
                  {step === 2 && "Marketing targets"}
                  {step === 3 && "Ready to launch"}
                </h2>
              </div>

              <button onClick={onSkip} className="rounded-2xl bg-slate-100 px-4 py-3 text-xs font-black text-slate-700">
                Skip setup
              </button>
            </div>

            {step === 1 && (
              <div className="grid gap-4">
                <TextInput
                  value={workspace.companyName}
                  setValue={(value) => setWorkspace({ ...workspace, companyName: value })}
                  placeholder="Company name"
                />
                <TextInput
                  value={workspace.industry}
                  setValue={(value) => setWorkspace({ ...workspace, industry: value })}
                  placeholder="Industry"
                />
                <TextInput
                  value={workspace.contactEmail}
                  setValue={(value) => setWorkspace({ ...workspace, contactEmail: value })}
                  placeholder="Main contact email"
                />

                <button onClick={() => setStep(2)} className="mt-4 rounded-2xl bg-slate-950 py-4 text-sm font-black text-white">
                  Continue
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-4">
                <TextInput
                  value={workspace.currency}
                  setValue={(value) => setWorkspace({ ...workspace, currency: value })}
                  placeholder="Currency e.g. ZAR"
                />
                <TextInput
                  value={String(workspace.roiTarget)}
                  setValue={(value) => setWorkspace({ ...workspace, roiTarget: Number(value) || 0 })}
                  placeholder="ROI target e.g. 4"
                />

                <div className="rounded-3xl border border-purple-100 bg-purple-50 p-5">
                  <div className="font-black">Recommended target</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    For sales demos, a 4.0x ROI target makes the dashboard feel valuable and immediately commercial.
                  </p>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <button onClick={() => setStep(1)} className="rounded-2xl bg-slate-100 py-4 text-sm font-black">
                    Back
                  </button>
                  <button onClick={() => setStep(3)} className="rounded-2xl bg-slate-950 py-4 text-sm font-black text-white">
                    Continue
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="grid gap-4 md:grid-cols-2">
                  <SummaryCard label="Company" value={workspace.companyName} />
                  <SummaryCard label="Industry" value={workspace.industry} />
                  <SummaryCard label="Currency" value={workspace.currency} />
                  <SummaryCard label="ROI Target" value={`${workspace.roiTarget.toFixed(1)}x`} />
                </div>

                <div className="mt-6 rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-black">Workspace will be marked Market Ready</div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        You can now use this as a client demo, internal test workspace, or sales presentation environment.
                      </p>
                    </div>
                    <StatusPill value="Market Ready" />
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <button onClick={() => setStep(2)} className="rounded-2xl bg-slate-100 py-4 text-sm font-black">
                    Back
                  </button>
                  <button onClick={finish} className="rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 py-4 text-sm font-black text-white">
                    Finish Setup
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function OnboardingStatus({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <div className={`rounded-3xl border p-5 ${active ? "border-fuchsia-400 bg-white/15" : "border-white/10 bg-white/10"}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="font-black">{label}</div>
        <StatusPill value={done ? "Done" : active ? "Active" : "Pending"} />
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-purple-100 bg-purple-50 p-5">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-purple-500">{label}</div>
      <div className="mt-2 text-xl font-black">{value}</div>
    </div>
  );
}