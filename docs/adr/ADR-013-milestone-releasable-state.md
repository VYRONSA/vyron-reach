# ADR-013 - Every Milestone Must Leave the Repository in a Releasable State

- Status: Accepted
- Date: 2026-07-09

## Context
VAIOS is a long-lived platform spanning 10-15 years across multiple products. If the repository is ever left in an unreleaseab state, deploying to production becomes a multi-week recovery effort. The repository is an asset that must be maintained in releasable condition at all times.

## Decision
Every milestone must satisfy these **releasability requirements**:

1. **Build succeeds** - Production build with zero errors
2. **TypeScript clean** - Zero TypeScript errors
3. **All tests pass** - Zero test failures (except acknowledged flaky tests)
4. **Security cleared** - All security gates pass with no critical vulnerabilities
5. **Contracts conform** - All public contracts conform to specifications
6. **Governance compliant** - ADRs approved, decisions logged, policies satisfied
7. **Documentation complete** - All changes documented
8. **Architecture healthy** - Architecture health acceptable, drift minimal
9. **Domain Packs certified** - All domain packs pass certification
10. **Release readiness confirmed** - Milestone Quality Report confirms readiness

**Post-Milestone Criteria:**
- Repository is deployable to staging.
- Repository is deployable to production (pending approvals).
- No technical debt is left unacknowledged.
- No known security vulnerabilities remain untracked.
- All blockers are resolved or formally waived.

**Escalation:**
- If any criterion is unmet, the milestone is **not complete**.
- Blockers can be escalated only with executive approval and formal waiver.
- Waivers are time-limited and require resolution by next milestone.

## Consequences

### Positive
- Repository is always in deployable condition.
- Emergency production fixes can be deployed immediately.
- Multi-product releases maintain quality consistency.
- Technical debt is managed explicitly, not deferred indefinitely.
- Regulatory compliance is continuous, not catch-up-at-audit-time.

### Negative
- Development timelines must budget for quality gate completion.
- Incomplete work cannot be merged without completion.
- Technical debt cannot be deferred beyond waiver window.
- Requires discipline to not cut corners at milestone end.

## Traceability
- Implements: ADR-011 (Contract-first pipeline), ADR-012 (Quality gates precede delivery)
- Related: MilestoneQualityReport, ReleaseReadinessStatus, Batch 6 contracts
- Supports: Multi-product deployment strategy, operational continuity
