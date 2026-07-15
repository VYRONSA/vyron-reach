# ADR-005 - Why Domain Packs Are the Only Supported Extension Mechanism

- Status: Accepted
- Date: 2026-07-09

## Context
VAIOS must support extensibility for multiple products with distinct domain behavior. Without a disciplined extension model, direct modifications to VAIOS Core risk architectural drift, version management chaos, and the inability to trace which product depends on which features.

## Decision
Domain Packs are the only supported product extension mechanism. All product-specific behavior—skills, context sources, validation/compliance extensions, workflows, memory, and assets—must be implemented as Domain Pack extensions.

Direct modification of VAIOS Core for product-specific needs is prohibited. Core must remain stable, minimal, and product-agnostic.

## Consequences

### Positive
- VAIOS Core remains minimal, focused, and maintainable over 10-15 years.
- Product onboarding is contract-driven and predictable.
- Cross-product changes do not require core rewrites.
- Each product can evolve at its own pace within its Domain Pack.
- Architectural clarity: "if it's product-specific, it goes in a Domain Pack."

### Negative
- Domain Pack implementation requires more upfront governance.
- Cross-cutting concerns require careful interface design.
- Circular dependencies between Domain Packs must be actively prevented.

## Traceability
- Implements: Frozen Architecture principle
- Supports: ADR-006 (VAIOS Core must remain product-agnostic)
- Related: ADR-001 (Domain Pack adoption strategy)
