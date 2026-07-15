'use client'

import {
  generateCampaignIntelligence,
} from '@/lib/campaignIntelligence'

export function CampaignPlanningPage() {
  const result = generateCampaignIntelligence({
    industry: 'Towing Services',
    monthlyBudget: 10000,
    businessAgeMonths: 4,
    websiteStrength: 'New Website',
  })

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-8">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-300">
          CAMPAIGN INTELLIGENCE
        </p>

        <h1 className="mt-3 text-5xl font-black text-white">
          AI Campaign Planning Engine
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
          VYRON REACH intelligently decides campaign priority,
          budget allocation, scaling timing and marketing actions.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-6">
          <h2 className="text-2xl font-black text-white">
            Recommended Campaigns
          </h2>

          <div className="mt-5 space-y-4">
            {result.campaigns.map(campaign => (
              <div
                key={campaign.platform}
                className="rounded-2xl border border-purple-500/15 bg-white/[0.03] p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="text-lg font-black text-white">
                    {campaign.platform}
                  </div>

                  <div className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
                    {campaign.priority}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <Metric
                    label="Objective"
                    value={campaign.objective}
                  />

                  <Metric
                    label="Budget"
                    value={`R${campaign.monthlyBudget.toLocaleString('en-ZA')}`}
                  />

                  <Metric
                    label="Duration"
                    value={`${campaign.recommendedDurationMonths} months`}
                  />
                </div>

                <div className="mt-4 text-sm leading-6 text-slate-300">
                  {campaign.reason}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6">
            <h2 className="text-2xl font-black text-white">
              Warnings
            </h2>

            <div className="mt-5 space-y-3">
              {result.warnings.map(warning => (
                <div
                  key={warning}
                  className="rounded-2xl border border-red-500/20 bg-black/20 p-4 text-sm font-bold text-red-100"
                >
                  {warning}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-6">
            <h2 className="text-2xl font-black text-white">
              Scaling Advice
            </h2>

            <div className="mt-5 space-y-4">
              {result.scalingAdvice.map(advice => (
                <div
                  key={advice.recommendation}
                  className="rounded-2xl border border-emerald-400/20 bg-black/20 p-4"
                >
                  <div className="text-lg font-black text-white">
                    {advice.recommendation}
                  </div>

                  <div className="mt-2 text-sm leading-6 text-emerald-50">
                    {advice.reason}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-6">
        <h2 className="text-2xl font-black text-white">
          Monthly Action Engine
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {result.weeklyActions.map(action => (
            <div
              key={action.week}
              className={`rounded-2xl border p-4 ${
                action.overdueRisk
                  ? 'border-red-500/20 bg-red-500/10'
                  : 'border-purple-500/15 bg-white/[0.03]'
              }`}
            >
              <div className="text-xs font-black uppercase tracking-[0.2em] text-purple-200">
                {action.week}
              </div>

              <div className="mt-2 text-lg font-black text-white">
                {action.title}
              </div>

              <div className="mt-3 text-sm leading-6 text-slate-300">
                {action.description}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function Metric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-purple-500/10 bg-[#05050f] p-3">
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>

      <div className="mt-2 text-sm font-black text-white">
        {value}
      </div>
    </div>
  )
}