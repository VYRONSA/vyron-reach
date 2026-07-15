# ADR-003 - Why Event Governance Is Contract-First

- Status: Accepted
- Date: 2026-07-09

## Context
Event-driven systems become fragile when naming, versioning, and envelope rules are introduced after implementation.

## Decision
VAIOS defines event taxonomy, naming, versioning, identity strategy, replay, idempotency, DLQ, and retention as first-class contracts before runtime infrastructure is built.

## Consequences
- Event compatibility becomes enforceable.
- Replay and audit safety are defined before scaling.
- Worker and telemetry integration can evolve without contract drift.
