"use client";

import Link from "next/link";

const platforms = [
  { name: "Facebook", icon: "f", text: "Premium feed posters, launch ads and story campaigns.", bg: "linear-gradient(135deg,#1877f2,#0b4dc1)" },
  { name: "Instagram", icon: "◎", text: "Story, reel and visual-first creative campaigns.", bg: "linear-gradient(135deg,#f59e0b,#db2777,#4f46e5)" },
  { name: "Google Ads", icon: "G", text: "Buyer-intent campaigns with keywords, copy and launch steps.", bg: "linear-gradient(135deg,#2563eb,#16a34a,#f59e0b)" },
  { name: "LinkedIn", icon: "in", text: "Corporate B2B ads for owners, directors and decision-makers.", bg: "linear-gradient(135deg,#0a66c2,#082f49)" },
];

const campaigns = [
  {
    title: "VYRON CORE IS LIVE",
    sub: "AI workforce command centre for South African businesses.",
    tag: "Facebook Launch",
  },
  {
    title: "STOP LOSING PAYROLL HOURS",
    sub: "Smart clocking, AI HR and payroll-ready workforce data.",
    tag: "Google + Facebook",
  },
  {
    title: "THE FUTURE OF WORK",
    sub: "One platform to run, manage and grow your operations.",
    tag: "LinkedIn B2B",
  },
];

export default function PremiumReachDashboardExamplePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 20% 10%,rgba(147,51,234,.16),transparent 30%),radial-gradient(circle at 85% 20%,rgba(6,182,212,.16),transparent 30%),linear-gradient(135deg,#eef5ff,#fff7ff 55%,#effcff)",
        padding: 30,
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1680,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          gap: 28,
        }}
      >
        <aside
          style={{
            borderRadius: 34,
            padding: 28,
            background:
              "radial-gradient(circle at 20% 0%,rgba(147,51,234,.42),transparent 30%),linear-gradient(180deg,#071133,#07122b 50%,#12071f)",
            color: "white",
            minHeight: "92vh",
            boxShadow: "0 30px 100px rgba(2,6,23,.35)",
            position: "sticky",
            top: 30,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 44 }}>
            <div
              style={{
                width: 70,
                height: 70,
                borderRadius: 22,
                background: "linear-gradient(135deg,#8b5cf6,#06b6d4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
                fontWeight: 950,
              }}
            >
              V
            </div>
            <div>
              <div style={{ fontSize: 38, lineHeight: 1, fontWeight: 950, letterSpacing: 2 }}>REACH</div>
              <div style={{ fontSize: 11, opacity: .65, letterSpacing: 3, marginTop: 8 }}>AI MARKETING PLATFORM</div>
            </div>
          </div>

          {["Dashboard", "Create Campaign", "Creative Studio", "Campaigns", "Clients", "Reports", "Settings"].map((item, i) => (
            <div
              key={item}
              style={{
                marginBottom: 14,
                padding: "18px 20px",
                borderRadius: 18,
                background: i === 0 ? "linear-gradient(135deg,#9333ea,#2563eb)" : "rgba(255,255,255,.055)",
                fontWeight: 850,
                boxShadow: i === 0 ? "0 16px 38px rgba(37,99,235,.24)" : "none",
              }}
            >
              {item}
            </div>
          ))}

          <div
            style={{
              marginTop: 42,
              borderRadius: 26,
              padding: 20,
              background: "linear-gradient(135deg,rgba(139,92,246,.28),rgba(6,182,212,.16))",
              border: "1px solid rgba(255,255,255,.12)",
            }}
          >
            <div style={{ fontSize: 12, letterSpacing: 2, fontWeight: 900, opacity: .7 }}>NEXT STEP</div>
            <div style={{ marginTop: 10, fontSize: 22, fontWeight: 950 }}>Pick platform → ChatGPT → Upload → Approve</div>
          </div>
        </aside>

        <section style={{ display: "grid", gap: 28 }}>
          <div
            style={{
              borderRadius: 42,
              overflow: "hidden",
              background: "white",
              boxShadow: "0 30px 120px rgba(15,23,42,.12)",
              display: "grid",
              gridTemplateColumns: "1fr 560px",
              minHeight: 520,
            }}
          >
            <div style={{ padding: 58 }}>
              <div style={{ color: "#7c3aed", fontSize: 12, fontWeight: 950, letterSpacing: 5 }}>
                VYRON REACH • AI MARKETING COMMAND CENTRE
              </div>

              <h1
                style={{
                  margin: "24px 0 0",
                  fontSize: 82,
                  lineHeight: .9,
                  letterSpacing: "-.07em",
                  fontWeight: 950,
                  color: "#020617",
                }}
              >
                Marketing that looks like a premium agency.
              </h1>

              <p style={{ marginTop: 28, fontSize: 23, lineHeight: 1.45, color: "#475569", fontWeight: 700, maxWidth: 760 }}>
                Create high-end campaign prompts, open ChatGPT, generate the advert, upload the final visual, approve and launch — without complicated workflow clutter.
              </p>

              <div style={{ display: "flex", gap: 16, marginTop: 34, flexWrap: "wrap" }}>
                <button style={primaryButton}>CREATE CAMPAIGN</button>
                <button style={secondaryButton}>UPLOAD CREATIVE</button>
                <Link href="/"><button style={secondaryButton}>BACK TO APP</button></Link>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginTop: 42 }}>
                {[
                  ["Campaigns", "12"],
                  ["Approved", "7"],
                  ["In Review", "3"],
                  ["Launch Ready", "5"],
                ].map(([l, v]) => (
                  <div key={l} style={{ borderRadius: 22, background: "#f8fafc", padding: 20 }}>
                    <div style={{ fontSize: 11, letterSpacing: 2, fontWeight: 900, color: "#64748b" }}>{l}</div>
                    <div style={{ marginTop: 8, fontSize: 34, fontWeight: 950, color: "#020617" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                position: "relative",
                background:
                  "radial-gradient(circle at 65% 28%,rgba(34,211,238,.35),transparent 30%),radial-gradient(circle at 35% 15%,rgba(147,51,234,.38),transparent 32%),linear-gradient(160deg,#050818,#0b1228 58%,#082f49)",
                color: "white",
                padding: 44,
              }}
            >
              <div style={{ position: "absolute", inset: 0, opacity: .18, backgroundImage: "linear-gradient(rgba(255,255,255,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.12) 1px,transparent 1px)", backgroundSize: "42px 42px" }} />
              <div style={{ position: "relative" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                  {[
                    ["Reach", "+24%"],
                    ["Leads", "148"],
                    ["ROI", "3.2x"],
                    ["Spend", "R12k"],
                  ].map(([l, v]) => (
                    <div key={l} style={{ borderRadius: 26, padding: 24, background: "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.12)", backdropFilter: "blur(16px)" }}>
                      <div style={{ opacity: .62, fontWeight: 800 }}>{l}</div>
                      <div style={{ marginTop: 10, fontSize: 42, fontWeight: 950 }}>{v}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 26, borderRadius: 32, padding: 28, background: "linear-gradient(135deg,#7c3aed,#2563eb,#06b6d4)", boxShadow: "0 28px 80px rgba(6,182,212,.20)" }}>
                  <div style={{ fontSize: 42, fontWeight: 950, letterSpacing: "-.05em" }}>AI Campaign Studio</div>
                  <p style={{ fontSize: 17, lineHeight: 1.55, opacity: .9, fontWeight: 700 }}>
                    Facebook, Google, Instagram and LinkedIn creative workflows powered by perfect ChatGPT handoff prompts.
                  </p>
                </div>

                <div style={{ marginTop: 26, borderRadius: 32, background: "rgba(255,255,255,.94)", color: "#020617", padding: 24 }}>
                  <div style={{ fontSize: 12, color: "#7c3aed", fontWeight: 950, letterSpacing: 3 }}>LIVE PREVIEW</div>
                  <div style={{ marginTop: 12, fontSize: 30, fontWeight: 950 }}>VYRON CORE IS LIVE</div>
                  <div style={{ marginTop: 8, color: "#475569", fontWeight: 750 }}>Smart clocking • AI HR • Real-time dashboards</div>
                </div>
              </div>
            </div>
          </div>

          <section style={panel}>
            <div style={eyebrow}>CREATE CAMPAIGN</div>
            <h2 style={sectionTitle}>Choose your platform</h2>
            <p style={sectionSub}>Big simple cards. Click one, create the perfect prompt, open ChatGPT and bring the final advert back.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginTop: 28 }}>
              {platforms.map((p) => (
                <div key={p.name} style={{ borderRadius: 30, overflow: "hidden", boxShadow: "0 22px 70px rgba(15,23,42,.16)" }}>
                  <div style={{ minHeight: 220, padding: 26, color: "white", background: p.bg }}>
                    <div style={{ width: 64, height: 64, borderRadius: 22, background: "rgba(255,255,255,.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 950 }}>{p.icon}</div>
                    <h3 style={{ margin: "26px 0 0", fontSize: 34, lineHeight: 1, fontWeight: 950 }}>{p.name}</h3>
                    <p style={{ fontSize: 15, lineHeight: 1.45, opacity: .86, fontWeight: 750 }}>{p.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={panel}>
            <div style={eyebrow}>CREATIVE STUDIO</div>
            <h2 style={sectionTitle}>Premium advert gallery</h2>
            <p style={sectionSub}>This is where uploaded ChatGPT-generated creatives should live: image-first, approval-first, launch-ready.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22, marginTop: 28 }}>
              {campaigns.map((c, i) => (
                <div key={c.title} style={{ borderRadius: 34, overflow: "hidden", background: "white", boxShadow: "0 25px 80px rgba(15,23,42,.14)" }}>
                  <div
                    style={{
                      minHeight: 430,
                      color: "white",
                      padding: 30,
                      background:
                        i === 0
                          ? "radial-gradient(circle at 70% 20%,rgba(34,211,238,.45),transparent 28%),linear-gradient(145deg,#020617,#082f49)"
                          : i === 1
                          ? "radial-gradient(circle at 30% 20%,rgba(249,115,22,.45),transparent 28%),linear-gradient(145deg,#020617,#3b0764)"
                          : "radial-gradient(circle at 60% 20%,rgba(16,185,129,.42),transparent 28%),linear-gradient(145deg,#020617,#052e16)",
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 950, letterSpacing: 3, color: "#22d3ee" }}>{c.tag}</div>
                    <h3 style={{ margin: "92px 0 0", fontSize: 48, lineHeight: .9, fontWeight: 950, letterSpacing: "-.06em" }}>{c.title}</h3>
                    <p style={{ marginTop: 18, fontSize: 17, lineHeight: 1.45, opacity: .86, fontWeight: 760 }}>{c.sub}</p>
                    <div style={{ marginTop: 26, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div style={miniCard}>Dashboard</div>
                      <div style={miniCard}>Mobile App</div>
                      <div style={miniCard}>AI HR</div>
                      <div style={miniCard}>Insights</div>
                    </div>
                  </div>
                  <div style={{ padding: 18, display: "flex", gap: 10 }}>
                    <button style={primaryButton}>APPROVE</button>
                    <button style={secondaryButton}>REVISE</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

const primaryButton = {
  border: "none",
  borderRadius: 18,
  padding: "16px 24px",
  background: "linear-gradient(135deg,#9333ea,#2563eb)",
  color: "white",
  fontWeight: 950,
  cursor: "pointer",
};

const secondaryButton = {
  border: "1px solid #dbe4ef",
  borderRadius: 18,
  padding: "16px 24px",
  background: "white",
  color: "#07122b",
  fontWeight: 950,
  cursor: "pointer",
};

const panel = {
  borderRadius: 42,
  background: "rgba(255,255,255,.82)",
  padding: 38,
  boxShadow: "0 30px 110px rgba(15,23,42,.10)",
  backdropFilter: "blur(18px)",
};

const eyebrow = {
  color: "#7c3aed",
  fontSize: 12,
  fontWeight: 950,
  letterSpacing: 4,
};

const sectionTitle = {
  margin: "12px 0 0",
  fontSize: 56,
  lineHeight: 1,
  letterSpacing: "-.06em",
  fontWeight: 950,
  color: "#020617",
};

const sectionSub = {
  marginTop: 14,
  color: "#64748b",
  fontSize: 18,
  lineHeight: 1.5,
  fontWeight: 750,
  maxWidth: 900,
};

const miniCard = {
  borderRadius: 16,
  background: "rgba(255,255,255,.10)",
  border: "1px solid rgba(255,255,255,.14)",
  padding: 14,
  fontWeight: 850,
};
