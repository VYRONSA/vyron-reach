import { readJsonStore, updateJsonStore } from './fileJsonStore'
import { IDLE_DIRECTOR_STATUS, type DirectorRuntimeStatus } from './directorRuntimeTypes'
import { publish } from '../events/eventBus'

const FILE = 'director-runtime.json'

type StatusMap = Record<string, DirectorRuntimeStatus>

export function getDirectorStatus(project: string): DirectorRuntimeStatus {
  return readJsonStore<StatusMap>(FILE, {})[project] ?? { project, ...IDLE_DIRECTOR_STATUS }
}

export function listDirectorStatuses(): DirectorRuntimeStatus[] {
  return Object.values(readJsonStore<StatusMap>(FILE, {}))
}

/**
 * PRA-P1-018 — the one place that answers "is this specific inbox item
 * the actual reason this project is paused right now?" Previously,
 * resolving/dismissing ANY Open inbox item for a project unconditionally
 * resumed it, even a stale or unrelated item that had nothing to do with
 * why the project is currently waiting (project-level items like
 * Release/Rollback/Incident are never deduplicated, so more than one can
 * be Open at once). A resume should only ever follow from clearing the
 * item actually recorded as the blocker.
 */
export function isCurrentInboxBlocker(project: string, inboxItemId: string): boolean {
  return getDirectorStatus(project).waitingInboxItemId === inboxItemId
}

/** The Director loop's single write path — merges a patch onto whatever status currently exists (defaulting to Idle). Read-modify-write happens inside updateJsonStore's file lock, so two concurrent patches (e.g. two loop instances racing) can never overwrite one another. */
export function patchDirectorStatus(project: string, patch: Partial<Omit<DirectorRuntimeStatus, 'project'>>): DirectorRuntimeStatus {
  const all = updateJsonStore<StatusMap>(FILE, {}, current => {
    const existing = current[project] ?? { project, ...IDLE_DIRECTOR_STATUS }
    const next: DirectorRuntimeStatus = { ...existing, ...patch, project }
    return { ...current, [project]: next }
  })
  const result = all[project]

  // The single write path for Director status — publishing here, rather
  // than at each of the loop's many call sites, covers every future
  // caller automatically. 'state' transitions also get their own
  // 'Project Status' event: that field is what "is this project OK right
  // now" actually reduces to for the dashboard's top-level view.
  publish({ category: 'Engineering Director', project, type: 'status-changed', payload: { state: result.state } })
  if (patch.state !== undefined) {
    publish({ category: 'Project Status', project, type: 'director-state-changed', payload: { state: patch.state } })
  }

  return result
}
