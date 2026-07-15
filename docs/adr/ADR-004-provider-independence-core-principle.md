# ADR-004 - Why Provider Independence Is a Core Principle

- Status: Accepted
- Date: 2026-07-09

## Context
Vendor lock-in increases long-term cost, operational risk, and product coupling across the VYRON platform.

## Decision
VAIOS uses provider-agnostic contracts with adapter-based integrations so model providers can be added, replaced, or routed per policy without changing product logic.

## Consequences
- Reduced lock-in risk and better cost control.
- Easier failover and resilience under provider outages.
- Additional adapter maintenance overhead is accepted.
