import { useEffect, useState } from 'react'

/**
 * Object URLs for a pair of blobs.
 *
 * Every blob handed out as a URL is a copy of the image held alive until it is
 * revoked, and this app re-renders two multi-megabyte sheets on every tweak of
 * a slider. So the old pair is revoked as soon as a new pair arrives, and again
 * on unmount.
 */
export interface BlobPair {
  readonly directions: Blob
  readonly reactions: Blob
}

export interface UrlPair {
  readonly directions: string
  readonly reactions: string
}

export function useBlobUrls(pair: BlobPair | null): UrlPair | null {
  const [urls, setUrls] = useState<UrlPair | null>(null)

  useEffect(() => {
    if (pair === null) {
      setUrls(null)
      return undefined
    }
    const made: UrlPair = {
      directions: URL.createObjectURL(pair.directions),
      reactions: URL.createObjectURL(pair.reactions),
    }
    setUrls(made)
    return () => {
      URL.revokeObjectURL(made.directions)
      URL.revokeObjectURL(made.reactions)
    }
  }, [pair])

  return urls
}
