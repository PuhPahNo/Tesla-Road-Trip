import { PLACE_CATALOG } from './placeCatalog'
import type { Coordinate } from './types'

/**
 * A "must-see" destination that certifies a state as properly visited.
 * If a Longest Trip route stops in the state, it should also pass within
 * `radiusMiles` of at least one of the state's signatures.
 */
export interface StateSignature {
  id: string
  label: string
  position: Coordinate
  radiusMiles: number
}

/**
 * Signature landmarks and cities per state (lower 48 + DC). Entries are
 * derived from the shared place catalog so custom routes, Route Copilot,
 * state detail, ratings, and optimizer guarantees all speak the same
 * destination language.
 */
export const STATE_SIGNATURES: Record<string, StateSignature[]> =
  PLACE_CATALOG.filter((entry) => entry.signature)
    .sort((a, b) => b.priority - a.priority || a.label.localeCompare(b.label))
    .reduce<Record<string, StateSignature[]>>((byState, entry) => {
      byState[entry.state] = [
        ...(byState[entry.state] ?? []),
        {
          id: entry.id,
          label: entry.label,
          position: entry.position,
          radiusMiles: entry.radiusMiles,
        },
      ]
      return byState
    }, {})
