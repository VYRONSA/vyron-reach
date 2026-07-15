# ADR-001 - Why VAIOS Uses Domain Packs

- Status: Accepted
- Date: 2026-07-09

## Context
VAIOS must support multiple products with distinct domain behavior while keeping core architecture stable over 10-15 years.

## Decision
VAIOS adopts Domain Packs as the only product extension mechanism. Product-specific skills, context sources, validation/compliance extensions, and workflow extensions are implemented in Domain Packs, not VAIOS Core.

## Consequences
- VAIOS Core remains minimal and reusable.
- Product onboarding becomes contract-driven.
- Cross-product changes no longer require core rewrites.
