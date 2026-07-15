'use client'

import Link from 'next/link'

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold tracking-[0.3em] text-purple-500">VYRON REACH</p>
          <h1 className="mt-3 text-4xl font-black text-slate-950">Settings</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-500">
            Manage demo setup, workspace tools and system configuration.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-2">
          <SettingsCard
            title="Demo Data Generator"
            description="Generate realistic leads, campaigns, tasks and content for client demos."
            href="/demo-data"
            button="Open Generator"
          />

          <SettingsCard
            title="Dashboard"
            description="Return to the VYRON REACH marketing command centre."
            href="/"
            button="Open Dashboard"
          />

          <SettingsCard
            title="Leads"
            description="Manage your sales and marketing leads."
            href="/leads"
            button="Open Leads"
          />

          <SettingsCard
            title="Campaigns"
            description="Manage campaign budgets and statuses."
            href="/campaigns"
            button="Open Campaigns"
          />
        </section>
      </div>
    </main>
  )
}

function SettingsCard({
  title,
  description,
  href,
  button,
}: {
  title: string
  description: string
  href: string
  button: string
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black text-slate-950">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">{description}</p>

      <Link
        href={href}
        className="mt-5 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
      >
        {button}
      </Link>
    </div>
  )
}