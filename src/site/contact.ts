export const ANTHONY_EMAIL = 'anthony@antelligentprojects.dev'
export const ANTHONY_EMAIL_HREF = `mailto:${ANTHONY_EMAIL}`

/** Turns "@handle", "handle" or a profile link into a canonical profile URL. */
export function instagramProfileUrl(input: string | null | undefined) {
  const value = input?.trim()
  if (!value) return undefined
  const match =
    value.match(/instagram\.com\/([A-Za-z0-9_.]+)/i) ?? value.match(/^@?([A-Za-z0-9_.]{1,30})$/)
  return match ? `https://www.instagram.com/${match[1]}/` : undefined
}

export function instagramHandle(url: string | null | undefined) {
  const match = url?.match(/instagram\.com\/([A-Za-z0-9_.]+)/i)
  return match ? `@${match[1]}` : undefined
}
