# ADR-006 - Why VAIOS Core Must Remain Product-Agnostic

- Status: Accepted
- Date: 2026-07-09

## Context
VAIOS serves multiple products (Vyron Reach, Vyron Cost, Vyron Safe, Vyron Farm, Child Compass). If Core is designed around product-specific concepts, decisions, data models, or workflows, it becomes tightly coupled to one product and inhibits reuse across others.

## Decision
VAIOS Core must not contain:
- Product-specific skills or domain logic
- Product-specific context providers or memory models
- Product-specific compliance or validation rules
- Product-specific workflow orchestration
- Assumptions about product domain, market, or customer segments

VAIOS Core must provide only:
- Universal contract interfaces
- Cross-cutting reasoning and planning infrastructure
- Provider independence and routing
- Tenant isolation and security boundaries
- Event governance and audit trails
- Multi-step reasoning orchestration

## Consequences

### Positive
- VAIOS Core can be independently tested, versioned, and deployed.
- New products can adopt VAIOS Core without inheriting constraints from other products.
- Core remains stable across 10+ year operational lifetime.
- Engineering changes to core are justified on universal grounds, not product needs.

### Negative
- Core development requires discipline: features must benefit all products.
- Products must invest in Domain Pack development to realize domain-specific value.
- Feature requests from products must pass scrutiny for core relevance.

## Traceability
- Implements: Frozen Architecture principle
- Supported by: ADR-005 (Domain Packs as only extension mechanism)
- Related: ADR-001 (Domain Pack adoption strategy)
