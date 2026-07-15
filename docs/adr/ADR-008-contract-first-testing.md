# ADR-008 - Contract-First Testing Strategy

- Status: Accepted
- Date: 2026-07-09

## Context
VAIOS spans multiple products and systems over a 10-15 year operational lifetime. Without a disciplined testing approach, accumulated changes can silently break contracts, degrade performance, or introduce security vulnerabilities. Ad-hoc testing is insufficient.

## Decision
VAIOS adopts a **contract-first testing strategy**:

1. **Contracts Define Test Scope** - Public contracts define what must be tested. If it's not in a contract, it's not officially supported.
2. **Test Categories** - Testing is organized into categories: unit, integration, contract conformance, security, performance, compliance, e2e, acceptance.
3. **Explicit Test Ownership** - Every test suite has documented ownership, maintenance responsibility, and review cycles.
4. **Test Evidence Chain** - Tests produce auditable evidence: execution logs, artifacts, metrics, passed/failed artifacts.
5. **Coverage Tracking** - Test coverage is tracked across code, contracts, security gates, and governance policies.
6. **Quality Gates** - Release requires passing quality gates: build, TypeScript, security, contract conformance, documentation, architecture, governance, release readiness.
7. **Mandatory Release Gates** - No release without passing all security gates and quality gates.

## Consequences

### Positive
- Contract breakage is detected early, before production.
- Test coverage becomes an architecture metric, not a vanity metric.
- Test ownership is explicit, making maintenance responsibility clear.
- Quality gates prevent regressions and ensure consistency.
- Evidence chain enables audit and compliance verification.

### Negative
- Upfront investment in test framework and automation.
- Test coverage targets become engineering constraints.
- Quality gates add process overhead during releases.
- Requires discipline to maintain test relevance as contracts evolve.

## Traceability
- Supports: ADR-009 (Security gates mandatory), ADR-010 (Tenant isolation guarantee)
- Related: Batch 5 Testing Framework, Release Readiness contracts
