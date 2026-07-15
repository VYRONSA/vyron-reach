# ADR-011 - Build Pipeline Is Contract-First

- Status: Accepted
- Date: 2026-07-09

## Context
VAIOS will be deployed across multiple products and environments over 10-15 years. Without a formalized build pipeline specification, deployment becomes ad-hoc, inconsistent, and difficult to audit. Build processes must be as disciplined as code.

## Decision
The VAIOS build pipeline is **contract-first**:

1. **Pipeline Manifest** - All pipelines are defined declaratively via contracts
2. **Stage Contracts** - Each pipeline stage is a contract with explicit requirements
3. **Quality Gates** - Quality gates are defined as mandatory stage contracts
4. **Evidence Chain** - Every build produces an auditable evidence chain
5. **Stage Dependencies** - Stage dependencies are explicit and validated
6. **Configuration as Contract** - Pipeline configuration is a contract that can be version-controlled and reviewed
7. **Artifact Contracts** - Artifacts are defined with type, retention, and promotion rules
8. **Audit Trail** - Complete audit trail from commit through deployment

**No implicit build behavior.** If it's not in a contract, it's not part of the pipeline.

## Consequences

### Positive
- Build process is auditable and reproducible across environments.
- Pipeline changes are subject to code review and governance.
- Build failures are traceable to specific stage contracts.
- Compliance audits benefit from explicit stage documentation.
- Multi-product deployments are consistent.

### Negative
- Upfront investment in pipeline contract definition.
- Pipeline changes require contract updates before implementation.
- Requires discipline to keep contracts synchronized with reality.

## Traceability
- Supports: ADR-012 (Quality gates precede delivery), ADR-013 (Milestone releasability)
- Related: Batch 6 Build Pipeline, PipelineConfiguration contracts
