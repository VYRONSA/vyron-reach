# ADR-002 - Why Reasoning Must Precede Generation

- Status: Accepted
- Date: 2026-07-09

## Context
Direct generation without strategic reasoning can produce well-written but misaligned outputs, increasing quality and compliance risk.

## Decision
VAIOS enforces a staged pipeline where planning and reasoning produce locked artifacts before any content generation is allowed.

## Consequences
- Strategic alignment becomes auditable and reproducible.
- Validation quality improves due to explicit intent artifacts.
- Tail latency may increase, but output reliability improves.
