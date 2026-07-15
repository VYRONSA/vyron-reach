# ADR-012 - Build Quality Gates Precede Feature Delivery

- Status: Accepted
- Date: 2026-07-09

## Context
VAIOS serves multiple products and must maintain architectural stability and security guarantees across 10+ years. Early defects in code, contracts, or governance become expensive to fix at deployment time. Testing must be comprehensive and mandatory.

## Decision
Build quality gates are **mandatory and precede all feature delivery**:

**Mandatory Quality Gates (9 stages):**
1. **Dependency Validation** - All dependencies available and compatible
2. **Build Validation** - Project compilation succeeds
3. **TypeScript Validation** - Type safety verified (zero type errors)
4. **Contract Validation** - Public contracts conform to specifications
5. **Security Validation** - Security gates pass (no critical vulnerabilities)
6. **Governance Validation** - Governance policies comply
7. **Documentation Validation** - Documentation is complete
8. **Architecture Validation** - Architecture health is acceptable
9. **Release Validation** - Final release readiness confirmed

**Blocking Rules:**
- Any stage failure blocks downstream stages.
- No feature is delivered without passing all mandatory gates.
- Quality gates are non-negotiable. No feature branches, no quick-paths, no exceptions.
- Security gate failures are absolute blockers requiring executive approval to override.

**Evidence Requirements:**
- Every stage produces evidence (logs, reports, test results).
- Evidence is archived and auditable for compliance.
- Build cannot proceed without documented evidence from each stage.

## Consequences

### Positive
- Defects are caught early, before production.
- Code quality and contract compliance become measurable.
- Security posture is verified systematically.
- Multi-product releases are consistent in quality.
- Audit trail enables regulatory compliance verification.

### Negative
- Build timelines can extend if gates fail.
- Requires automation infrastructure for all gates.
- Development velocity may initially decrease due to gate investment.

## Traceability
- Implements: ADR-011 (Contract-first pipeline)
- Supports: ADR-013 (Milestone releasability)
- Related: Batch 5 Testing Framework, QualityGateContract, 9 QualityPipelineStages
