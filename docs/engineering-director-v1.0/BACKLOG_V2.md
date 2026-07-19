# VYRON DEV Engineering Director — Version 2.0 Backlog

Every future idea surfaced during v1.0 development and validation, moved here rather than acted on. Version 1.0 is frozen — none of these are scheduled; they are candidates for future v2.x milestones.

1. **Real-time dashboard updates.** Replace the Live Engineering Command Centre's and Global Engineering Inbox's polling with push-based updates (SSE/WebSocket) for lower latency and reduced request volume.

2. **Full Quality Gates / Risk Assessment / Multi-Agent Workforce in headless mode.** Port (or build server-native equivalents of) the browser-attended pipelines so autonomous intervention detection reaches the same fidelity as manual execution, and `Engineering Health`/`Risk Level` are genuinely computed rather than `Unknown`.

3. **Live knowledge refresh during a run.** Let decisions/technical-debt/risk updates made in the browser mid-run reach an already-executing autonomous project, instead of freezing them at hand-off time.

4. **Full Knowledge Update Engine integration for headless completions.** Reconcile `ExecutionSnapshot.completions` with real Handover/architecture-decision/technical-debt/risk/journal records, likely requiring the planning-state migration below.

5. **Migrate planning state off localStorage.** Move projects/milestones/batches/decisions/technical debt/risk to a durable server-side (or database) store, enabling a true "Create Project → Generate Roadmap → Generate Batches" flow that doesn't require a one-time browser hand-off, and removing the root architectural reason headless execution needed a snapshot model at all.

6. **Engineering Inbox escalation policy.** Reminders, timeouts, or auto-escalation (e.g., to a different notification severity or channel) for items left `Open` beyond a configurable window.

7. **Cross-project execution scheduling.** A policy for how multiple projects' autonomous loops are prioritized/throttled relative to each other, beyond "each project's loop runs independently."

8. **Real WhatsApp and Email notification providers.** Replace the registered-but-disabled placeholders with actual integrations (e.g., Twilio/Meta Cloud API for WhatsApp; Resend/SES/SMTP for Email) — the provider interface and event architecture are already correct for this.

9. **Automated test suite.** Coverage for the Director loop, locking primitives, recovery bootstrap, and state-machine enforcement, so regressions are caught by CI rather than requiring a repeat of manual/live validation.

10. **Pagination and archiving.** For the Engineering Inbox, execution history, and in-app notifications, once real-world history volume warrants it.
