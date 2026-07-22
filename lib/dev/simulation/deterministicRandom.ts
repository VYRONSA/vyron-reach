/**
 * "Support deterministic simulation scenarios" / "Fault timing must be
 * reproducible" — a small seeded PRNG (mulberry32), so a simulation run
 * with the same scenario/load profile/seed always makes the exact same
 * sequence of "does this task fail," "does the CEO delay this approval"
 * choices, in the same order. Never Math.random() anywhere in the
 * Simulation Service.
 */
export function createRng(seed: number): () => number {
  let a = seed >>> 0
  return function next(): number {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** True with probability `rate` (0–1), consuming exactly one draw from `rng` — the one place a simulation turns a configured rate into a yes/no decision. */
export function chance(rng: () => number, rate: number): boolean {
  return rng() < rate
}
