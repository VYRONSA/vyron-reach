import { readJsonStore, updateJsonStore } from '../director/fileJsonStore'
import type { InitiationEvent } from './initiationTypes'

/** Append-only audit log for InitiationRequest transitions — same flat-array shape as initiationStore.ts. Never mutated or deleted once written. */
const FILE = 'initiation-events.json'

export function appendInitiationEvent(event: InitiationEvent): InitiationEvent {
  updateJsonStore<InitiationEvent[]>(FILE, [], current => [event, ...current])
  return event
}

export function listInitiationEvents(initiationId: string): InitiationEvent[] {
  return readJsonStore<InitiationEvent[]>(FILE, []).filter(e => e.initiationId === initiationId)
}
