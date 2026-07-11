import { describe, expect, it } from 'vitest'
import { CHATTANOOGA_37405_START } from './config'
import { resolveInitialDirection } from './routeDirection'

describe('custom route starting direction', () => {
  it('heads south first from Chattanooga for a winter trip', () => {
    expect(
      resolveInitialDirection('seasonal', 1, CHATTANOOGA_37405_START),
    ).toBe('south')
  })

  it('heads north first in summer and stays efficient in shoulder seasons', () => {
    expect(
      resolveInitialDirection('seasonal', 7, CHATTANOOGA_37405_START),
    ).toBe('north')
    expect(
      resolveInitialDirection('seasonal', 4, CHATTANOOGA_37405_START),
    ).toBeUndefined()
  })

  it('honors an explicit heading in every season', () => {
    expect(
      resolveInitialDirection('west', 1, CHATTANOOGA_37405_START),
    ).toBe('west')
  })
})
