# ADR-007 - Domain Pack Versioning and Compatibility Strategy

- Status: Accepted
- Date: 2026-07-09

## Context
Domain Packs depend on VAIOS Core. Core will evolve over years. Domain Packs will also evolve independently. Without a disciplined versioning and compatibility strategy, upgrades become risky, downgrading becomes impossible, and products become locked to specific Core versions with no migration path.

## Decision
Domain Pack versioning follows semantic versioning (MAJOR.MINOR.PATCH). Compatibility is explicitly tracked:

1. **Declared Compatibility**: Each Domain Pack version declares supported VAIOS Core versions.
2. **Mandatory Compatibility Matrix**: Domain Pack versions must maintain a compatibility matrix specifying minimum and optionally maximum VAIOS Core versions.
3. **Breaking Change Policy**: Breaking changes trigger a migration plan. Products are given a deprecation window before enforcement.
4. **Migration Planning**: Version transitions requiring behavioral changes require explicit migration plans.
5. **Downgrade Policy**: Each Domain Pack version specifies whether downgrade is supported, best-effort, or unsupported.
6. **Test Certification**: Version compatibility must be tested and certified before production deployment.

## Compatibility States
- **Compatible**: Domain Pack operates correctly with Core version
- **Incompatible**: Domain Pack cannot operate with Core version
- **Deprecated**: Domain Pack version is superseded but still supported; new deployments should use newer version
- **Unsupported**: Domain Pack version is retired; no longer supported

## Consequences

### Positive
- Products can plan upgrades with clear understanding of impact.
- Core can evolve without freezing product timelines.
- Downgrade paths are explicit and tested.
- Version incompatibilities are caught before production failure.

### Negative
- Domain Packs require more test automation and compatibility validation.
- Deprecation windows require communication and coordination overhead.
- Support for multiple versions increases operational complexity.

## Traceability
- Implements: Versioning governance from Batch 3
- Supports: ADR-005 and ADR-006 (Domain Pack discipline)
- Related: DecisionLedger traceability (decisions linked to Domain Pack versions)
