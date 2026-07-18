import { useEffect, useMemo, useState } from 'react'
import { createExecutionService, type ExecutionServiceDeps, type ExecutionState } from '@/lib/dev/runtime/executionService'

/**
 * React adapter for the (framework-agnostic) Execution Service — creates
 * one service instance per mount, subscribes to its state, and tears the
 * poll loop down on unmount via dismiss(). Deps are captured once at
 * creation (the service reads them fresh from closures on each call), not
 * treated as reactive inputs — the same convention MissionControl already
 * used for session/dependencies/memory/queue before this extraction.
 */
export function useExecutionService(deps: ExecutionServiceDeps) {
  const service = useMemo(() => createExecutionService(deps), [deps.slug])
  const [state, setState] = useState<ExecutionState>(() => service.getState())

  useEffect(() => {
    const unsubscribe = service.subscribe(setState)
    return () => {
      unsubscribe()
      service.dismiss()
    }
  }, [service])

  return { state, service }
}
