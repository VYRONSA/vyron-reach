'use client'

type SystemSettingsPageProps = {
  resetData?: () => void
  connectionStatus?: string
  dataLoading?: boolean
  dataError?: string
}

export function SystemSettingsPage({
  resetData,
  connectionStatus = 'Live Connected',
  dataLoading,
  dataError,
}: SystemSettingsPageProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-8">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-300">
          INTERNAL SETTINGS
        </p>

        <h1 className="mt-3 text-4xl font-black text-white">
          Operator Mode Enabled
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
          VYRON REACH is now an internal service delivery, marketing and reporting command centre.
          Clients do not use this software. You use it to do the work and send them reports.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SettingCard title="User Type" value="Internal Only" />
        <SettingCard title="Client Access" value="Disabled" />
        <SettingCard title="Primary Output" value="Reports" />
        <SettingCard title="Connection" value={dataLoading ? 'Syncing' : connectionStatus} />
      </section>

      <section className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-6">
        <h2 className="text-2xl font-black text-white">
          What Stays
        </h2>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <Rule text="Command Centre — your internal operating dashboard" />
          <Rule text="Clients / Leads — companies you manage" />
          <Rule text="Pipeline — proposals, onboarding and work stages" />
          <Rule text="Campaigns — marketing you run internally" />
          <Rule text="Reports — outputs you send to clients" />
          <Rule text="System Settings — control and health" />
        </div>

        <h2 className="mt-8 text-2xl font-black text-white">
          What Is Removed From Focus
        </h2>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <Rule text="Client portals" />
          <Rule text="Client dashboards" />
          <Rule text="Client login workflows" />
          <Rule text="Customer-facing task systems" />
          <Rule text="External collaboration modules" />
          <Rule text="Anything that makes the client operate the software" />
        </div>

        {dataError ? (
          <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">
            {dataError}
          </div>
        ) : null}

        <button
          onClick={resetData}
          className="mt-6 rounded-2xl border border-purple-400/30 bg-purple-500/20 px-5 py-3 text-sm font-black text-purple-100 hover:bg-purple-500/30"
        >
          Refresh Workspace
        </button>
      </section>
    </div>
  )
}

function SettingCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-6">
      <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">{title}</div>
      <div className="mt-4 text-xl font-black text-white">{value}</div>
    </div>
  )
}

function Rule({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-purple-500/15 bg-white/[0.03] p-4 text-sm font-bold leading-6 text-slate-300">
      {text}
    </div>
  )
}
