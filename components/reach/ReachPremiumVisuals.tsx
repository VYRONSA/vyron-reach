'use client'

type PlatformCardProps = {
  name: string
  subtitle: string
  icon: string
  className: string
  onClick?: () => void
}

export function ReachCinematicHero({
  eyebrow = 'VYRON REACH · AI MARKETING',
  title = 'Marketing that looks expensive',
  subtitle = 'Create premium campaigns, prepare perfect ChatGPT prompts, upload final adverts, approve and launch.',
}: {
  eyebrow?: string
  title?: string
  subtitle?: string
}) {
  return (
    <section className="vyron-reach-cinematic-hero">
      <div className="vyron-reach-eyebrow">{eyebrow}</div>
      <h1 className="vyron-reach-title">{title}</h1>
      <p className="vyron-reach-subtitle">{subtitle}</p>
      <div className="vyron-reach-status">
        <span />
        Ready for Campaigns
      </div>

      <div className="vyron-reach-device-stage">
        <div className="vyron-reach-laptop">
          <div className="vyron-reach-laptop-grid">
            <div className="vyron-reach-ui-card"><strong>+24%</strong><small>Reach</small></div>
            <div className="vyron-reach-ui-card"><strong>3.2x</strong><small>ROI</small></div>
            <div className="vyron-reach-ui-card"><strong>148</strong><small>Leads</small></div>
            <div className="vyron-reach-ui-card"><strong>SEO</strong><small>Growing</small></div>
            <div className="vyron-reach-ui-card"><strong>Ads</strong><small>Ready</small></div>
            <div className="vyron-reach-ui-card"><strong>AI</strong><small>Director</small></div>
          </div>
        </div>
        <div className="vyron-reach-phone">
          <div className="vyron-reach-phone-line" />
          <div className="vyron-reach-phone-line" />
          <div className="vyron-reach-phone-line" />
          <div className="vyron-reach-phone-button" />
        </div>
      </div>
    </section>
  )
}

export function ReachFeatureRow() {
  const items = [
    ['Campaigns', 'Create premium campaign briefs and perfect ChatGPT handoff prompts.'],
    ['Creatives', 'Upload, approve and manage final advert visuals per client.'],
    ['Google Ads', 'Prepare launch-ready ad copy, keywords and setup instructions.'],
    ['Reports', 'Track approval, launch status and marketing performance.'],
  ]

  return (
    <div className="vyron-reach-feature-row">
      {items.map(([title, note]) => (
        <div key={title} className="vyron-reach-feature-card">
          <b>{title}</b>
          <span>{note}</span>
        </div>
      ))}
    </div>
  )
}

export function PlatformCard({ name, subtitle, icon, className, onClick }: PlatformCardProps) {
  return (
    <button type="button" onClick={onClick} className={`vyron-reach-platform-card ${className}`}>
      <div className="platform-icon">{icon}</div>
      <h3>{name}</h3>
      <p>{subtitle}</p>
    </button>
  )
}

export function ReachPlatformGrid({ onSelect }: { onSelect?: (platform: string) => void }) {
  const platforms = [
    ['Facebook', 'Feed ads, posters and campaign launches', 'f', 'platform-facebook'],
    ['Instagram', 'Stories, reels and visual social campaigns', '◎', 'platform-instagram'],
    ['Google Ads', 'Search ads, keywords and launch setup', 'G', 'platform-google'],
    ['LinkedIn', 'Corporate B2B posts and sponsored campaigns', 'in', 'platform-linkedin'],
    ['WhatsApp', 'Status promos and direct client messages', '☏', 'platform-whatsapp'],
    ['SEO', 'Ranking campaigns, content and landing pages', '⌕', 'platform-seo'],
  ]

  return (
    <div className="vyron-reach-platform-grid">
      {platforms.map(([name, subtitle, icon, className]) => (
        <PlatformCard
          key={name}
          name={name}
          subtitle={subtitle}
          icon={icon}
          className={className}
          onClick={() => onSelect?.(name)}
        />
      ))}
    </div>
  )
}

export function PremiumCreativeGallery() {
  const ads = [
    ['VYRON CORE IS LIVE', 'Workforce intelligence for South African operations.'],
    ['STOP LOSING PAYROLL HOURS', 'Smart clocking, AI HR and real-time insights.'],
    ['THE FUTURE OF WORK', 'One platform. Endless operational control.'],
  ]

  return (
    <div className="vyron-reach-creative-gallery">
      {ads.map(([title, text], index) => (
        <div key={title} className="vyron-reach-ad-preview">
          <div className="vyron-reach-ad-art">
            <div className="vyron-reach-eyebrow">Campaign 0{index + 1}</div>
            <h2>{title}</h2>
            <p>{text}</p>
          </div>
          <div className="vyron-reach-ad-actions">
            <button className="vyron-reach-button-primary">Approve</button>
            <button className="vyron-reach-button-ghost">Revise</button>
          </div>
        </div>
      ))}
    </div>
  )
}
