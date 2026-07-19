import { readJsonStore, updateJsonStore } from './fileJsonStore'
import { IDLE_DIRECTOR_STATUS, type DirectorRuntimeStatus } from './directorRuntimeTypes'

const FILE = 'director-runtime.json'

type StatusMap = Record<string, DirectorRuntimeStatus>

export function getDirectorStatus(project: string): DirectorRuntimeStatus {
  return readJsonStore<StatusMap>(FILE, {})[project] ?? { project, ...IDLE_DIRECTOR_STATUS }
}

export function listDirectorStatuses(): DirectorRuntimeStatus[] {
  return Object.values(readJsonStore<StatusMap>(FILE, {}))
}

/** The Director loop's single write path — merges a patch onto whatever status currently exists (defaulting to Idle). Read-modify-write happens inside updateJsonStore's file lock, so two concurrent patches (e.g. two loop instances racing) can never overwrite one another. */
export function patchDirectorStatus(project: string, patch: Partial<Omit<DirectorRuntimeStatus, 'project'>>): DirectorRuntimeStatus {
  const all = updateJsonStore<StatusMap>(FILE, {}, current => {
    const existing = current[project] ?? { project, ...IDLE_DIRECTOR_STATUS }
    const next: DirectorRuntimeStatus = { ...existing, ...patch, project }
    return { ...current, [project]: next }
  })
  return all[project]
}
