import { describe, expect, it } from 'vitest'
import { instagramHandle, instagramProfileUrl } from './contact'

describe('Instagram profile links', () => {
  it('accepts a handle or a profile link', () => {
    expect(instagramProfileUrl('@road.trip_anthony')).toBe('https://www.instagram.com/road.trip_anthony/')
    expect(instagramProfileUrl('roadtrip')).toBe('https://www.instagram.com/roadtrip/')
    expect(instagramProfileUrl('https://instagram.com/roadtrip?igsh=abc')).toBe('https://www.instagram.com/roadtrip/')
    expect(instagramHandle('https://www.instagram.com/roadtrip/')).toBe('@roadtrip')
  })

  it('rejects things that are not a handle', () => {
    expect(instagramProfileUrl('')).toBeUndefined()
    expect(instagramProfileUrl('not a handle!')).toBeUndefined()
  })
})
